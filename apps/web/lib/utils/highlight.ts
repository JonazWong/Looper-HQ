/**
 * Highlight utility
 *
 * Provides XSS-safe highlight functions for search result snippets.
 * Only the `<mark>` tag is allowed in output; all other HTML is escaped.
 */

/**
 * Escape HTML special characters.
 * Used to sanitise user-controlled content before rendering.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitise a snippet that may contain `<mark>` tags produced by ts_headline.
 *
 * Strategy:
 *  1. Strip ALL tags except `<mark>` and `</mark>`.
 *  2. The `<mark>` tags must be literal — no attributes are permitted.
 *
 * This ensures the output is safe to inject as `dangerouslySetInnerHTML`.
 */
export function sanitiseHighlight(raw: string): string {
  // First escape everything…
  const escaped = escapeHtml(raw);
  // …then un-escape only the literal <mark> and </mark> sequences that
  // ts_headline produces (no attributes, lowercase, no spaces).
  return escaped
    .replace(/&lt;mark&gt;/g, '<mark>')
    .replace(/&lt;\/mark&gt;/g, '</mark>');
}

/**
 * Client-side substring highlight.
 *
 * Highlights occurrences of each token in `text` with `<mark>` tags.
 * The output is XSS-safe because the text is HTML-escaped before wrapping.
 *
 * @param text    Plain text to highlight.
 * @param tokens  Array of search terms (case-insensitive match).
 * @returns       HTML string with `<mark>` wrapping matched substrings.
 */
export function highlightTokens(text: string, tokens: string[]): string {
  if (!tokens.length || !text) return escapeHtml(text);

  // Build a single regex that matches any of the tokens (longest first to avoid
  // partial shadowing) — use word-boundary where possible for Latin scripts.
  const sorted = [...tokens].sort((a, b) => b.length - a.length);
  const pattern = sorted
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  const re = new RegExp(`(${pattern})`, 'gi');

  // Split, escape, reassemble with <mark> wrappers
  const parts = text.split(re);
  return parts
    .map((part) => (re.test(part) ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part)))
    .join('');
}
