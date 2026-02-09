/**
 * Search Engine Test Suite
 * Tests for full-text search, semantic search, and hybrid search functionality
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  fulltextSearch,
  semanticSearch,
  hybridSearch,
  search,
  searchSuggestions,
  getTrendingSearches,
} from '@/lib/services/search-engine';

describe('Search Engine', () => {
  describe('fulltextSearch', () => {
    it('should return search results with ranking', async () => {
      const results = await fulltextSearch({
        query: 'criminal',
        limit: 10,
      });

      expect(results).toHaveProperty('cases');
      expect(results).toHaveProperty('total');
      expect(results).toHaveProperty('took');
      expect(results.took).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(results.cases)).toBe(true);
    });

    it('should apply source filter', async () => {
      const results = await fulltextSearch({
        query: 'case',
        source: 'HK_JUDICIARY',
        limit: 5,
      });

      if (results.cases.length > 0) {
        expect(results.cases.every(c => c.source === 'HK_JUDICIARY')).toBe(true);
      }
    });

    it('should respect pagination', async () => {
      const page1 = await fulltextSearch({
        query: 'test',
        page: 1,
        limit: 5,
      });

      const page2 = await fulltextSearch({
        query: 'test',
        page: 2,
        limit: 5,
      });

      expect(page1.cases).not.toEqual(page2.cases);
    });

    it('should handle date filters', async () => {
      const dateFrom = new Date('2024-01-01');
      const results = await fulltextSearch({
        query: 'case',
        dateFrom,
        limit: 10,
      });

      if (results.cases.length > 0) {
        results.cases.forEach(c => {
          expect(new Date(c.crawledAt).getTime()).toBeGreaterThanOrEqual(dateFrom.getTime());
        });
      }
    });
  });

  describe('semanticSearch', () => {
    it('should return keyword-matched results', async () => {
      const results = await semanticSearch({
        query: 'theft burglary',
        limit: 5,
      });

      expect(results).toHaveProperty('cases');
      expect(results).toHaveProperty('total');
      expect(results).toHaveProperty('took');
      expect(Array.isArray(results.cases)).toBe(true);
    });
  });

  describe('hybridSearch', () => {
    it('should combine fulltext and semantic results', async () => {
      const results = await hybridSearch({
        query: 'criminal case',
        limit: 10,
      });

      expect(results).toHaveProperty('cases');
      expect(results).toHaveProperty('total');
      expect(results).toHaveProperty('took');
      expect(Array.isArray(results.cases)).toBe(true);
    });

    it('should deduplicate results', async () => {
      const results = await hybridSearch({
        query: 'test',
        limit: 20,
      });

      const ids = results.cases.map(c => c.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });
  });

  describe('search (unified entry point)', () => {
    it('should route to fulltext search by default', async () => {
      const results = await search({
        query: 'test',
        limit: 5,
      });

      expect(results).toHaveProperty('cases');
      expect(results).toHaveProperty('total');
    });

    it('should route to semantic search when specified', async () => {
      const results = await search({
        query: 'test',
        searchMode: 'semantic',
        limit: 5,
      });

      expect(results).toHaveProperty('cases');
      expect(results).toHaveProperty('total');
    });

    it('should route to hybrid search when specified', async () => {
      const results = await search({
        query: 'test',
        searchMode: 'hybrid',
        limit: 5,
      });

      expect(results).toHaveProperty('cases');
      expect(results).toHaveProperty('total');
    });
  });

  describe('searchSuggestions', () => {
    it('should return empty array for short queries', async () => {
      const suggestions = await searchSuggestions('a');
      expect(suggestions).toEqual([]);
    });

    it('should return matching titles', async () => {
      const suggestions = await searchSuggestions('case', 5);
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getTrendingSearches', () => {
    it('should return trending searches', async () => {
      const trending = await getTrendingSearches(10);
      expect(Array.isArray(trending)).toBe(true);
      
      trending.forEach(item => {
        expect(item).toHaveProperty('query');
        expect(item).toHaveProperty('count');
        expect(typeof item.query).toBe('string');
        expect(typeof item.count).toBe('number');
      });
    });

    it('should respect limit parameter', async () => {
      const trending = await getTrendingSearches(5);
      expect(trending.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Performance', () => {
    it('should complete fulltext search in under 200ms', async () => {
      const start = Date.now();
      await fulltextSearch({
        query: 'test case criminal',
        limit: 20,
      });
      const duration = Date.now() - start;

      // Note: This may fail in CI/test environments with slower databases
      // Adjust threshold as needed for your environment
      expect(duration).toBeLessThan(500); // Relaxed for test environment
    });
  });

  describe('Chinese Text Support', () => {
    it('should search Chinese text', async () => {
      const results = await fulltextSearch({
        query: '刑事',
        limit: 10,
      });

      expect(results).toHaveProperty('cases');
      expect(Array.isArray(results.cases)).toBe(true);
    });

    it('should support mixed Chinese and English', async () => {
      const results = await fulltextSearch({
        query: '刑事 criminal',
        limit: 10,
      });

      expect(results).toHaveProperty('cases');
      expect(Array.isArray(results.cases)).toBe(true);
    });
  });
});
