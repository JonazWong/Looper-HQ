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
    pattern: 'news.mingpao.com/rss/ins',
    reason: 'Returns invalid XML — RSS feed format changed or broken',
    permanent: false,
    addedAt: '2026-02-25',
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
 * Matching is done in a URL-aware, case-insensitive way to avoid
 * false positives from simple substring checks.
 *
 * - Patterns without "/" are treated as domain patterns, e.g. "rthk.hk"
 *   matches "rthk.hk" and any of its subdomains.
 * - Patterns with "/" are treated as "host + path" patterns, e.g.
 *   "news.mingpao.com/rss/pns" requires:
 *     hostname === "news.mingpao.com" (or its subdomains) AND
 *     pathname contains "/rss/pns".
 *
 * @param url The URL to test
 * @returns The matching BlacklistedSource entry, or null if not blacklisted
 */
export function isBlacklisted(url: string): BlacklistedSource | null {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    // If the URL is invalid, we conservatively treat it as not blacklisted.
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();

  return (
    SOURCE_BLACKLIST.find(entry => {
      const pattern = entry.pattern.toLowerCase();

      // If the pattern includes a "/", treat it as "host + path"
      const slashIndex = pattern.indexOf('/');
      if (slashIndex !== -1) {
        const hostPattern = pattern.slice(0, slashIndex);
        const pathPattern = pattern.slice(slashIndex); // includes leading "/"

        const hostMatches =
          hostname === hostPattern ||
          hostname.endsWith(`.${hostPattern}`);

        const pathMatches = pathname.includes(pathPattern);

        return hostMatches && pathMatches;
      }

      // Otherwise, treat the pattern as a pure domain pattern.
      return hostname === pattern || hostname.endsWith(`.${pattern}`);
    }) ?? null
  );
}
