'use client';

/**
 * HighlightedText — renders a snippet that may contain <mark> tags.
 *
 * IMPORTANT: Only accepts HTML that has been produced by `sanitiseHighlight`
 * from @/lib/utils/highlight — which ensures only <mark> tags are present
 * and all other HTML is escaped.  Never pass raw user input here.
 */

interface HighlightedTextProps {
  /** Pre-sanitised HTML snippet.  May contain <mark> tags. */
  html: string;
  className?: string;
}

export function HighlightedText({ html, className = '' }: HighlightedTextProps) {
  return (
    // eslint-disable-next-line react/no-danger
    <span
      className={className}
      // This is safe: `html` is always produced by `sanitiseHighlight` which
      // escapes everything except literal <mark>...</mark> tags.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
