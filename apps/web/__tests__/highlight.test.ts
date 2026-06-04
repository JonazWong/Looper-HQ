/**
 * Highlight Utility Tests
 */

import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitiseHighlight, highlightTokens } from '@/lib/utils/highlight';

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml({ text: 'a & b' })).toBe('a &amp; b');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml({ text: '<script>' })).toBe('&lt;script&gt;');
  });

  it('escapes quotes', () => {
    expect(escapeHtml({ text: '"hello"' })).toBe('&quot;hello&quot;');
  });

  it('leaves plain text unchanged', () => {
    expect(escapeHtml({ text: 'hello world' })).toBe('hello world');
  });
});

describe('sanitiseHighlight', () => {
  it('preserves <mark> and </mark> tags', () => {
    const input = 'This is a <mark>match</mark> here';
    const result = sanitiseHighlight(input);
    expect(result).toBe('This is a <mark>match</mark> here');
  });

  it('strips other HTML tags', () => {
    const input = '<b>bold</b> text';
    const result = sanitiseHighlight(input);
    expect(result).not.toContain('<b>');
    expect(result).toContain('bold');
  });

  it('escapes script tags for XSS safety', () => {
    const input = '<script>alert("xss")</script>';
    const result = sanitiseHighlight(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('</script>');
  });

  it('does not allow mark with attributes (attributes are HTML-escaped)', () => {
    const input = '<mark class="evil" onclick="xss()">text</mark>';
    const result = sanitiseHighlight(input);
    // The opening <mark class="evil"...> has attributes so it's NOT unescaped,
    // meaning it stays as &lt;mark ...&gt; - no active event handler.
    // The closing </mark> IS unescaped because the plain </mark> regex matches it.
    // Crucially: there is no live DOM element with onclick; the attributes stay escaped.
    expect(result).not.toContain('<mark class=');
    expect(result).not.toContain('onclick="');
  });

  it('handles multiple marks', () => {
    const input = '<mark>one</mark> and <mark>two</mark>';
    const result = sanitiseHighlight(input);
    expect(result).toBe('<mark>one</mark> and <mark>two</mark>');
  });

  it('handles empty string', () => {
    expect(sanitiseHighlight('')).toBe('');
  });
});

describe('highlightTokens', () => {
  it('wraps matching tokens with <mark>', () => {
    const result = highlightTokens('This is a test case', ['test']);
    expect(result).toContain('<mark>');
    expect(result).toContain('</mark>');
    expect(result).toContain('test');
  });

  it('is case-insensitive', () => {
    const result = highlightTokens('The Court ruled', ['court']);
    expect(result.toLowerCase()).toContain('<mark>court</mark>');
  });

  it('escapes HTML in the source text', () => {
    const result = highlightTokens('<script>xss</script>', ['xss']);
    expect(result).not.toContain('<script>');
  });

  it('returns escaped text when no tokens match', () => {
    const result = highlightTokens('Hello world', ['xyz']);
    expect(result).toBe('Hello world');
  });

  it('returns escaped text for empty tokens array', () => {
    const result = highlightTokens('Hello & world', []);
    expect(result).toBe('Hello &amp; world');
  });

  it('handles empty input text', () => {
    const result = highlightTokens('', ['test']);
    expect(result).toBe('');
  });

  it('highlights multiple tokens', () => {
    const result = highlightTokens('theft and burglary', ['theft', 'burglary']);
    expect(result).toContain('<mark>');
    // Both words should be highlighted
    const markCount = (result.match(/<mark>/g) || []).length;
    expect(markCount).toBeGreaterThanOrEqual(2);
  });
});
