/**
 * Property 6: CORS Headers Present on All Responses
 *
 * For any HTTP request (any method, any path), the API Gateway response SHALL include
 * `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`,
 * and `Access-Control-Allow-Headers: Content-Type, Authorization`.
 * For OPTIONS requests specifically, the response SHALL be HTTP 200 with an empty body.
 *
 * Validates: Requirements 4.5, 4.7
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { applyCorsHeaders, handlePreflight } from '@opusaimobility/common/cors.js';
import { CORS_CONFIG, SUPPORTED_METHODS, type HttpMethod } from '@opusaimobility/common/routing.js';

/**
 * Arbitrary HTTP method generator from the supported methods list.
 */
const arbHttpMethod: fc.Arbitrary<HttpMethod> = fc.constantFrom(...SUPPORTED_METHODS);

/**
 * Arbitrary request path generator - produces paths like /foo, /bar/baz, /terra/chat, etc.
 */
const arbRequestPath: fc.Arbitrary<string> = fc
  .array(fc.stringMatching(/^[a-z0-9_-]+$/), { minLength: 1, maxLength: 5 })
  .map((segments) => '/' + segments.join('/'));

describe('Feature: terraai-opusaimobility-consolidation, Property 6: CORS headers present', () => {
  it('applyCorsHeaders adds all required CORS headers for any method and path combination', () => {
    fc.assert(
      fc.property(arbHttpMethod, arbRequestPath, (method: HttpMethod, path: string) => {
        // Simulate a response object for any arbitrary method/path
        const response = { headers: {} as Record<string, string> };

        const result = applyCorsHeaders(response);

        // Assert all required CORS headers are present
        expect(result.headers['Access-Control-Allow-Origin']).toBe(CORS_CONFIG.allowOrigins);
        expect(result.headers['Access-Control-Allow-Methods']).toBe(CORS_CONFIG.allowMethods);
        expect(result.headers['Access-Control-Allow-Headers']).toBe(CORS_CONFIG.allowHeaders);

        // Verify the specific expected values
        expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
        expect(result.headers['Access-Control-Allow-Methods']).toBe(
          'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        );
        expect(result.headers['Access-Control-Allow-Headers']).toBe(
          'Content-Type, Authorization'
        );
      }),
      { numRuns: 100 }
    );
  });

  it('handlePreflight returns HTTP 200 with CORS headers and empty body for OPTIONS requests', () => {
    fc.assert(
      fc.property(arbRequestPath, (path: string) => {
        // For any OPTIONS request on any path, handlePreflight produces the correct response
        const result = handlePreflight();

        // Assert statusCode is 200
        expect(result.statusCode).toBe(200);

        // Assert body is empty
        expect(result.body).toBe('');

        // Assert all required CORS headers are present
        expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
        expect(result.headers['Access-Control-Allow-Methods']).toBe(
          'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        );
        expect(result.headers['Access-Control-Allow-Headers']).toBe(
          'Content-Type, Authorization'
        );
      }),
      { numRuns: 100 }
    );
  });

  it('applyCorsHeaders preserves existing headers while adding CORS headers', () => {
    fc.assert(
      fc.property(
        arbHttpMethod,
        arbRequestPath,
        fc.string({ minLength: 1 }),
        (method: HttpMethod, path: string, existingValue: string) => {
          // Pre-existing header should be preserved after applying CORS headers
          const response = {
            headers: { 'X-Custom-Header': existingValue } as Record<string, string>,
          };

          const result = applyCorsHeaders(response);

          // Existing headers should remain intact
          expect(result.headers['X-Custom-Header']).toBe(existingValue);

          // CORS headers should also be present
          expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
          expect(result.headers['Access-Control-Allow-Methods']).toBe(
            'GET, POST, PUT, PATCH, DELETE, OPTIONS'
          );
          expect(result.headers['Access-Control-Allow-Headers']).toBe(
            'Content-Type, Authorization'
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
