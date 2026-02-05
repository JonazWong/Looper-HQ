import { BaseDataSourceAdapter, SearchParams, FetchResult, PublicCaseData } from './base-adapter';
import { CaseSource } from '@looper-hq/database';
import { RssParserService, RssFeedItem } from '../rss-parser';
import { KeywordFilterService } from '../keyword-filter';
import { createHash } from 'crypto';

/**
 * Calculate text similarity using a custom weighted approach
 * Evaluates both character sequence and position proximity
 */
function assessTextSimilarity(textA: string, textB: string): number {
  if (textA === textB) return 1.0;
  if (!textA || !textB) return 0.0;
  
  const normalized1 = textA.toLowerCase().trim();
  const normalized2 = textB.toLowerCase().trim();
  
  // Tokenize by characters for CJK text compatibility
  const tokens1 = Array.from(normalized1);
  const tokens2 = Array.from(normalized2);
  
  // Build position map for O(1) lookups
  const positionMap = new Map<string, number[]>();
  tokens2.forEach((char, idx) => {
    if (!positionMap.has(char)) {
      positionMap.set(char, []);
    }
    positionMap.get(char)!.push(idx);
  });
  
  // Calculate overlap coefficient considering position
  let matchScore = 0;
  const maxLen = Math.max(tokens1.length, tokens2.length);
  
  for (let i = 0; i < tokens1.length; i++) {
    const char = tokens1[i];
    const positions = positionMap.get(char);
    if (positions && positions.length > 0) {
      // Find closest position match
      const closestPos = positions.reduce((closest, pos) => {
        const currentDiff = Math.abs(i - pos);
        const closestDiff = Math.abs(i - closest);
        return currentDiff < closestDiff ? pos : closest;
      });
      
      // Weight matches that appear in similar positions higher
      const positionDiff = Math.abs(i - closestPos);
      const positionWeight = 1 - (positionDiff / maxLen);
      matchScore += positionWeight;
    }
  }
  
  return matchScore / maxLen;
}

/**
 * Generate stable identifier from title and URL
 */
function buildStableIdentifier(heading: string, location: string): string {
  const composite = `${heading.trim()}|${location.trim()}`;
  return createHash('sha256').update(composite, 'utf8').digest('hex');
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
    const stableId = buildStableIdentifier(item.title, item.link);

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
      const similarity = assessTextSimilarity(newTitle, existing);
      if (similarity >= threshold) {
        return true;
      }
    }
    return false;
  }
}
