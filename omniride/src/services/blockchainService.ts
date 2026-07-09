/**
 * ─────────────────────────────────────────────────────────────────────────────
 * OpusAIMobility Blockchain Service  —  AWS Lambda + DynamoDB
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Simulates a Celo-compatible blockchain ledger.
 * All events are persisted to DynamoDB: opusaimobility-blockchain via Lambda.
 *
 * Lambda validates:
 *  • Wallet address format
 *  • Token mint amounts
 *  • Trade execution atomicity
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { WalletTransaction, BlockchainEvent } from '../types';
import { awsPost, awsGet }  from './awsClient';
import { LAMBDA_ROUTES }    from './awsConfig';

const CACHE_KEY = 'opusaimobility-blockchain';

function readCache(): BlockchainEvent[] {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '[]'); }
  catch { return []; }
}

export const blockchainApi = {

  /** Generate a mock wallet address (for display only). */
  generateAddress: (): string =>
    '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),

  /**
   * Seed a blockchain event.
   * Lambda → DynamoDB write with block height increment.
   */
  seedEvent: async (
    type:    BlockchainEvent['eventType'],
    payload: Record<string, unknown>,
  ): Promise<BlockchainEvent> => {
    const { data, error } = await awsPost<{ event: BlockchainEvent }>(
      LAMBDA_ROUTES.BLOCKCHAIN_SEED,
      { type, payload },
    );

    if (!error && data?.event) {
      const cached = readCache();
      localStorage.setItem(CACHE_KEY, JSON.stringify([data.event, ...cached]));
      return data.event;
    }

    // Offline fallback — generate a local event
    const cached    = readCache();
    const lastBlock = cached[0]?.blockHeight ?? 18_442_910;
    const localEvent: BlockchainEvent = {
      id:          `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      blockHeight: lastBlock + Math.floor(Math.random() * 10) + 1,
      hash:        '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      eventType:   type,
      payload,
      timestamp:   Date.now(),
      gasUsed:     (Math.floor(Math.random() * 50_000) + 21_000).toString(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify([localEvent, ...cached]));
    return localEvent;
  },

  /**
   * Fetch the immutable ledger from DynamoDB.
   * Falls back to localStorage cache.
   */
  getLedger: async (): Promise<BlockchainEvent[]> => {
    const { data, error } = await awsGet<BlockchainEvent[]>(
      LAMBDA_ROUTES.BLOCKCHAIN_LEDGER,
      CACHE_KEY,
    );

    if (!error && data) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      return data;
    }

    return readCache();
  },

  /**
   * Trade carbon credits for OMNI tokens.
   * Lambda handles the atomic mint + record event.
   */
  tradeCredits: async (address: string, amount: number): Promise<WalletTransaction> => {
    const { data, error } = await awsPost<{ transaction: WalletTransaction }>(
      LAMBDA_ROUTES.BLOCKCHAIN_SEED,
      { type: 'TRADE_EXECUTED', payload: { address, amount, asset: 'CARBON' } },
    );

    if (!error && data?.transaction) return data.transaction;

    // Offline fallback
    const fallback: WalletTransaction = {
      id:           `TX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      type:         'trade',
      asset:        'CARBON',
      amount:       -amount,
      counterValue: amount * 0.50,
      status:       'confirmed',
      timestamp:    Date.now(),
      hash:         '0x' + Math.random().toString(36).substring(2, 15),
    };
    return fallback;
  },

  /** Calculate carbon credits earned from a trip (pure function). */
  earnCredits: (distanceKm: number): number =>
    Math.round((distanceKm / 2) * 10) / 10,
};
