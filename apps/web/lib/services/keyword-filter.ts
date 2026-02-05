import { RssFeedItem } from './rss-parser';

export class KeywordFilterService {
  // Keyword collections for multi-stage filtering
  private static readonly LEGAL_CONTEXT_TERMS = [
    '法庭', '法律', '法院', '審裁處', '裁判法院', '上訴庭', 
    '上訴委員會', '監管局', '死因裁判庭', '淫穢及不雅物品審裁處', 
    '案件編號', '案件號碼'
  ];

  private static readonly CASE_RELATED_MARKERS = [
    '宗', '案', '開審', '保釋', '勝', '敗', '控方', '被告', 
    '還押', '押後', '入稟', '原告', '上訴', '申請', '涉嫌', '調查', 
    '落案', '落案起訴', '合理辯解', '控罪', '罪行'
  ];

  private static readonly CRIMINAL_BIAS_INDICATORS = [
    '調查', '廉署', '廉署起訴', '控罪', '罪行', '落案', '落案起訴', '涉嫌'
  ];

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
   * Auto-categorize content based on keywords with multi-stage validation
   * Returns CaseCategory enum value (uppercase)
   */
  categorize(text: string, title?: string): string | null {
    const contentNormalized = text.toLowerCase();
    const headingNormalized = (title || text).toLowerCase();
    
    // Validation pipeline: Check if content qualifies as legal news
    const hasLegalContext = KeywordFilterService.LEGAL_CONTEXT_TERMS.some(
      term => contentNormalized.includes(term)
    );
    if (!hasLegalContext) {
      return 'OTHER';
    }
    
    // Validation pipeline: Verify title contains case-related markers
    const hasCaseMarker = KeywordFilterService.CASE_RELATED_MARKERS.some(
      marker => headingNormalized.includes(marker)
    );
    if (!hasCaseMarker) {
      return 'OTHER';
    }
    
    // Classification logic for criminal cases
    const indicators = {
      magistratesCourt: contentNormalized.includes('裁判法院'),
      appealMention: contentNormalized.includes('上訴'),
      prosecutionMention: contentNormalized.includes('控方') || contentNormalized.includes('律政司'),
    };
    
    // Rule: Prosecution + Appeal = Criminal Appeal
    if (indicators.prosecutionMention && indicators.appealMention) {
      return 'CRIMINAL_APPEAL';
    }
    
    // Rule: Magistrates Court without Appeal = Criminal
    if (indicators.magistratesCourt && !indicators.appealMention) {
      return 'CRIMINAL';
    }
    
    // Bias check: Strong criminal indicators
    const hasCriminalBias = KeywordFilterService.CRIMINAL_BIAS_INDICATORS.some(
      term => contentNormalized.includes(term)
    );
    
    if (hasCriminalBias) {
      return 'CRIMINAL';
    }
    
    // Category mapping for other case types
    const categoryMap = [
      { name: 'CIVIL', terms: ['civil', 'plaintiff', 'defendant', '民事', '原告', '被告'] },
      { name: 'CORPORATE', terms: ['corporate', 'company', 'merger', '企業', '公司', '合併'] },
      { name: 'FAMILY', terms: ['family', 'divorce', 'custody', '家庭', '離婚', '撫養'] },
      { name: 'PROPERTY', terms: ['property', 'land', 'real estate', '物業', '地產', '土地'] },
      { name: 'EMPLOYMENT', terms: ['employment', 'labor', 'dismissal', '僱傭', '勞工', '解僱'] },
    ];

    for (const cat of categoryMap) {
      const matchFound = cat.terms.some(term => contentNormalized.includes(term));
      if (matchFound) {
        return cat.name;
      }
    }

    return 'OTHER';
  }
}
