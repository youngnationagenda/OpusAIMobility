/**
 * Property 4: API Gateway Path Routing — TerraAI Prefix Strip
 *
 * For any HTTP request path starting with `/terra/`, the routing logic SHALL strip
 * the `/terra` prefix and forward the remainder to the TerraAI service
 * (e.g., `/terra/chat` → `/chat`).
 *
 * Validates: Requirements 4.1
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { resolveRoute, TERRA_PATH_PREFIX } from '@opusaimobility/common/routing.js';

/**
 * Arbitrary path segment generator — produces valid URL path segments
 * (lowercase alphanumeric with hyphens/underscores).
 */
const arbPathSegment: fc.Arbitrary<string> = fc.stringMatching(/^[a-z0-9_-]+$/);

/**
 * Arbitrary path suffix generator — produces path remainders like `/chat`, `/api/v1/users`, etc.
 * Always starts with `/` to form a valid path after the `/terra` prefix.
 */
const arbPathSuffix: fc.Arbitrary<string> = fc
  .array(arbPathSegment, { minLength: 1, maxLength: 5 })
  .map((segments) => '/' + segments.join('/'));

describe('Feature: terraai-opusaimobility-consolidation, Property 4: Terra prefix strip', () => {
  it('strips /terra prefix and forwards remainder to TerraAI service for any path starting with /terra/', () => {
    fc.assert(
      fc.property(arbPathSuffix, (suffix: string) => {
        const inputPath = TERRA_PATH_PREFIX + suffix; // e.g. `/terra/chat`, `/terra/api/v1/users`
        const result = resolveRoute(inputPath);

        // Target must be TerraAI
        expect(result.target).toBe('terraai');

        // Forward path must be the suffix (prefix stripped)
        expect(result.forwardPath).toBe(suffix);

        // Forward path must NOT contain the /terra prefix
        expect(result.forwardPath.startsWith(TERRA_PATH_PREFIX + '/')).toBe(false);

        // Forward path must start with /
        expect(result.forwardPath.startsWith('/')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('the stripped path is exactly the original path with /terra removed', () => {
    fc.assert(
      fc.property(arbPathSuffix, (suffix: string) => {
        const inputPath = TERRA_PATH_PREFIX + suffix;
        const result = resolveRoute(inputPath);

        // Reconstructing: prefix + forwardPath should equal the original input path
        expect(TERRA_PATH_PREFIX + result.forwardPath).toBe(inputPath);
      }),
      { numRuns: 100 }
    );
  });

  it('routes exact /terra path (no trailing slash) to TerraAI with forward path /', () => {
    const result = resolveRoute(TERRA_PATH_PREFIX);

    expect(result.target).toBe('terraai');
    expect(result.forwardPath).toBe('/');
  });
});
