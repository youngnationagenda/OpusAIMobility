/**
 * TerraCarbon unit tests — TERRA-030
 * Run: npx hardhat test
 */

const { expect }  = require('chai');
const { ethers }  = require('hardhat');

describe('TerraCarbon', () => {
  let contract, owner, minter, rider1, rider2;

  beforeEach(async () => {
    [owner, minter, rider1, rider2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('TerraCarbon');
    contract = await Factory.deploy(owner.address);
    await contract.waitForDeployment();

    // Grant MINTER_ROLE to minter wallet (simulates Lambda)
    const MINTER_ROLE = await contract.MINTER_ROLE();
    await contract.grantRole(MINTER_ROLE, minter.address);
  });

  // ── Deployment ───────────────────────────────────────────────────────────
  describe('Deployment', () => {
    it('should have correct name and symbol', async () => {
      expect(await contract.name()).to.equal('TerraCarbon');
      expect(await contract.symbol()).to.equal('TCRBN');
    });

    it('should set market rate to $0.52', async () => {
      expect(await contract.marketRateUSD()).to.equal(520000);
    });

    it('owner has all roles', async () => {
      const DEFAULT_ADMIN = await contract.DEFAULT_ADMIN_ROLE();
      const MINTER        = await contract.MINTER_ROLE();
      expect(await contract.hasRole(DEFAULT_ADMIN, owner.address)).to.be.true;
      expect(await contract.hasRole(MINTER, owner.address)).to.be.true;
    });
  });

  // ── Minting ──────────────────────────────────────────────────────────────
  describe('mintForTrip', () => {
    it('mints 0.5 TCRBN per km', async () => {
      await contract.connect(minter).mintForTrip(rider1.address, 10, 'TRP-001', 'ev-rider-001');
      const balance = await contract.balanceOf(rider1.address);
      expect(balance).to.equal(ethers.parseEther('5')); // 10km * 0.5 = 5 TCRBN
    });

    it('records trip immutably', async () => {
      await contract.connect(minter).mintForTrip(rider1.address, 8, 'TRP-002', 'ev-rider-001');
      const trip = await contract.getTrip('TRP-002');
      expect(trip.exists).to.be.true;
      expect(trip.distanceKm).to.equal(8n);
      expect(trip.rider).to.equal(rider1.address);
    });

    it('rejects duplicate tripId', async () => {
      await contract.connect(minter).mintForTrip(rider1.address, 5, 'TRP-DUP', 'ev-001');
      await expect(
        contract.connect(minter).mintForTrip(rider1.address, 5, 'TRP-DUP', 'ev-001')
      ).to.be.revertedWith('TerraCarbon: trip already recorded');
    });

    it('enforces daily cap of 100 TCRBN', async () => {
      // 10km * 0.5 * 20 trips = 100 TCRBN cap
      for (let i = 0; i < 20; i++) {
        await contract.connect(minter).mintForTrip(rider1.address, 10, `TRP-CAP-${i}`, 'ev-001');
      }
      const balance = await contract.balanceOf(rider1.address);
      expect(balance).to.equal(ethers.parseEther('100'));

      // 21st trip: cap reached, should mint 0 (revert)
      await expect(
        contract.connect(minter).mintForTrip(rider1.address, 10, 'TRP-OVER', 'ev-001')
      ).to.be.revertedWith('TerraCarbon: daily mint cap reached');
    });

    it('only MINTER_ROLE can mint', async () => {
      await expect(
        contract.connect(rider2).mintForTrip(rider1.address, 5, 'TRP-UNAUTH', 'ev-001')
      ).to.be.reverted;
    });

    it('rejects zero distance', async () => {
      await expect(
        contract.connect(minter).mintForTrip(rider1.address, 0, 'TRP-ZERO', 'ev-001')
      ).to.be.revertedWith('TerraCarbon: distance must be > 0');
    });
  });

  // ── Trading ──────────────────────────────────────────────────────────────
  describe('tradeForOMNI', () => {
    beforeEach(async () => {
      await contract.connect(minter).mintForTrip(rider1.address, 20, 'TRP-TRADE', 'ev-001');
    });

    it('burns tokens on trade', async () => {
      const before = await contract.balanceOf(rider1.address);
      await contract.connect(rider1).tradeForOMNI(ethers.parseEther('5'));
      const after  = await contract.balanceOf(rider1.address);
      expect(before - after).to.equal(ethers.parseEther('5'));
    });

    it('emits CreditsTraded event', async () => {
      await expect(contract.connect(rider1).tradeForOMNI(ethers.parseEther('5')))
        .to.emit(contract, 'CreditsTraded')
        .withArgs(rider1.address, ethers.parseEther('5'), 2600); // $0.52 * 5 = 2.6 → 2600 (6 dec)
    });

    it('rejects below minimum trade (5 TCRBN)', async () => {
      await expect(
        contract.connect(rider1).tradeForOMNI(ethers.parseEther('4'))
      ).to.be.revertedWith('TerraCarbon: below minimum trade amount');
    });

    it('rejects insufficient balance', async () => {
      await expect(
        contract.connect(rider2).tradeForOMNI(ethers.parseEther('5'))
      ).to.be.revertedWith('TerraCarbon: insufficient balance');
    });
  });

  // ── Market rate oracle ────────────────────────────────────────────────────
  describe('updateMarketRate', () => {
    it('oracle can update rate', async () => {
      const ORACLE = await contract.ORACLE_ROLE();
      await contract.grantRole(ORACLE, owner.address);
      await contract.updateMarketRate(600000); // $0.60
      expect(await contract.marketRateUSD()).to.equal(600000);
    });

    it('emits MarketRateUpdated event', async () => {
      const ORACLE = await contract.ORACLE_ROLE();
      await contract.grantRole(ORACLE, owner.address);
      await expect(contract.updateMarketRate(600000))
        .to.emit(contract, 'MarketRateUpdated')
        .withArgs(520000, 600000, owner.address);
    });
  });

  // ── Stats ────────────────────────────────────────────────────────────────
  describe('getStats', () => {
    it('returns correct aggregates', async () => {
      await contract.connect(minter).mintForTrip(rider1.address, 10, 'TRP-STAT1', 'ev-001');
      await contract.connect(minter).mintForTrip(rider2.address, 20, 'TRP-STAT2', 'ev-002');
      const [supply, trips, earned, burned, rate] = await contract.getStats();
      expect(trips).to.equal(2n);
      expect(supply).to.equal(ethers.parseEther('15')); // (10+20)*0.5
      expect(earned).to.equal(ethers.parseEther('15'));
      expect(burned).to.equal(0n);
      expect(rate).to.equal(520000n);
    });
  });

  // ── Pause ────────────────────────────────────────────────────────────────
  describe('Pausable', () => {
    it('owner can pause and unpause', async () => {
      await contract.pause();
      await expect(
        contract.connect(minter).mintForTrip(rider1.address, 5, 'TRP-PAUSE', 'ev-001')
      ).to.be.reverted;
      await contract.unpause();
      await contract.connect(minter).mintForTrip(rider1.address, 5, 'TRP-UNPAUSE', 'ev-001');
      expect(await contract.balanceOf(rider1.address)).to.equal(ethers.parseEther('2.5'));
    });
  });
});
