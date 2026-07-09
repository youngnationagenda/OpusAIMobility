/**
 * Property 5: API Gateway Path Routing — Default to OpusAIMobility
 *
 * For any HTTP request path NOT starting with `/terra/`, the routing logic SHALL forward
 * the request to the OpusAIMobility Lambda with the original path preserved unchanged.
 *
 * Validates: Requirements 4.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { resolveRoute, TERRA_PATH_PREFIX } from '@opusaimobility/common/routing.js';

/**
 * Arbitrary path generator that produces paths NOT starting with `/terra/`.
 * Strategy: generate arbitrary path segments and prefix with a leading slash,
 * filtering out any paths that happen to start with the TerraAI prefix.
 */
const arbNonTerraPath: fc.Arbitrary<string> = fc
  .array(fc.stringMatching(/^[a-zA-Z0-9_.-]+$/), { minLength: 1, maxLength: 5 })
  .map((segments) => '/' + segments.join('/'))
  .filter(
    (path) => !path.startsWith(TERRA_PATH_PREFIX + '/') && path !== TERRA_PATH_PREFIX
  );

describe('Feature: terraai-opusaimobility-consolidation, Property 5: Default to OpusAIMobility', () => {
  it('paths not starting with /terra/ are routed to opusaimobility with path unchanged', () => {
    fc.assert(
      fc.property(arbNonTerraPath, (path: string) => {
        const result = resolveRoute(path);

        // Target should be opusaimobility for non-terra paths
        expect(result.target).toBe('opusaimobility');

        // The forwarded path should be the original path, preserved unchanged
        expect(result.forwardPath).toBe(path);
      }),
      { numRuns: 100 }
    );
  });

  it('common OpusAIMobility paths are forwarded unchanged', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '/platform/settings',
          '/rides',
          '/users/profile',
          '/api/v1/trips',
          '/health',
          '/auth/login',
          '/webhooks/stripe',
          '/admin/dashboard'
        ),
        (path: string) => {
          const result = resolveRoute(path);

          expect(result.target).toBe('opusaimobility');
          expect(result.forwardPath).toBe(path);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('paths with "terra" in a non-prefix position route to opusaimobility', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '/api/terra-config',
          '/users/terra',
          '/settings/terraform',
          '/data/terrace',
          '/v2/terra-reports/summary'
        ),
        (path: string) => {
          const result = resolveRoute(path);

          // These contain "terra" but don't start with /terra/ — should route to opusaimobility
          expect(result.target).toBe('opusaimobility');
          expect(result.forwardPath).toBe(path);
        }
      ),
      { numRuns: 100 }
    );
  });
});
