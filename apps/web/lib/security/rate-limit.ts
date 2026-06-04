import { NextRequest, NextResponse } from 'next/server';
import { RateLimitError } from './api-response';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;
const REQUEST_STORE = new Map<string, number[]>();

/**
 * Get client IP address from request
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.ip ?? 'unknown';
  return ip;
}

/**
 * Rate limiting middleware
 */
export function rateLimit(
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = RATE_LIMIT_WINDOW
) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const clientId = getClientIp(request);
      const now = Date.now();
      const key = `${clientId}`;

      // Initialize or get request timestamps
      const timestamps = REQUEST_STORE.get(key) ?? [];

      // Filter out old requests outside the window
      const recentRequests = timestamps.filter((time) => now - time < windowMs);

      // Check if rate limit exceeded
      if (recentRequests.length >= maxRequests) {
        throw new RateLimitError(
          `Rate limit exceeded: ${maxRequests} requests per ${windowMs / 1000}s`
        );
      }

      // Add current request timestamp
      recentRequests.push(now);
      REQUEST_STORE.set(key, recentRequests);

      // Clean up old entries periodically
      if (Math.random() < 0.01) {
        for (const [storeKey, times] of REQUEST_STORE.entries()) {
          const filtered = times.filter((time) => now - time < windowMs);
          if (filtered.length === 0) {
            REQUEST_STORE.delete(storeKey);
          } else {
            REQUEST_STORE.set(storeKey, filtered);
          }
        }
      }

      return handler(request);
    };
  };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(reset));
  return response;
}
