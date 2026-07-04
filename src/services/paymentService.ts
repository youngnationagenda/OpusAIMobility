/**
 * ─────────────────────────────────────────────────────────────────────────────
 * OmniRide Payment Service  —  AWS Lambda
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * All payment processing flows through Lambda functions which:
 *  • STK Push (M-Pesa)  → Lambda calls Safaricom Daraja API
 *  • Stripe             → Lambda creates PaymentIntent, returns client_secret
 *  • Bank Transfer      → Lambda creates pending DynamoDB record for admin approval
 *  • P2P Wallet         → Lambda performs atomic DynamoDB balance swap
 *  • Ride Payment       → Lambda deducts wallet, records transaction
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PaymentHistoryItem, PaymentGateway, User, BillingMode } from '../types';
import { auditApi }  from './auditService';
import { omniApi }   from './api';
import { awsPost, awsGet } from './awsClient';
import { LAMBDA_ROUTES }   from './awsConfig';

const PER_KM_RATE = 0.37;

const CACHE_TRANSACTIONS = 'omniride-transactions';

function readTxCache(): PaymentHistoryItem[] {
  try { return JSON.parse(localStorage.getItem(CACHE_TRANSACTIONS) ?? '[]'); }
  catch { return []; }
}
function writeTxCache(txs: PaymentHistoryItem[]): void {
  try { localStorage.setItem(CACHE_TRANSACTIONS, JSON.stringify(txs)); } catch { /* quota */ }
}

