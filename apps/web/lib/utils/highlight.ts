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
export function escapeHtml({ text }: { text: string; }): string {
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
  const escaped = escapeHtml({ text: raw });
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
  if (!tokens.length || !text) return escapeHtml({ text });

  // Build a single regex that matches any of the tokens (longest first to avoid
  // partial shadowing) — use case-insensitive flag only (not global, to avoid
  // lastIndex side effects when calling re.test()).
  const sorted = [...tokens].sort((a, b) => b.length - a.length);
  const pattern = sorted
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  // Use a fresh RegExp for matching and splitting (with 'gi' flag on split regex).
  const splitRe = new RegExp(`(${pattern})`, 'gi');
  // Separate test regex without 'g' flag to avoid lastIndex side effects.
  const testRe = new RegExp(`^(?:${pattern})$`, 'i');

  // Split, escape, reassemble with <mark> wrappers
  const parts = text.split(splitRe);
  return parts
    .map((part) => (testRe.test(part) ? `<mark>${escapeHtml({ text: part })}</mark>` : escapeHtml({ text: part })))
    .join('');
}
