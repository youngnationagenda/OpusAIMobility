/**
 * Property 12: File Migration Preserves Directory Structure
 *
 * For any file in TerraAI's upload directory with a relative path, the S3 key assigned
 * during migration SHALL preserve the original directory structure as a key prefix
 * (e.g., `uploads/avatars/user1.jpg` → S3 key `uploads/avatars/user1.jpg`).
 *
 * Validates: Requirements 9.1
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { toS3Key } from '../../scripts/migrate/migrate-files';

/**
 * Generates arbitrary path segments (valid filename characters).
 */
const arbPathSegment: fc.Arbitrary<string> = fc.stringMatching(/^[a-zA-Z0-9_.-]+$/, {
  size: 'small',
});

/**
 * Generates arbitrary relative file paths with 1-5 directory segments and a filename.
 * Produces paths like `dir1/dir2/file.txt` or `uploads/avatars/user1.jpg`.
 */
const arbRelativePath: fc.Arbitrary<string> = fc
  .tuple(
    fc.array(arbPathSegment, { minLength: 0, maxLength: 4 }),
    arbPathSegment
  )
  .map(([dirs, filename]) => {
    if (dirs.length === 0) return filename;
    return [...dirs, filename].join('/');
  })
  .filter((p) => p.length > 0 && !p.startsWith('/'));

/**
 * Generates arbitrary relative paths using backslash separators (Windows-style).
 */
const arbWindowsRelativePath: fc.Arbitrary<string> = fc
  .tuple(
    fc.array(arbPathSegment, { minLength: 1, maxLength: 4 }),
    arbPathSegment
  )
  .map(([dirs, filename]) => [...dirs, filename].join('\\'));

/**
 * Generates an optional key prefix (non-empty string without slashes, or undefined).
 */
const arbKeyPrefix: fc.Arbitrary<string | undefined> = fc.oneof(
  fc.constant(undefined),
  arbPathSegment.filter((s) => s.length > 0)
);

describe('Feature: terraai-opusaimobility-consolidation, Property 12: File path preservation', () => {
  it('S3 key preserves directory structure from relative path', () => {
    fc.assert(
      fc.property(arbRelativePath, (relativePath: string) => {
        const s3Key = toS3Key(relativePath);

        // The S3 key should equal the relative path (already uses forward slashes)
        expect(s3Key).toBe(relativePath);

        // Directory structure is preserved: all path segments remain as prefixes
        const segments = relativePath.split('/');
        const keySegments = s3Key.split('/');
        expect(keySegments).toEqual(segments);
      }),
      { numRuns: 100 }
    );
  });

  it('Windows-style backslash paths are normalized to forward slashes preserving structure', () => {
    fc.assert(
      fc.property(arbWindowsRelativePath, (relativePath: string) => {
        const s3Key = toS3Key(relativePath);

        // Backslashes should be normalized to forward slashes
        expect(s3Key).not.toContain('\\');

        // The directory structure should be preserved (segments match after normalization)
        const expectedSegments = relativePath.split('\\');
        const keySegments = s3Key.split('/');
        expect(keySegments).toEqual(expectedSegments);
      }),
      { numRuns: 100 }
    );
  });

  it('leading slash is removed but directory structure is preserved', () => {
    fc.assert(
      fc.property(arbRelativePath, (relativePath: string) => {
        const withLeadingSlash = '/' + relativePath;
        const s3Key = toS3Key(withLeadingSlash);

        // Leading slash should be stripped
        expect(s3Key).not.toMatch(/^\//);

        // The resulting key should match the path without leading slash
        expect(s3Key).toBe(relativePath);
      }),
      { numRuns: 100 }
    );
  });

  it('key prefix is prepended while preserving directory structure', () => {
    fc.assert(
      fc.property(
        arbRelativePath,
        arbKeyPrefix.filter((p): p is string => p !== undefined),
        (relativePath: string, prefix: string) => {
          const s3Key = toS3Key(relativePath, prefix);

          // The key should start with the prefix followed by a slash
          const expectedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
          expect(s3Key.startsWith(expectedPrefix)).toBe(true);

          // After the prefix, the directory structure should be preserved
          const afterPrefix = s3Key.slice(expectedPrefix.length);
          expect(afterPrefix).toBe(relativePath);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('S3 key always uses forward slashes as directory separators', () => {
    fc.assert(
      fc.property(
        fc.oneof(arbRelativePath, arbWindowsRelativePath),
        (relativePath: string) => {
          const s3Key = toS3Key(relativePath);

          // S3 keys must never contain backslashes
          expect(s3Key).not.toContain('\\');

          // All directory segments must be separated by forward slashes
          if (s3Key.includes('/')) {
            const segments = s3Key.split('/');
            // Each segment should be non-empty (no double slashes)
            for (const segment of segments) {
              expect(segment.length).toBeGreaterThan(0);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
