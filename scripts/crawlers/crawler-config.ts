/**
 * Crawler Configuration Module
 * Centralised configuration for all crawlers in Looper HQ
 */

export interface CrawlerConfig {
  /** Maximum retry attempts per source (default: 3) */
  maxRetries: number;
  /** Delay between retries in milliseconds (default: 5000ms) */
  retryDelayMs: number;
  /** Request timeout in milliseconds (default: 15000ms) */
  timeoutMs: number;
  /** Minimum acceptable success rate 0-1 (default: 0.6) */
  successRateThreshold: number;
  /** Rotate User-Agent headers (default: true) */
  userAgentRotation: boolean;
  /** Delay between successive requests in milliseconds (default: 2000ms) */
  rateLimitDelayMs: number;
  /** Suppress log output for well-known non-critical errors (default: true) */
  silenceKnownErrors: boolean;
  /** Error message patterns that are considered non-critical */
  knownErrorPatterns: string[];
  /** Maximum consecutive failures before a source is auto-disabled */
  maxConsecutiveFailures: number;
}

/** Default crawler configuration */
export const defaultCrawlerConfig: CrawlerConfig = {
  maxRetries: 3,
  retryDelayMs: 5000,
  timeoutMs: 15000,
  successRateThreshold: 0.6,
  userAgentRotation: true,
  rateLimitDelayMs: 2000,
  silenceKnownErrors: true,
  knownErrorPatterns: [
    '403',
    '404',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'socket hang up',
    'Cloudflare',
    'Access denied',
    'Forbidden',
    'Non-whitespace before first tag',
    'Invalid XML',
    'XML parsing error',
    'Unexpected token',
  ],
  maxConsecutiveFailures: 5,
};

/**
 * A pool of common browser User-Agent strings for rotation.
 * Helps reduce the chance of being blocked by anti-crawler measures.
 */
export const USER_AGENTS: string[] = [
  // Chrome on Windows (circa 2026)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
  // Firefox on Windows (circa 2026)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  // Chrome on macOS (circa 2026)
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
  // Safari on macOS (Safari 18 era)
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  // Edge on Windows (circa 2026)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 Edg/132.0.0.0',
  // Chrome on Linux (circa 2026)
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
  // Firefox on macOS (circa 2026)
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.3; rv:133.0) Gecko/20100101 Firefox/133.0',
];

/** Return a random User-Agent string from the pool */
export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Determine whether an error message matches any known non-critical pattern.
 * When silenceKnownErrors is true, these are logged at WARN level instead of ERROR.
 */
export function isKnownError(message: string, config: CrawlerConfig = defaultCrawlerConfig): boolean {
  if (!config.silenceKnownErrors) return false;
  return config.knownErrorPatterns.some(pattern =>
    message.toLowerCase().includes(pattern.toLowerCase())
  );
}
