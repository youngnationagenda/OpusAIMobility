// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * TerraCarbon (TCRBN) — ERC-20 Carbon Credit Token
 * ──────────────────────────────────────────────────
 * TICKET: TERRA-030
 * Network: Celo Alfajores Testnet (chainId: 44787)
 * Mainnet target: Celo Mainnet (chainId: 42220)
 *
 * Token economics:
 *  - 0.5 TCRBN per km ridden on an EV
 *  - Tradeable for OMNI tokens at market rate (~$0.52/credit)
 *  - Immutable trip records on-chain for carbon audit trail
 *  - Minter role held by Lambda (server-side private key)
 *
 * Deployed by: Sonie AI — TERRA-030
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TerraCarbon is ERC20, ERC20Burnable, AccessControl, Pausable {
    using Counters for Counters.Counter;

    // ── Roles ─────────────────────────────────────────────────────────────
    bytes32 public constant MINTER_ROLE  = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE  = keccak256("PAUSER_ROLE");
    bytes32 public constant ORACLE_ROLE  = keccak256("ORACLE_ROLE");

    // ── Token constants ───────────────────────────────────────────────────
    uint256 public constant CREDITS_PER_KM   = 5e17;      // 0.5 TCRBN (18 decimals)
    uint256 public constant MAX_DAILY_MINT   = 100e18;     // 100 TCRBN max per rider per day
    uint256 public constant MIN_TRADE_AMOUNT = 5e18;       // Minimum 5 TCRBN to trade

    // ── State ─────────────────────────────────────────────────────────────
    Counters.Counter private _tripCounter;
    uint256 public marketRateUSD;           // USD per TCRBN * 1e6 (e.g. 520000 = $0.52)
    uint256 public totalTripsRecorded;
    uint256 public totalCreditsEarned;
    uint256 public totalCreditsBurned;

    // ── Structs ───────────────────────────────────────────────────────────
    struct TripRecord {
        address  rider;
        uint256  distanceKm;       // in whole km
        uint256  creditsEarned;    // in wei (18 decimals)
        uint256  timestamp;
        string   vehicleId;
        string   tripId;           // off-chain TRP-xxx reference
        bool     exists;
    }

    struct DailyMintTracker {
        uint256 date;       // Unix day (timestamp / 86400)
        uint256 amount;     // amount minted today
    }

    // ── Mappings ──────────────────────────────────────────────────────────
    mapping(bytes32 => TripRecord)      public trips;           // tripId hash → record
    mapping(address => DailyMintTracker) public dailyMints;     // rider → today's mint total

    // ── Events ────────────────────────────────────────────────────────────
    event CreditsMinted(
        address indexed rider,
        uint256 amount,
        bytes32 indexed tripHash,
        string  tripId,
        uint256 distanceKm
    );
    event CreditsTraded(
        address indexed rider,
        uint256 carbonAmount,
        uint256 usdValue
    );
    event MarketRateUpdated(uint256 oldRate, uint256 newRate, address updatedBy);
    event TripRecorded(bytes32 tripHash, string tripId, address rider, uint256 distanceKm);

    // ── Constructor ───────────────────────────────────────────────────────
    constructor(address admin) ERC20("TerraCarbon", "TCRBN") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE,        admin);
        _grantRole(PAUSER_ROLE,        admin);
        _grantRole(ORACLE_ROLE,        admin);
        marketRateUSD = 520000; // $0.52 per TCRBN (6 decimal precision)
    }

    // ── Core: Mint for trip ───────────────────────────────────────────────
    /**
     * @notice Mint carbon credits for a completed EV trip.
     * @param rider     Rider's wallet address
     * @param distanceKm Trip distance in whole km
     * @param tripId    Off-chain trip reference (e.g. "TRP-A3F21")
     * @param vehicleId Vehicle identifier (e.g. "ev-rider-usr_abc")
     */
    function mintForTrip(
        address rider,
        uint256 distanceKm,
        string calldata tripId,
        string calldata vehicleId
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(rider != address(0), "TerraCarbon: invalid rider address");
        require(distanceKm > 0,      "TerraCarbon: distance must be > 0");
        require(bytes(tripId).length > 0, "TerraCarbon: tripId required");

        bytes32 tripHash = keccak256(abi.encodePacked(tripId));
        require(!trips[tripHash].exists, "TerraCarbon: trip already recorded");

        uint256 credits = distanceKm * CREDITS_PER_KM;

        // Daily cap enforcement
        uint256 today = block.timestamp / 86400;
        DailyMintTracker storage tracker = dailyMints[rider];
        if (tracker.date != today) {
            tracker.date   = today;
            tracker.amount = 0;
        }
        uint256 remaining = MAX_DAILY_MINT > tracker.amount ? MAX_DAILY_MINT - tracker.amount : 0;
        if (credits > remaining) credits = remaining;
        require(credits > 0, "TerraCarbon: daily mint cap reached");

        // Record trip immutably
        trips[tripHash] = TripRecord({
            rider:         rider,
            distanceKm:    distanceKm,
            creditsEarned: credits,
            timestamp:     block.timestamp,
            vehicleId:     vehicleId,
            tripId:        tripId,
            exists:        true
        });

        tracker.amount     += credits;
        totalTripsRecorded++;
        totalCreditsEarned += credits;

        _mint(rider, credits);

        emit TripRecorded(tripHash, tripId, rider, distanceKm);
        emit CreditsMinted(rider, credits, tripHash, tripId, distanceKm);
    }

    // ── Core: Trade credits ───────────────────────────────────────────────
    /**
     * @notice Burn TCRBN and emit trade event (redeemed for OMNI off-chain).
     * @param amount Amount of TCRBN to trade (wei, 18 decimals)
     */
    function tradeForOMNI(uint256 amount) external whenNotPaused {
        require(amount >= MIN_TRADE_AMOUNT,    "TerraCarbon: below minimum trade amount");
        require(balanceOf(msg.sender) >= amount, "TerraCarbon: insufficient balance");

        uint256 usdValue = (amount * marketRateUSD) / 1e24; // scale: 18 dec token * 6 dec rate / 24 = USD
        totalCreditsBurned += amount;

        _burn(msg.sender, amount);
        emit CreditsTraded(msg.sender, amount, usdValue);
    }

    // ── Oracle: Update market rate ────────────────────────────────────────
    /**
     * @notice Update USD market rate. Called by Lambda oracle after VCS API fetch.
     * @param newRate New rate in USD * 1e6 (e.g. 520000 = $0.52)
     */
    function updateMarketRate(uint256 newRate) external onlyRole(ORACLE_ROLE) {
        require(newRate > 0 && newRate < 100e6, "TerraCarbon: invalid rate");
        uint256 old = marketRateUSD;
        marketRateUSD = newRate;
        emit MarketRateUpdated(old, newRate, msg.sender);
    }

    // ── Views ─────────────────────────────────────────────────────────────
    function getTrip(string calldata tripId) external view returns (TripRecord memory) {
        return trips[keccak256(abi.encodePacked(tripId))];
    }

    function getUSDValue(uint256 amount) external view returns (uint256) {
        return (amount * marketRateUSD) / 1e24;
    }

    function getDailyRemaining(address rider) external view returns (uint256) {
        DailyMintTracker memory t = dailyMints[rider];
        uint256 today = block.timestamp / 86400;
        if (t.date != today) return MAX_DAILY_MINT;
        return MAX_DAILY_MINT > t.amount ? MAX_DAILY_MINT - t.amount : 0;
    }

    function getStats() external view returns (
        uint256 totalSupply_,
        uint256 totalTrips,
        uint256 totalEarned,
        uint256 totalBurned,
        uint256 currentRate
    ) {
        return (totalSupply(), totalTripsRecorded, totalCreditsEarned, totalCreditsBurned, marketRateUSD);
    }

    // ── Admin ─────────────────────────────────────────────────────────────
    function pause()   external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal override whenNotPaused
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}
