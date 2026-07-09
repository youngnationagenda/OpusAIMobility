/**
 * CORS middleware utilities for the unified API Gateway.
 * Provides helper functions to apply CORS headers to responses
 * and handle OPTIONS preflight requests.
 *
 * Validates: Requirements 4.5, 4.7
 */

import { CORS_CONFIG } from './routing.js';

/** Generic response object that supports setting headers */
export interface CorsResponse {
  headers: Record<string, string>;
}

/** Preflight response returned by handlePreflight() */
export interface PreflightResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Applies CORS headers to a response object in-place.
 *
 * Adds:
 * - Access-Control-Allow-Origin: *
 * - Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
 * - Access-Control-Allow-Headers: Content-Type, Authorization
 *
 * @param response - A response object with a `headers` record
 * @returns The same response object with CORS headers added (for chaining)
 */
export function applyCorsHeaders<T extends CorsResponse>(response: T): T {
  response.headers['Access-Control-Allow-Origin'] = CORS_CONFIG.allowOrigins;
  response.headers['Access-Control-Allow-Methods'] = CORS_CONFIG.allowMethods;
  response.headers['Access-Control-Allow-Headers'] = CORS_CONFIG.allowHeaders;
  return response;
}

/**
 * Creates a complete preflight (OPTIONS) response with CORS headers,
 * HTTP 200 status, and an empty body.
 *
 * Use this to respond to OPTIONS requests at the API Gateway level.
 *
 * @returns A preflight response object ready to be returned to the client
 */
export function handlePreflight(): PreflightResponse {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': CORS_CONFIG.allowOrigins,
      'Access-Control-Allow-Methods': CORS_CONFIG.allowMethods,
      'Access-Control-Allow-Headers': CORS_CONFIG.allowHeaders,
    },
    body: '',
  };
}
