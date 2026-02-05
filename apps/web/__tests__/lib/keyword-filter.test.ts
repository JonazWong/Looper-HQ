import { describe, it, expect } from 'vitest';
import { KeywordFilterService } from '@/lib/services/keyword-filter';

describe('KeywordFilterService', () => {
  const service = new KeywordFilterService();

  describe('categorize', () => {
    it('should return OTHER when content has no legal keywords', () => {
      const text = '今日天氣很好，適合郊遊';
      const title = '天氣報告';
      expect(service.categorize(text, title)).toBe('OTHER');
    });

    it('should return OTHER when title has no case-related keywords', () => {
      const text = '法庭今天舉行聽證會';
      const title = '一般新聞報導';
      expect(service.categorize(text, title)).toBe('OTHER');
    });

    it('should categorize as CRIMINAL_APPEAL when prosecution and appeal present', () => {
      const text = '控方提出上訴，法庭將於下月審理此案';
      const title = '控方上訴案件開審';
      expect(service.categorize(text, title)).toBe('CRIMINAL_APPEAL');
    });

    it('should categorize as CRIMINAL_APPEAL with 律政司 and 上訴', () => {
      const text = '律政司決定就此案提出上訴，法院已接受申請';
      const title = '律政司上訴案件';
      expect(service.categorize(text, title)).toBe('CRIMINAL_APPEAL');
    });

    it('should categorize as CRIMINAL when magistrates court without appeal', () => {
      const text = '被告在裁判法院出庭應訊，法庭將案件押後';
      const title = '裁判法院案件押後';
      expect(service.categorize(text, title)).toBe('CRIMINAL');
    });

    it('should categorize as CRIMINAL with criminal bias keywords', () => {
      const text = '廉署起訴三名被告，涉嫌貪污罪行，法院將開審';
      const title = '廉署起訴貪污案';
      expect(service.categorize(text, title)).toBe('CRIMINAL');
    });

    it('should categorize as CRIMINAL with 調查 keyword', () => {
      const text = '警方調查案件，法庭將於下月開審';
      const title = '調查案件開審';
      expect(service.categorize(text, title)).toBe('CRIMINAL');
    });

    it('should categorize as Civil when civil keywords present', () => {
      const text = '原告入稟法院，指被告違反合約，要求賠償';
      const title = '民事訴訟案開審';
      expect(service.categorize(text, title)).toBe('CIVIL');
    });

    it('should categorize as Corporate when corporate keywords present', () => {
      const text = '公司合併案件，法院審理企業重組申請';
      const title = '企業合併案';
      expect(service.categorize(text, title)).toBe('CORPORATE');
    });

    it('should categorize as Family when family keywords present', () => {
      const text = '離婚案件涉及子女撫養權爭議，法庭將作出裁決';
      const title = '離婚案件開審';
      expect(service.categorize(text, title)).toBe('FAMILY');
    });

    it('should categorize as Property when property keywords present', () => {
      const text = '物業糾紛案件，涉及地產交易問題，法院將審理';
      const title = '物業糾紛案';
      expect(service.categorize(text, title)).toBe('PROPERTY');
    });

    it('should categorize as Employment when employment keywords present', () => {
      const text = '僱傭糾紛案件，涉及不當解僱，勞工法院將開審';
      const title = '僱傭糾紛案開審';
      expect(service.categorize(text, title)).toBe('EMPLOYMENT');
    });

    it('should return OTHER when only legal keywords but no specific category', () => {
      const text = '法院一般行政事務，案件編號系統更新';
      const title = '法院系統更新案';
      expect(service.categorize(text, title)).toBe('OTHER');
    });

    it('should handle mixed content with priority to CRIMINAL_APPEAL', () => {
      const text = '控方對民事判決提出上訴，法庭將重新審理';
      const title = '控方上訴案';
      expect(service.categorize(text, title)).toBe('CRIMINAL_APPEAL');
    });

    it('should work with title-only categorization', () => {
      const text = '法院開審重大案件，控方提出多項控罪';
      const title = '重大刑事案件開審';
      const result = service.categorize(text, title);
      expect(result).not.toBe('OTHER');
    });
  });

  describe('containsKeyword', () => {
    it('should detect keyword presence', () => {
      expect(service.containsKeyword('法院開審', ['法院'])).toBe(true);
      expect(service.containsKeyword('法院開審', ['法庭'])).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(service.containsKeyword('Court Case', ['court'])).toBe(true);
      expect(service.containsKeyword('COURT CASE', ['court'])).toBe(true);
    });

    it('should return true for empty keyword array', () => {
      expect(service.containsKeyword('任何文字', [])).toBe(true);
    });
  });

  describe('extractKeywords', () => {
    it('should extract matching keywords from text', () => {
      const text = '法院判決民事案件';
      const dictionary = ['法院', '判決', '刑事', '民事'];
      const extracted = service.extractKeywords(text, dictionary);
      expect(extracted).toContain('法院');
      expect(extracted).toContain('判決');
      expect(extracted).toContain('民事');
      expect(extracted).not.toContain('刑事');
    });

    it('should handle empty dictionary', () => {
      const extracted = service.extractKeywords('任何文字', []);
      expect(extracted).toEqual([]);
    });
  });
});
