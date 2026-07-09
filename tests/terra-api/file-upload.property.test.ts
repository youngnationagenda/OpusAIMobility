/**
 * Property 13: File Upload Size Enforcement
 *
 * For any file upload request, files with size ≤ 50 MB SHALL be stored in S3
 * successfully, and files with size > 50 MB SHALL be rejected with an HTTP 413
 * response without writing to S3.
 *
 * **Validates: Requirements 9.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateFileSize, MAX_FILE_SIZE_BYTES } from '@opusaimobility/common/file-validation.js';

/**
 * Generator for file sizes within the accepted range: 0 to 50 MB inclusive.
 */
const arbAcceptedFileSize: fc.Arbitrary<number> = fc.integer({
  min: 0,
  max: MAX_FILE_SIZE_BYTES,
});

/**
 * Generator for file sizes above the limit: > 50 MB.
 * Uses range from (50 MB + 1 byte) up to ~200 MB to cover realistic oversized uploads.
 */
const arbRejectedFileSize: fc.Arbitrary<number> = fc.integer({
  min: MAX_FILE_SIZE_BYTES + 1,
  max: 200 * 1024 * 1024, // up to 200 MB
});

/**
 * Generator for arbitrary file sizes spanning the full range (both accepted and rejected).
 */
const arbAnyFileSize: fc.Arbitrary<number> = fc.integer({
  min: 0,
  max: 200 * 1024 * 1024,
});

describe('Feature: terraai-opusaimobility-consolidation, Property 13: File size enforcement', () => {
  it('files ≤ 50 MB are accepted with HTTP 200', () => {
    fc.assert(
      fc.property(arbAcceptedFileSize, (sizeBytes: number) => {
        const result = validateFileSize(sizeBytes);

        // File must be accepted
        expect(result.accepted).toBe(true);
        expect(result.statusCode).toBe(200);

        // Result must report correct file size and limit
        expect(result.fileSizeBytes).toBe(sizeBytes);
        expect(result.maxSizeBytes).toBe(MAX_FILE_SIZE_BYTES);
      }),
      { numRuns: 100 }
    );
  });

  it('files > 50 MB are rejected with HTTP 413', () => {
    fc.assert(
      fc.property(arbRejectedFileSize, (sizeBytes: number) => {
        const result = validateFileSize(sizeBytes);

        // File must be rejected
        expect(result.accepted).toBe(false);
        expect(result.statusCode).toBe(413);

        // Result must report correct file size and limit
        expect(result.fileSizeBytes).toBe(sizeBytes);
        expect(result.maxSizeBytes).toBe(MAX_FILE_SIZE_BYTES);
      }),
      { numRuns: 100 }
    );
  });

  it('the boundary at exactly 50 MB is always accepted', () => {
    fc.assert(
      fc.property(
        fc.constant(MAX_FILE_SIZE_BYTES),
        (sizeBytes: number) => {
          const result = validateFileSize(sizeBytes);

          expect(result.accepted).toBe(true);
          expect(result.statusCode).toBe(200);
          expect(result.fileSizeBytes).toBe(MAX_FILE_SIZE_BYTES);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any file size, accepted iff size ≤ MAX_FILE_SIZE_BYTES', () => {
    fc.assert(
      fc.property(arbAnyFileSize, (sizeBytes: number) => {
        const result = validateFileSize(sizeBytes);

        if (sizeBytes <= MAX_FILE_SIZE_BYTES) {
          expect(result.accepted).toBe(true);
          expect(result.statusCode).toBe(200);
        } else {
          expect(result.accepted).toBe(false);
          expect(result.statusCode).toBe(413);
        }

        // Invariants that hold for all inputs
        expect(result.fileSizeBytes).toBe(sizeBytes);
        expect(result.maxSizeBytes).toBe(MAX_FILE_SIZE_BYTES);
      }),
      { numRuns: 100 }
    );
  });
});
