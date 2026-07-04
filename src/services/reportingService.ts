/**
 * ─────────────────────────────────────────────────────────────────────────────
 * OmniRide Reporting Service  —  AWS Lambda + S3
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Report generation flow:
 *   Frontend → API Gateway → Lambda → S3 (pre-signed URL)
 *   Frontend downloads from pre-signed URL (never touches DynamoDB directly)
 *
 * For large reports Lambda puts the file in S3 and returns a 15-min signed URL.
 * For small previews Lambda returns data inline (< 6 MB payload limit).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { awsGet }        from './awsClient';
import { LAMBDA_ROUTES } from './awsConfig';

export interface FinancialRecord {
  Date:            string;
  Gross:           number;
  Net:             number;
  Fees:            number;
  Carbon_Credits:  number;
}

export const reportingApi = {

  /**
   * Download data as a CSV file (runs entirely in the browser — no upload needed).
   */
  generateCSV: (data: Record<string, unknown>[], filename: string): void => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows    = data.map(obj =>
      Object.values(obj)
        .map(v => (typeof v === 'string' ? `"${v}"` : v))
        .join(','),
    );

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href     = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Fetch financial data from Lambda (which reads DynamoDB + S3 rollups).
   * Falls back to mock data when offline.
   */
  spoolFinancialData: async (_period: string): Promise<FinancialRecord[]> => {
    const { data, error } = await awsGet<FinancialRecord[]>(
      LAMBDA_ROUTES.REPORTING_FINANCIAL,
    );

    if (!error && data && Array.isArray(data)) return data;

    // Offline fallback — mock data for UI to remain functional
    return [
      { Date: '2025-02-12', Gross: 12_400, Net: 10_540, Fees: 1_860, Carbon_Credits: 42 },
      { Date: '2025-02-13', Gross: 15_100, Net: 12_835, Fees: 2_265, Carbon_Credits: 55 },
      { Date: '2025-02-14', Gross: 11_200, Net:  9_520, Fees: 1_680, Carbon_Credits: 38 },
      { Date: '2025-02-15', Gross: 18_400, Net: 15_640, Fees: 2_760, Carbon_Credits: 68 },
    ];
  },

  /**
   * Request a large S3 report (Lambda generates file + returns pre-signed URL).
   * Triggers a browser download automatically.
   */
  downloadS3Report: async (reportType: string, period: string): Promise<boolean> => {
    const { data, error } = await awsGet<{ url: string }>(
      `${LAMBDA_ROUTES.REPORTING_FINANCIAL}?type=${reportType}&period=${period}`,
    );

    if (!error && data?.url) {
      const link = document.createElement('a');
      link.href     = data.url;
      link.download = `${reportType}_${period}.csv`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    return false;
  },
};
