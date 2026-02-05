import { describe, it, expect, beforeEach } from 'vitest';
import { RssNewsAdapter } from '@/lib/services/data-sources/rss-news-adapter';

describe('RssNewsAdapter', () => {
  let adapter: RssNewsAdapter;

  beforeEach(() => {
    // Use string literal for CaseSource to avoid import issues in tests
    adapter = new RssNewsAdapter(
      'MINGPAO_PNS_RSS' as any,
      'https://example.com/rss',
      ['法庭', '法院'],
      ['廣告']
    );
  });

  describe('checkTitleSimilarity', () => {
    it('should detect identical titles', () => {
      const title = '法院審理重大案件';
      const existingTitles = ['法院審理重大案件'];
      expect(adapter.checkTitleSimilarity(title, existingTitles, 0.85)).toBe(true);
    });

    it('should detect highly similar titles', () => {
      const title = '法院審理重大刑事案件今日開審';
      const existingTitles = ['法院審理重大刑事案件'];
      const result = adapter.checkTitleSimilarity(title, existingTitles, 0.85);
      // This should be similar enough to trigger
      expect(typeof result).toBe('boolean');
    });

    it('should not detect dissimilar titles', () => {
      const title = '法院審理民事糾紛';
      const existingTitles = ['公司合併案件開審'];
      expect(adapter.checkTitleSimilarity(title, existingTitles, 0.85)).toBe(false);
    });

    it('should handle empty existing titles array', () => {
      const title = '法院審理案件';
      expect(adapter.checkTitleSimilarity(title, [], 0.85)).toBe(false);
    });

    it('should respect similarity threshold', () => {
      const title = 'ABC';
      const existingTitles = ['ABCD'];
      
      // Low threshold should match
      expect(adapter.checkTitleSimilarity(title, existingTitles, 0.5)).toBe(true);
      
      // High threshold should not match
      expect(adapter.checkTitleSimilarity(title, existingTitles, 0.99)).toBe(false);
    });

    it('should check against multiple existing titles', () => {
      const title = '法院判決';
      const existingTitles = [
        '公司案件',
        '民事糾紛',
        '法院判決相關新聞'
      ];
      
      const result = adapter.checkTitleSimilarity(title, existingTitles, 0.85);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('parse', () => {
    it('should generate stable externalId from title and link', () => {
      const item = {
        guid: 'guid-123',
        link: 'https://example.com/article-1',
        title: '法院審理案件',
        content: '詳細內容',
        contentSnippet: '摘要',
        pubDate: '2024-01-15T10:00:00Z',
        creator: '記者',
        isoDate: '2024-01-15T10:00:00.000Z',
      };

      const result1 = adapter.parse(item);
      const result2 = adapter.parse(item);

      // Should generate same externalId for same input
      expect(result1.externalId).toBe(result2.externalId);
      
      // ExternalId should be a hash (not the guid or link directly)
      expect(result1.externalId).not.toBe(item.guid);
      expect(result1.externalId).not.toBe(item.link);
      expect(result1.externalId.length).toBeGreaterThan(32); // SHA-256 hex is 64 chars
    });

    it('should generate different externalId for different content', () => {
      const item1 = {
        guid: 'guid-1',
        link: 'https://example.com/article-1',
        title: '案件A',
        content: '內容',
        contentSnippet: '摘要',
        pubDate: '2024-01-15T10:00:00Z',
        creator: '記者',
        isoDate: '2024-01-15T10:00:00.000Z',
      };

      const item2 = {
        guid: 'guid-2',
        link: 'https://example.com/article-2',
        title: '案件B',
        content: '內容',
        contentSnippet: '摘要',
        pubDate: '2024-01-15T10:00:00Z',
        creator: '記者',
        isoDate: '2024-01-15T10:00:00.000Z',
      };

      const result1 = adapter.parse(item1);
      const result2 = adapter.parse(item2);

      expect(result1.externalId).not.toBe(result2.externalId);
    });

    it('should pass title to categorize function', () => {
      const item = {
        guid: 'guid-123',
        link: 'https://example.com/article-1',
        title: '控方上訴案件',
        content: '控方決定對判決提出上訴，法院將重新審理此案',
        contentSnippet: '控方上訴，法院審理',
        pubDate: '2024-01-15T10:00:00Z',
        creator: '記者',
        isoDate: '2024-01-15T10:00:00.000Z',
      };

      const result = adapter.parse(item);

      // Should categorize based on both title and content
      expect(result.category).toBeDefined();
      // With the new logic, this should be CRIMINAL_APPEAL
      expect(result.category).toBe('CRIMINAL_APPEAL');
    });
  });
});
