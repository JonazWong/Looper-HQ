import { RssFeedItem } from './rss-parser';

export class KeywordFilterService {
  /**
   * Check if text contains any of the keywords (case-insensitive)
   */
  containsKeyword(text: string, keywords: string[]): boolean {
    if (keywords.length === 0) return true;
    
    const lowerText = text.toLowerCase();
    return keywords.some((keyword) =>
      lowerText.includes(keyword.toLowerCase())
    );
  }

  /**
   * Filter RSS items by keywords
   */
  filterItems(
    items: RssFeedItem[],
    keywords: string[],
    excludeKeywords: string[]
  ): RssFeedItem[] {
    return items.filter((item) => {
      const text = `${item.title} ${item.contentSnippet || ''}`;

      // Must contain at least one keyword (if keywords are specified)
      if (keywords.length > 0 && !this.containsKeyword(text, keywords)) {
        return false;
      }

      // Must not contain any exclude keyword
      if (excludeKeywords.length > 0 && this.containsKeyword(text, excludeKeywords)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Extract keywords from text that match the dictionary
   */
  extractKeywords(text: string, dictionary: string[]): string[] {
    const lowerText = text.toLowerCase();
    return dictionary.filter((keyword) =>
      lowerText.includes(keyword.toLowerCase())
    );
  }

  /**
   * Auto-categorize content based on keywords
   */
  categorize(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    const categories = {
      'Criminal': ['criminal', 'prosecution', '刑事', '檢控', '罪名'],
      'Civil': ['civil', 'plaintiff', 'defendant', '民事', '原告', '被告'],
      'Corporate': ['corporate', 'company', 'merger', '企業', '公司', '合併'],
      'Family': ['family', 'divorce', 'custody', '家庭', '離婚', '撫養'],
      'Property': ['property', 'land', 'real estate', '物業', '地產', '土地'],
      'Employment': ['employment', 'labor', 'dismissal', '僱傭', '勞工', '解僱'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }

    return null;
  }
}
