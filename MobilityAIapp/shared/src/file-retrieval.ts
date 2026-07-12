/**
 * File retrieval logic for TerraAI API.
 *
 * Given a file key and a boolean indicating whether the file exists in S3,
 * this module decides whether to return a pre-signed URL response or an HTTP 404.
 *
 * Design Property 14: File Retrieval Returns URL or 404
 * Validates: Requirements 9.3
 */

import type { FileRetrievalResponse } from './types/index.js';

/** Maximum pre-signed URL expiry in milliseconds (1 hour) */
export const MAX_PRESIGNED_URL_EXPIRY_MS = 60 * 60 * 1000;

/** Maximum pre-signed URL expiry in seconds (1 hour) */
export const MAX_PRESIGNED_URL_EXPIRY_SECONDS = 3600;

/**
 * Successful file retrieval result containing the pre-signed URL details.
 */
export interface FileRetrievalSuccess {
  status: 200;
  body: FileRetrievalResponse;
}

/**
 * File not found result (HTTP 404).
 */
export interface FileRetrievalNotFound {
  status: 404;
  body: { error: string };
}

/**
 * Union type representing the possible outcomes of a file retrieval request.
 */
export type FileRetrievalResult = FileRetrievalSuccess | FileRetrievalNotFound;

/**
 * Options for generating a pre-signed URL response.
 */
export interface PreSignedUrlOptions {
  /** The S3 bucket name */
  bucket: string;
  /** Expiry duration in seconds (must be ≤ 3600) */
  expirySeconds: number;
  /** Base URL for generating the pre-signed URL */
  baseUrl?: string;
  /** Content type of the file */
  contentType?: string;
  /** Original filename */
  filename?: string;
}

/**
 * Resolves a file retrieval request.
 *
 * If the file key exists in S3, returns a success response with a pre-signed URL
 * that expires within 1 hour. If the file does not exist, returns an HTTP 404.
 *
 * @param fileKey - The S3 object key being requested
 * @param exists - Whether the file exists in S3
 * @param options - Options for generating the pre-signed URL (used when file exists)
 * @returns FileRetrievalResult — either a 200 with URL or a 404
 */
export function resolveFileRetrieval(
  fileKey: string,
  exists: boolean,
  options?: PreSignedUrlOptions
): FileRetrievalResult {
  if (!exists) {
    return {
      status: 404,
      body: { error: 'File not found' },
    };
  }

  // File exists — generate pre-signed URL response.
  // Clamp to (MAX - 1)s to guard against sub-millisecond clock drift between
  // the caller capturing `now` and this function computing `expiresAt`, which
  // would cause (expiresAt - callerNow) / 1000 to marginally exceed 3600.
  const expirySeconds = Math.min(
    options?.expirySeconds ?? MAX_PRESIGNED_URL_EXPIRY_SECONDS,
    MAX_PRESIGNED_URL_EXPIRY_SECONDS - 1
  );

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expirySeconds * 1000);

  const baseUrl = options?.baseUrl ?? 'https://s3.amazonaws.com';
  const bucket = options?.bucket ?? 'opusaimobility-uploads';
  const url = `${baseUrl}/${bucket}/${fileKey}?X-Amz-Expires=${expirySeconds}`;

  return {
    status: 200,
    body: {
      url,
      expiresAt: expiresAt.toISOString(),
      contentType: options?.contentType ?? 'application/octet-stream',
      filename: options?.filename ?? fileKey.split('/').pop() ?? fileKey,
    },
  };
}

/**
 * Computes the actual expiry duration in seconds from a FileRetrievalSuccess response.
 *
 * @param response - A successful file retrieval response
 * @param requestTime - The time the request was made (defaults to now)
 * @returns The expiry duration in seconds
 */
export function getExpiryDurationSeconds(
  response: FileRetrievalSuccess,
  requestTime?: Date
): number {
  const expiresAt = new Date(response.body.expiresAt).getTime();
  const baseTime = (requestTime ?? new Date()).getTime();
  return Math.round((expiresAt - baseTime) / 1000);
}
