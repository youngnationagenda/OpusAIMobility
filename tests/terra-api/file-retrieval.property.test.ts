/**
 * Property 14: File Retrieval Returns URL or 404
 *
 * For any file key requested from TerraAI API, if the key exists in S3 the response
 * SHALL contain a pre-signed URL with expiration ≤ 1 hour; if the key does not exist,
 * the response SHALL be HTTP 404.
 *
 * **Validates: Requirements 9.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  resolveFileRetrieval,
  MAX_PRESIGNED_URL_EXPIRY_SECONDS,
} from '@opusaimobility/common/file-retrieval.js';

/**
 * Arbitrary S3 file key generator.
 * Produces keys that look like realistic S3 paths:
 * e.g., "uploads/avatars/user123.jpg", "documents/report.pdf"
 */
const arbFileKey: fc.Arbitrary<string> = fc
  .array(fc.stringMatching(/^[a-zA-Z0-9_.-]+$/), { minLength: 1, maxLength: 5 })
  .map((segments) => segments.join('/'))
  .filter((key) => key.length > 0 && key.length <= 500);

/**
 * Arbitrary expiry duration in seconds (between 1 second and 1 hour).
 */
const arbExpirySeconds: fc.Arbitrary<number> = fc.integer({ min: 1, max: 7200 });

/**
 * Arbitrary bucket name.
 */
const arbBucket: fc.Arbitrary<string> = fc
  .stringMatching(/^[a-z0-9][a-z0-9.-]{2,20}$/)
  .filter((b) => b.length >= 3);

describe('Feature: terraai-opusaimobility-consolidation, Property 14: File retrieval', () => {
  it('non-existing key returns HTTP 404 with error message', () => {
    fc.assert(
      fc.property(arbFileKey, (fileKey: string) => {
        const result = resolveFileRetrieval(fileKey, false);

        // Must return 404 when file does not exist
        expect(result.status).toBe(404);

        // Must have an error body
        expect(result.body).toHaveProperty('error');
        expect((result.body as { error: string }).error).toBeTruthy();
      }),
      { numRuns: 100 }
    );
  });

  it('existing key returns HTTP 200 with a pre-signed URL', () => {
    fc.assert(
      fc.property(arbFileKey, (fileKey: string) => {
        const result = resolveFileRetrieval(fileKey, true);

        // Must return 200 when file exists
        expect(result.status).toBe(200);

        // Must contain a URL in the body
        if (result.status === 200) {
          expect(result.body.url).toBeTruthy();
          expect(typeof result.body.url).toBe('string');
          expect(result.body.url.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('existing key URL expiration is always ≤ 1 hour (3600 seconds)', () => {
    fc.assert(
      fc.property(
        arbFileKey,
        arbExpirySeconds,
        arbBucket,
        (fileKey: string, requestedExpiry: number, bucket: string) => {
          const now = new Date();
          const result = resolveFileRetrieval(fileKey, true, {
            bucket,
            expirySeconds: requestedExpiry,
          });

          // Must be a success response
          expect(result.status).toBe(200);

          if (result.status === 200) {
            const expiresAt = new Date(result.body.expiresAt).getTime();
            const requestTime = now.getTime();

            // The expiry must be in the future
            expect(expiresAt).toBeGreaterThan(requestTime);

            // The expiry duration must be ≤ 1 hour (3600 seconds)
            const expiryDurationSeconds = (expiresAt - requestTime) / 1000;
            expect(expiryDurationSeconds).toBeLessThanOrEqual(MAX_PRESIGNED_URL_EXPIRY_SECONDS);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('existing key response contains valid expiresAt ISO timestamp', () => {
    fc.assert(
      fc.property(arbFileKey, (fileKey: string) => {
        const result = resolveFileRetrieval(fileKey, true);

        if (result.status === 200) {
          // expiresAt must be a valid ISO 8601 date string
          const parsed = new Date(result.body.expiresAt);
          expect(parsed.getTime()).not.toBeNaN();
          expect(result.body.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('even with expiry > 1 hour requested, actual expiry is clamped to ≤ 1 hour', () => {
    fc.assert(
      fc.property(
        arbFileKey,
        fc.integer({ min: 3601, max: 86400 }), // request > 1 hour
        (fileKey: string, requestedExpiry: number) => {
          const now = new Date();
          const result = resolveFileRetrieval(fileKey, true, {
            bucket: 'test-bucket',
            expirySeconds: requestedExpiry,
          });

          expect(result.status).toBe(200);

          if (result.status === 200) {
            const expiresAt = new Date(result.body.expiresAt).getTime();
            const expiryDurationSeconds = (expiresAt - now.getTime()) / 1000;

            // Even though we requested more than 3600s, the actual expiry must be ≤ 3600s
            expect(expiryDurationSeconds).toBeLessThanOrEqual(MAX_PRESIGNED_URL_EXPIRY_SECONDS);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('existing key response contains contentType and filename fields', () => {
    fc.assert(
      fc.property(arbFileKey, (fileKey: string) => {
        const result = resolveFileRetrieval(fileKey, true);

        if (result.status === 200) {
          // Must have contentType as a non-empty string
          expect(typeof result.body.contentType).toBe('string');
          expect(result.body.contentType.length).toBeGreaterThan(0);

          // Must have filename as a non-empty string
          expect(typeof result.body.filename).toBe('string');
          expect(result.body.filename.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('decision is deterministic: same inputs always produce same status', () => {
    fc.assert(
      fc.property(arbFileKey, fc.boolean(), (fileKey: string, exists: boolean) => {
        const result1 = resolveFileRetrieval(fileKey, exists, {
          bucket: 'bucket',
          expirySeconds: 1800,
        });
        const result2 = resolveFileRetrieval(fileKey, exists, {
          bucket: 'bucket',
          expirySeconds: 1800,
        });

        // Same inputs must yield same status
        expect(result1.status).toBe(result2.status);
      }),
      { numRuns: 100 }
    );
  });
});