export const paymentApi = {

  // ───────────────────────────────────────────────────────────────────────────
  // Transaction History  →  DynamoDB: omniride-transactions
  // ───────────────────────────────────────────────────────────────────────────
  getTransactions: async (): Promise<PaymentHistoryItem[]> => {
    const { data, error } = await awsGet<PaymentHistoryItem[]>(
      LAMBDA_ROUTES.PAYMENTS_HISTORY,
      CACHE_TRANSACTIONS,
    );

    if (!error && data) {
      writeTxCache(data);
      return data.sort((a, b) => b.timestamp - a.timestamp);
    }

    return readTxCache().sort((a, b) => b.timestamp - a.timestamp);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // M-Pesa Express STK Push  →  Lambda → Safaricom Daraja
  // ───────────────────────────────────────────────────────────────────────────
  initiateMpesaExpress: async (user: User, amount: number): Promise<PaymentHistoryItem> => {
    const { data, error } = await awsPost<{ transaction: PaymentHistoryItem }>(
      LAMBDA_ROUTES.PAYMENTS_MPESA,
      { userId: user.id, phone: user.phone, amount },
    );

    if (!error && data?.transaction) {
      const tx = data.transaction;
      writeTxCache([...readTxCache(), tx]);
      omniApi.updateBalance(user.id, amount, user.role === 'business');
      return tx;
    }

    // Offline fallback: optimistic success so UI doesn't block
    const fallbackTx: PaymentHistoryItem = {
      id:          `MPX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      amount,
      currency:    'USD',
      status:      'pending',
      method:      user.phone,
      gateway:     'M-Pesa Express',
      timestamp:   Date.now(),
      description: 'Wallet Top-up (STK) — pending confirmation',
      userType:    user.role === 'business' ? 'business' : 'customer',
      direction:   'in',
    };
    writeTxCache([...readTxCache(), fallbackTx]);
    return fallbackTx;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // P2P Wallet Transfer  →  Lambda (atomic DynamoDB)
  // ───────────────────────────────────────────────────────────────────────────
  transferFunds: async (fromUser: User, toAddress: string, amount: number): Promise<boolean> => {
    const { data, error } = await awsPost<{ success: boolean }>(
      LAMBDA_ROUTES.PAYMENTS_TRANSFER,
      { fromUserId: fromUser.id, toAddress, amount },
    );

    if (error || !data?.success) {
      // Offline optimistic
      const tx: PaymentHistoryItem = {
        id: `TXF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        amount, currency: 'USD', status: 'pending',
        method: 'OmniWallet', gateway: 'OmniWallet',
        timestamp: Date.now(), description: `Transfer to ${toAddress}`,
        userType: fromUser.role, direction: 'out',
      };
      writeTxCache([...readTxCache(), tx]);
    }

    auditApi.logAction({
      userId: fromUser.id, userName: fromUser.name,
      action: 'P2P_TRANSFER', target: toAddress,
      details: `Transferred $${amount.toFixed(2)} to node ${toAddress}`,
      severity: 'medium',
    });

    return !error;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Bank Transfer — manual approval flow  →  Lambda → DynamoDB
  // ───────────────────────────────────────────────────────────────────────────
  requestBankTransfer: async (user: User, amount: number, ref: string): Promise<PaymentHistoryItem> => {
    const { data, error } = await awsPost<{ transaction: PaymentHistoryItem }>(
      LAMBDA_ROUTES.PAYMENTS_BANK,
      { userId: user.id, amount, reference: ref },
    );

    if (!error && data?.transaction) {
      writeTxCache([...readTxCache(), data.transaction]);
      auditApi.logAction({
        userId: user.id, userName: user.name,
        action: 'BANK_TRANSFER_REQUESTED', target: data.transaction.id,
        details: `Manual approval requested for $${amount}. Ref: ${ref}`,
        severity: 'medium',
      });
      return data.transaction;
    }

    // Fallback
    const fallback: PaymentHistoryItem = {
      id: `BTF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      amount, currency: 'USD', status: 'awaiting_approval',
      method: 'Bank Transfer', gateway: 'Bank Transfer',
      reference: ref, timestamp: Date.now(),
      description: 'Corporate Wallet Deposit', userType: 'business', direction: 'in',
    };
    writeTxCache([...readTxCache(), fallback]);
    return fallback;
  },

  approveBankTransfer: async (txnId: string, admin: User): Promise<{ success: boolean; amount: number }> => {
    const { data, error } = await awsPost<{ success: boolean; amount: number }>(
      LAMBDA_ROUTES.PAYMENTS_APPROVE,
      { txnId, adminId: admin.id },
    );

    if (!error && data?.success) {
      auditApi.logAction({
        userId: admin.id, userName: admin.name,
        action: 'BANK_TRANSFER_APPROVED', target: txnId,
        details: `Deposit of $${data.amount} confirmed.`,
        severity: 'high',
      });
      return data;
    }

    // Offline fallback — update local cache
    const txs = readTxCache();
    const idx  = txs.findIndex(t => t.id === txnId);
    if (idx === -1) return { success: false, amount: 0 };
    txs[idx] = { ...txs[idx], status: 'successful' };
    writeTxCache(txs);
    return { success: true, amount: txs[idx].amount };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Fare / Payment calculations (pure — no network)
  // ───────────────────────────────────────────────────────────────────────────
  calculateRideFee: (distanceKm: number, mode?: BillingMode): number => {
    if (mode === 'dedicated_monthly') return 0;
    return parseFloat((distanceKm * PER_KM_RATE).toFixed(2));
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Stripe Payment Intent  →  Lambda → Stripe
  // ───────────────────────────────────────────────────────────────────────────
  processRidePayment: async (user: User, amount: number, gateway: PaymentGateway): Promise<boolean> => {
    const { data, error } = await awsPost<{ success: boolean }>(
      LAMBDA_ROUTES.PAYMENTS_STRIPE,
      { userId: user.id, amount, gateway },
    );

    if (!error && data?.success) {
      const tx: PaymentHistoryItem = {
        id: `RIDE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        amount, currency: 'USD', status: 'successful',
        method: gateway === 'OmniWallet' ? 'OmniWallet' : 'External Gateway',
        gateway, timestamp: Date.now(),
        description: `Ride Fare via ${gateway}`,
        userType: user.role === 'business' ? 'business' : 'customer',
        direction: 'out',
      };
      writeTxCache([...readTxCache(), tx]);
    }

    return !error;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Financial insights (computed from local cache for instant display)
  // ───────────────────────────────────────────────────────────────────────────
  getFinancialInsights: () => {
    const txs     = readTxCache();
    const inflow  = txs.filter(t => t.direction === 'in'  && t.status === 'successful').reduce((s, t) => s + t.amount, 0);
    const outflow = txs.filter(t => t.direction === 'out' && t.status === 'successful').reduce((s, t) => s + t.amount, 0);

    return {
      totalInflow:  inflow,
      totalOutflow: outflow,
      netRevenue:   inflow - outflow,
      gateways:     txs.reduce((acc: Record<string, number>, t) => {
        acc[t.gateway] = (acc[t.gateway] ?? 0) + t.amount;
        return acc;
      }, {}),
    };
  },
};
