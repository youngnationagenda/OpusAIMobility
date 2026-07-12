/**
 * ─────────────────────────────────────────────────────────────────────────────
 * OpusAIMobility DeFi Service  —  AWS Lambda
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Handles asset-backed loans (bike purchase) and insurance financing.
 * Lambda performs:
 *   • Loan calculation & validation
 *   • DynamoDB record creation (loan contract)
 *   • Scheduled daily deduction trigger (EventBridge rule)
 *   • SNS notification to rider on disbursement
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { InsuranceLoan, AssetLoan } from '../types';
import { awsPost }       from './awsClient';
import { LAMBDA_ROUTES } from './awsConfig';

// ── Constants (mirror Lambda configuration) ──────────────────────────────────
const ASSET_PRICE          = 1_500.00;
const ASSET_INTEREST_RATE  = 0.10;   // 10% p.a.
const INS_INTEREST_RATE    = 0.10;   // 10% p.a.
const THIRD_PARTY_COST     = 50.00;
const COMPREHENSIVE_RATE   = 0.045;  // 4.5% of asset value

// ── Pure calculation helpers (no network — for UI previews) ──────────────────

function calcAssetLoan(months: number): Omit<AssetLoan, 'id' | 'startDate'> {
  const interest    = ASSET_PRICE * ASSET_INTEREST_RATE * (months / 12);
  const totalAmount = ASSET_PRICE + interest;
  return {
    principal:         ASSET_PRICE,
    totalAmount,
    monthlyRepayment:  parseFloat((totalAmount / months).toFixed(2)),
    dailyRepayment:    parseFloat((totalAmount / (months * 30)).toFixed(2)),
    remainingBalance:  totalAmount,
    interestRate:      ASSET_INTEREST_RATE * 100,
    months,
  };
}

function calcInsuranceLoan(
  type:   'Comprehensive' | 'Third Party',
  months: number,
): Omit<InsuranceLoan, 'id' | 'startDate'> {
  const baseAnnual  = type === 'Comprehensive' ? ASSET_PRICE * COMPREHENSIVE_RATE : THIRD_PARTY_COST;
  const interest    = baseAnnual * INS_INTEREST_RATE * (months / 12);
  const totalAmount = baseAnnual + interest;
  return {
    type,
    totalAmount,
    monthlyRepayment: parseFloat((totalAmount / months).toFixed(2)),
    dailyRepayment:   parseFloat((totalAmount / (months * 30)).toFixed(2)),
    remainingBalance: totalAmount,
    months,
    interestRate:     INS_INTEREST_RATE * 100,
    autoRenew:        true,
  };
}

export const defiApi = {

  // ── Preview helpers (pure — instant, no network) ────────────────────────────
  calculateAssetLoan:     calcAssetLoan,
  calculateInsuranceLoan: calcInsuranceLoan,

  // ───────────────────────────────────────────────────────────────────────────
  // Request Asset Loan  →  Lambda creates DynamoDB contract + triggers EventBridge
  // ───────────────────────────────────────────────────────────────────────────
  requestAssetFunding: async (months: number): Promise<AssetLoan> => {
    const { data, error } = await awsPost<{ loan: AssetLoan }>(
      LAMBDA_ROUTES.DEFI_ASSET_LOAN,
      { months },
    );

    if (!error && data?.loan) return data.loan;

    // Offline fallback — generate local record
    return {
      ...calcAssetLoan(months),
      id:        `ASSET-DEFI-${Math.random().toString(36).substr(2, 7).toUpperCase()}`,
      startDate: Date.now(),
    };
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Request Insurance Loan  →  Lambda
  // ───────────────────────────────────────────────────────────────────────────
  requestInsuranceFunding: async (
    type:   'Comprehensive' | 'Third Party',
    months: number,
  ): Promise<InsuranceLoan> => {
    const { data, error } = await awsPost<{ loan: InsuranceLoan }>(
      LAMBDA_ROUTES.DEFI_INSURANCE_LOAN,
      { type, months },
    );

    if (!error && data?.loan) return data.loan;

    // Offline fallback
    return {
      ...calcInsuranceLoan(type, months),
      id:        `INS-DEFI-${Math.random().toString(36).substr(2, 7).toUpperCase()}`,
      startDate: Date.now(),
    };
  },
};
