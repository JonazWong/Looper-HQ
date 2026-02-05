import { BaseDataSourceAdapter, SearchParams, FetchResult, PublicCaseData } from './base-adapter';
import { CaseSource } from '@looper-hq/database';
import { RssParserService, RssFeedItem } from '../rss-parser';
import { KeywordFilterService } from '../keyword-filter';
import { createHash } from 'crypto';

/**
 * Compute similarity ratio between two strings using character-based comparison
 */
function computeStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  // Simple character overlap ratio
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;
  
  // Count matching characters
  let matches = 0;
  const shorterChars = new Set(shorter);
  for (const char of longer) {
    if (shorterChars.has(char)) {
      matches++;
    }
  }
  
  return matches / longerLength;
}

/**
 * Generate stable identifier from title and URL
 */
function generateStableId(title: string, url: string): string {
  const normalized = `${title.trim()}|${url.trim()}`;
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}

/**
 * RSS News Adapter
 * 
 * Fetches legal news from RSS feeds and transforms them into PublicCase format
 */
export class RssNewsAdapter extends BaseDataSourceAdapter {
  private rssParser = new RssParserService();
  private keywordFilter = new KeywordFilterService();

  constructor(
    public source: CaseSource,
    private feedUrl: string,
    private keywords: string[],
    private excludeKeywords: string[]
  ) {
    super();
  }

  async fetch(params: SearchParams): Promise<FetchResult> {
    try {
      // Fetch RSS feed
      const items = await this.rssParser.fetchFeed(this.feedUrl);
      
      // Filter by keywords
      const filtered = this.keywordFilter.filterItems(
        items,
        this.keywords,
        this.excludeKeywords
      );

      // Apply date filtering if specified
      let dateFiltered = filtered;
      if (params.dateFrom || params.dateTo) {
        dateFiltered = filtered.filter((item) => {
          const itemDate = new Date(item.pubDate);
          if (params.dateFrom && itemDate < params.dateFrom) return false;
          if (params.dateTo && itemDate > params.dateTo) return false;
          return true;
        });
      }

      // Apply limit and offset
      const start = params.offset || 0;
      const limit = params.limit || dateFiltered.length;
      const paginated = dateFiltered.slice(start, start + limit);

      // Parse items
      const cases = paginated.map((item) => this.parse(item));

      return {
        cases,
        total: dateFiltered.length,
      };
    } catch (error: any) {
      console.error(`RSS fetch failed for ${this.source}:`, error.message);
      throw error;
    }
  }

  parse(item: RssFeedItem): PublicCaseData {
    const text = `${item.title} ${item.contentSnippet || ''}`;
    
    // Extract keywords that appear in the content
    const extractedKeywords = this.keywordFilter.extractKeywords(text, this.keywords);
    
    // Auto-categorize with title parameter
    const category = this.keywordFilter.categorize(text, item.title);

    // Generate stable externalId using hash of title + link
    const stableId = generateStableId(item.title, item.link);

    return {
      source: this.source,
      externalId: stableId,
      title: item.title,
      description: item.contentSnippet || item.content,
      category: category || undefined,
      publishedAt: new Date(item.pubDate),
      author: item.creator,
      keywords: extractedKeywords,
      tags: category ? [category.toLowerCase()] : [],
      sourceUrl: item.link,
    };
  }

  /**
   * Check if a title is similar to existing titles
   */
  checkTitleSimilarity(newTitle: string, existingTitles: string[], threshold = 0.85): boolean {
    for (const existing of existingTitles) {
      const similarity = computeStringSimilarity(newTitle, existing);
      if (similarity >= threshold) {
        return true;
      }
    }
    return false;
  }
}
