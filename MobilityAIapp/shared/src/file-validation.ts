/**
 * File upload validation logic — TypeScript mirror of PHP validateFileSize.
 *
 * Enforces the 50 MB file size limit for TerraAI file uploads.
 * Files ≤ 50 MB are accepted; files > 50 MB are rejected with HTTP 413.
 */

import { MAX_FILE_SIZE_BYTES } from './types/index.js';

export { MAX_FILE_SIZE_BYTES };

/**
 * Result of a file size validation check.
 */
export interface FileSizeValidationResult {
  /** Whether the file passes size validation */
  accepted: boolean;
  /** HTTP status code: 200 for accepted, 413 for rejected */
  statusCode: 200 | 413;
  /** Human-readable message */
  message: string;
  /** The file size that was checked (bytes) */
  fileSizeBytes: number;
  /** The maximum allowed size (bytes) */
  maxSizeBytes: number;
}

/**
 * Validates whether a file's size is within the upload limit.
 *
 * Mirrors the PHP `validateFileSize()` function behavior:
 * - Files with size ≤ 50 MB (52,428,800 bytes) are accepted
 * - Files with size > 50 MB are rejected with HTTP 413
 *
 * @param fileSizeBytes - The size of the file in bytes (must be non-negative integer)
 * @returns Validation result with acceptance status and HTTP status code
 */
export function validateFileSize(fileSizeBytes: number): FileSizeValidationResult {
  if (fileSizeBytes <= MAX_FILE_SIZE_BYTES) {
    return {
      accepted: true,
      statusCode: 200,
      message: 'File size is within the allowed limit',
      fileSizeBytes,
      maxSizeBytes: MAX_FILE_SIZE_BYTES,
    };
  }

  return {
    accepted: false,
    statusCode: 413,
    message: `File too large. Maximum allowed size is 50MB, got ${(fileSizeBytes / (1024 * 1024)).toFixed(2)}MB`,
    fileSizeBytes,
    maxSizeBytes: MAX_FILE_SIZE_BYTES,
  };
}
