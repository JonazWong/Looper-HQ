/**
 * Query Parser Unit Tests
 *
 * Tests for the advanced query syntax parser that supports field:value filters,
 * quoted phrases, AND/OR/NOT operators, and mixed free-text + structured search.
 */

import { describe, it, expect } from 'vitest';
import { parseQuery } from '@/lib/services/query-parser';

describe('parseQuery — empty / blank input', () => {
  it('returns empty result for empty string', () => {
    const result = parseQuery('');
    expect(result.freeText).toBe('');
    expect(result.filters).toEqual({});
    expect(result.errors).toEqual([]);
  });

  it('returns empty result for whitespace-only string', () => {
    const result = parseQuery('   ');
    expect(result.freeText).toBe('');
    expect(result.filters).toEqual({});
  });
});

describe('parseQuery — free text only', () => {
  it('returns bare keywords as freeText', () => {
    const result = parseQuery('theft criminal law');
    expect(result.freeText).toBe('theft criminal law');
    expect(result.filters).toEqual({});
  });

  it('returns Chinese keywords as freeText', () => {
    const result = parseQuery('刑事案件');
    expect(result.freeText).toBe('刑事案件');
  });

  it('handles mixed Chinese and English', () => {
    const result = parseQuery('刑事 criminal');
    expect(result.freeText).toBe('刑事 criminal');
  });
});

describe('parseQuery — field filters', () => {
  it('parses court filter', () => {
    const result = parseQuery('court:CFI');
    expect(result.filters.court).toEqual(['CFI']);
    expect(result.freeText).toBe('');
  });

  it('parses year filter', () => {
    const result = parseQuery('year:2024');
    expect(result.filters.year).toEqual([2024]);
    expect(result.freeText).toBe('');
  });

  it('parses judge filter', () => {
    const result = parseQuery('judge:Chan');
    expect(result.filters.judge).toEqual(['Chan']);
  });

  it('parses category filter', () => {
    const result = parseQuery('category:criminal');
    expect(result.filters.category).toEqual(['criminal']);
  });

  it('parses source filter', () => {
    const result = parseQuery('source:HK_JUDICIARY');
    expect(result.filters.source).toEqual(['HK_JUDICIARY']);
  });

  it('parses caseNumber filter', () => {
    const result = parseQuery('caseNumber:HCCC123');
    expect(result.filters.caseNumber).toEqual(['HCCC123']);
  });

  it('is case-insensitive for field names', () => {
    const result = parseQuery('COURT:CA');
    expect(result.filters.court).toEqual(['CA']);
  });
});

describe('parseQuery — quoted values', () => {
  it('handles quoted field value', () => {
    const result = parseQuery('judge:"John Smith"');
    expect(result.filters.judge).toEqual(['John Smith']);
  });

  it('handles quoted free-text phrase', () => {
    const result = parseQuery('"gross negligence"');
    expect(result.freeText).toBe('gross negligence');
  });

  it('handles mix of quoted and unquoted', () => {
    const result = parseQuery('"gross negligence" theft');
    expect(result.freeText).toBe('gross negligence theft');
  });
});

describe('parseQuery — mixed field + free text', () => {
  it('extracts filters while keeping free text', () => {
    const result = parseQuery('court:CFI 刑事 theft');
    expect(result.filters.court).toEqual(['CFI']);
    expect(result.freeText).toBe('刑事 theft');
  });

  it('handles court AND year with free text', () => {
    const result = parseQuery('court:CFI AND year:2024');
    expect(result.filters.court).toEqual(['CFI']);
    expect(result.filters.year).toEqual([2024]);
    expect(result.freeText).toBe('');
  });

  it('drops AND operator from free text', () => {
    const result = parseQuery('theft AND murder');
    expect(result.freeText).toBe('theft murder');
  });

  it('drops OR operator from free text', () => {
    const result = parseQuery('theft OR murder');
    expect(result.freeText).toBe('theft murder');
  });

  it('drops NOT operator from free text', () => {
    const result = parseQuery('theft NOT murder');
    expect(result.freeText).toBe('theft murder');
  });
});

describe('parseQuery — errors and edge cases', () => {
  it('reports error for invalid year value', () => {
    const result = parseQuery('year:abcd');
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('year');
  });

  it('reports error for out-of-range year', () => {
    const result = parseQuery('year:1700');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('reports error for field with no value', () => {
    const result = parseQuery('court:');
    // Empty value — should produce an error
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('treats unknown field:value as free text', () => {
    const result = parseQuery('unknown:value theft');
    expect(result.freeText).toBe('unknown:value theft');
  });

  it('handles multiple values for same field', () => {
    const result = parseQuery('court:CFI court:CA');
    expect(result.filters.court).toEqual(['CFI', 'CA']);
  });
});

describe('parseQuery — complex real-world examples', () => {
  it('parses a full advanced query', () => {
    const result = parseQuery('court:CFI AND year:2024 judge:"Alice Wong" fraud');
    expect(result.filters.court).toEqual(['CFI']);
    expect(result.filters.year).toEqual([2024]);
    expect(result.filters.judge).toEqual(['Alice Wong']);
    expect(result.freeText).toBe('fraud');
  });

  it('handles camelCase caseNumber alias', () => {
    const result = parseQuery('caseNumber:HCCC001/2024');
    expect(result.filters.caseNumber).toEqual(['HCCC001/2024']);
  });
});
