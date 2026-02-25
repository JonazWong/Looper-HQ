/**
 * Source Blacklist Module
 * Domains known to block automated crawlers.
 * Crawlers should check this list before making requests.
 */

export interface BlacklistedSource {
  /** Domain or URL pattern to match */
  pattern: string;
  /** Human-readable reason for blacklisting */
  reason: string;
  /** Whether the block is permanent or temporary */
  permanent: boolean;
  /** ISO date string when the entry was added */
  addedAt: string;
}

/**
 * Known domains / URL patterns that block automated access.
 * Sources listed here will be silently skipped by crawlers.
 */
export const SOURCE_BLACKLIST: BlacklistedSource[] = [
  {
    pattern: 'news.mingpao.com/rss/pns',
    reason: 'Returns HTTP 403 — Cloudflare protection on PNS RSS endpoint',
    permanent: false,
    addedAt: '2025-01-01',
  },
  {
    pattern: 'rthk.hk',
    reason: 'Anti-crawler measures — robots.txt disallows automated access',
    permanent: false,
    addedAt: '2025-01-01',
  },
];

/**
 * Check whether a URL matches any entry in the blacklist.
 * @param url The URL to test
 * @returns The matching BlacklistedSource entry, or null if not blacklisted
 */
export function isBlacklisted(url: string): BlacklistedSource | null {
  return SOURCE_BLACKLIST.find(entry => url.includes(entry.pattern)) ?? null;
}
