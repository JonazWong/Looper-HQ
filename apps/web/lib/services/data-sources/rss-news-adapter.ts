import { BaseDataSourceAdapter, SearchParams, FetchResult, PublicCaseData } from './base-adapter';
import { CaseSource } from '@looper-hq/database';
import { RssParserService, RssFeedItem } from '../rss-parser';
import { KeywordFilterService } from '../keyword-filter';

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
    
    // Auto-categorize
    const category = this.keywordFilter.categorize(text);

    return {
      source: this.source,
      externalId: item.guid || item.link,
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
}
