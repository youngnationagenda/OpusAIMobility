/**
 * Path routing utilities for the unified API Gateway.
 * Handles routing logic between OpusAIMobility (default) and TerraAI (/terra/* prefix).
 *
 * Full implementation in task 5.1 — this module provides the core routing
 * constants and helper types used by both API Gateway configuration and tests.
 */

/** The path prefix used to route requests to the TerraAI service */
export const TERRA_PATH_PREFIX = '/terra';

/** Supported HTTP methods for API Gateway routing */
export const SUPPORTED_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
] as const;

export type HttpMethod = (typeof SUPPORTED_METHODS)[number];

/** Route target identifiers */
export type RouteTarget = 'opusaimobility' | 'terraai';

/** Result of routing a request path */
export interface RouteResult {
  /** Which backend service handles this request */
  target: RouteTarget;
  /** The path forwarded to the target service (prefix stripped for TerraAI) */
  forwardPath: string;
}

/**
 * CORS configuration applied at the API Gateway level.
 */
export const CORS_CONFIG = {
  allowOrigins: '*',
  allowMethods: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  allowHeaders: 'Content-Type, Authorization',
  maxAge: 86400,
} as const;

/**
 * Determines the route target for a given request path.
 * - Paths starting with `/terra/` are routed to the TerraAI service with the prefix stripped.
 * - All other paths are routed to the OpusAIMobility Lambda with the original path preserved.
 *
 * @param path - The incoming request path (e.g., `/terra/chat` or `/platform/settings`)
 * @returns The route result indicating target and forwarded path
 */
export function resolveRoute(path: string): RouteResult {
  if (path.startsWith(TERRA_PATH_PREFIX + '/')) {
    return {
      target: 'terraai',
      forwardPath: path.slice(TERRA_PATH_PREFIX.length),
    };
  }

  // Exact match for /terra (without trailing slash) also routes to TerraAI
  if (path === TERRA_PATH_PREFIX) {
    return {
      target: 'terraai',
      forwardPath: '/',
    };
  }

  return {
    target: 'opusaimobility',
    forwardPath: path,
  };
}

/**
 * Builds CORS response headers for API Gateway responses.
 */
export function buildCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': CORS_CONFIG.allowOrigins,
    'Access-Control-Allow-Methods': CORS_CONFIG.allowMethods,
    'Access-Control-Allow-Headers': CORS_CONFIG.allowHeaders,
  };
}
