/**
 * HKLII (Hong Kong Legal Information Institute) Case Crawler
 * 香港法律資訊研究中心案件爬蟲
 *
 * Features:
 * - Scrapes latest judgments from HKLII website (https://www.hklii.hk)
 * - Covers 8 court levels: CFA, CA, CFI, DC, FC, LT, Labour Tribunal, Competition Tribunal
 * - Extracts Neutral Citations (e.g. [2024] HKCFA 1)
 * - AI-powered case classification
 * - Bilingual content support (中英雙語)
 * - Case citation extraction and tracking
 * - Respects rate limits
 * - Automatic deduplication via neutral citation
 */

import { PrismaClient, CaseSource, CourtLevel } from '../../packages/database';
import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { classifyCase } from '../../apps/web/lib/services/ai-classifier';
import { defaultCrawlerConfig, getRandomUserAgent, isKnownError } from './crawler-config';

const prisma = new PrismaClient();

// Truncation limits
const MAX_FULLTEXT_LENGTH = 50000;  // max chars stored in PublicCase.fullText
const MAX_JUDGE_NAME_LENGTH = 200;  // max chars for judge field
const MAX_AI_CONTEXT_LENGTH = 500;  // chars of fullText fed to AI classifier

// Court configuration: maps HKLII URL code → CourtLevel enum + display name
interface CourtConfig {
  code: string;         // URL path segment on hklii.hk
  courtLevel: CourtLevel;
  courtName_en: string;
  courtName_zh: string;
  keywords: string[];
}

const HKLII_COURTS: CourtConfig[] = [
  {
    code: 'hkcfa',
    courtLevel: CourtLevel.CFA,
    courtName_en: 'Court of Final Appeal',
    courtName_zh: '終審法院',
    keywords: ['終審法院', 'CFA', 'Court of Final Appeal'],
  },
  {
    code: 'hkca',
    courtLevel: CourtLevel.CA,
    courtName_en: 'Court of Appeal',
    courtName_zh: '上訴法庭',
    keywords: ['上訴法庭', 'CA', 'Court of Appeal'],
  },
  {
    code: 'hkcfi',
    courtLevel: CourtLevel.CFI,
    courtName_en: 'Court of First Instance',
    courtName_zh: '原訟法庭',
    keywords: ['原訟法庭', 'CFI', 'Court of First Instance'],
  },
  {
    code: 'hkdc',
    courtLevel: CourtLevel.DC,
    courtName_en: 'District Court',
    courtName_zh: '區域法院',
    keywords: ['區域法院', 'DC', 'District Court'],
  },
  {
    code: 'hkfc',
    courtLevel: CourtLevel.FC,
    courtName_en: 'Family Court',
    courtName_zh: '家事法庭',
    keywords: ['家事法庭', 'FC', 'Family Court'],
  },
  {
    code: 'hklt',
    courtLevel: CourtLevel.LT,
    courtName_en: 'Lands Tribunal',
    courtName_zh: '土地審裁處',
    keywords: ['土地審裁處', 'LT', 'Lands Tribunal'],
  },
  {
    code: 'hklbt',
    courtLevel: CourtLevel.LABOUR,
    courtName_en: 'Labour Tribunal',
    courtName_zh: '勞資審裁處',
    keywords: ['勞資審裁處', 'Labour Tribunal'],
  },
  {
    code: 'hkct',
    courtLevel: CourtLevel.COMPETITION,
    courtName_en: 'Competition Tribunal',
    courtName_zh: '競爭事務審裁處',
    keywords: ['競爭事務審裁處', 'Competition Tribunal'],
  },
];

// Regex patterns for Neutral Citation extraction
// e.g. [2024] HKCFA 1, [2024] HKCA 123, [2024] HKCFI 456
const NEUTRAL_CITATION_PATTERNS = [
  /\[(\d{4})\]\s+(HKCFA|HKCA|HKCFI|HKDC|HKFC|HKLT|HKLBT|HKCT|HCA|HCAL|DCCC)\s+(\d+)/gi,
  /\[(\d{4})\]\s+(HKCU)\s+(\d+)/gi,
];

interface HkliiJudgmentData {
  caseNumber?: string;
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
  court: string;
  courtLevel: CourtLevel;
  judge?: string;
  judgmentDate?: Date;
  sourceUrl?: string;
  neutralCitation?: string;
  fullText?: string;
  keywords: string[];
  citationTexts?: string[]; // Neutral citations found within the judgment text
}

class HkliiCrawler {
  private client: AxiosInstance;
  private readonly baseUrl = 'https://www.hklii.hk';
  private stats = {
    fetched: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    citations: 0,
  };

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: defaultCrawlerConfig.timeoutMs,
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
  }

  /**
   * Delay between requests to respect server load
   */
  private async delay(ms: number = defaultCrawlerConfig.rateLimitDelayMs): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate content hash for deduplication
   */
  private calculateHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Parse date from various HK date formats
   */
  private parseDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;

    try {
      const patterns = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY
        /(\d{4})-(\d{2})-(\d{2})/,          // YYYY-MM-DD
        /(\d{1,2})\s+(\w+)\s+(\d{4})/,     // D Month YYYY
      ];

      for (const pattern of patterns) {
        const match = dateStr.match(pattern);
        if (match) {
          let year, month, day;

          if (pattern.source.startsWith('(\\d{4})')) {
            // YYYY-MM-DD
            [, year, month, day] = match;
          } else if (pattern.source.includes('\\w+')) {
            // D Month YYYY — use JS Date parsing
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? undefined : date;
          } else {
            // DD/MM/YYYY
            [, day, month, year] = match;
          }

          const date = new Date(`${year}-${month}-${day}`);
          return isNaN(date.getTime()) ? undefined : date;
        }
      }

      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  }

  /**
   * Extract neutral citation from text (e.g. "[2024] HKCFA 1")
   */
  private extractNeutralCitation(text: string): string | undefined {
    for (const pattern of NEUTRAL_CITATION_PATTERNS) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) {
        return match[0].replace(/\s+/g, ' ').trim();
      }
    }
    return undefined;
  }

  /**
   * Extract all neutral citations referenced within a body of text
   * Used for building case citation relationships
   */
  private extractAllCitations(text: string): string[] {
    const found = new Set<string>();
    for (const pattern of NEUTRAL_CITATION_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        found.add(match[0].replace(/\s+/g, ' ').trim());
      }
    }
    return Array.from(found);
  }

  /**
   * Extract case parties from title string ("A v B" → ["A", "B"])
   */
  private extractParties(title: string): string[] {
    const match = title.match(/^(.+?)\s+v\.?\s+(.+?)$/i);
    if (match) {
      return [match[1].trim(), match[2].trim()];
    }
    return [];
  }

  /**
   * Scrape the judgment list page for a given court (handles pagination)
   */
  async scrapeCourtListPage(court: CourtConfig, page: number = 1): Promise<HkliiJudgmentData[]> {
    const judgments: HkliiJudgmentData[] = [];
    const url = `/en/cases/${court.code}`;

    try {
      await this.delay();

      const response = await this.client.get(url, {
        params: page > 1 ? { page } : undefined,
      });

      const $ = cheerio.load(response.data);

      // HKLII judgment list selectors (multiple fallbacks for different page layouts):
      //   table.table tbody tr  — table-based listing (most court pages)
      //   .case-list .case-item — card/div-based listing (some newer pages)
      //   ul.cases li           — list-based layout (older / mobile pages)
      $('table.table tbody tr, .case-list .case-item, ul.cases li').each((_, element) => {
        const $el = $(element);

        // Try to extract a link (title + URL)
        const $link = $el.find('a').first();
        const title = $link.text().trim() || $el.find('.case-title').text().trim();
        const href = $link.attr('href') || '';

        if (!title || title.length < 3) return;

        const dateStr = $el.find('td:last-child, .date, time').text().trim();
        const caseNumberText = $el.find('td:first-child, .case-no').text().trim();

        const absoluteUrl = href.startsWith('http') ? href : (href ? `${this.baseUrl}${href}` : undefined);
        const neutralCitation = this.extractNeutralCitation(title) || this.extractNeutralCitation(caseNumberText);
        const parties = this.extractParties(title);

        const judgment: HkliiJudgmentData = {
          caseNumber: caseNumberText || neutralCitation,
          title_zh: title,
          title_en: title,
          description_zh: `${court.courtName_zh}案件 ${neutralCitation || caseNumberText || ''}`.trim(),
          description_en: `${court.courtName_en} case ${neutralCitation || caseNumberText || ''}`.trim(),
          court: court.courtName_en,
          courtLevel: court.courtLevel,
          judgmentDate: dateStr ? this.parseDate(dateStr) : undefined,
          sourceUrl: absoluteUrl,
          neutralCitation,
          keywords: [...court.keywords, ...parties],
        };

        judgments.push(judgment);
        this.stats.fetched++;
      });

      console.log(`    ✓ 第 ${page} 頁獲取 ${judgments.length} 個案件`);
    } catch (error: any) {
      const isKnown = isKnownError(error.message);
      const logLevel = isKnown ? '⚠️' : '❌';
      console.error(`    ${logLevel} 抓取 ${court.courtName_zh} 第 ${page} 頁失敗: ${error.message}`);
      this.stats.errors++;
    }

    return judgments;
  }

  /**
   * Scrape a single judgment detail page to enrich data (full text, judge, date)
   */
  async scrapeJudgmentDetail(judgment: HkliiJudgmentData): Promise<HkliiJudgmentData> {
    if (!judgment.sourceUrl) return judgment;

    try {
      await this.delay();

      const response = await this.client.get(judgment.sourceUrl, { baseURL: '' });
      const $ = cheerio.load(response.data);

      // Extract full text
      const fullText = $('.judgment-body, #judgment-content, .content-body, article').text().trim();
      if (fullText) {
        judgment.fullText = fullText.substring(0, MAX_FULLTEXT_LENGTH);
        // Re-extract neutral citation from full page content
        if (!judgment.neutralCitation) {
          judgment.neutralCitation = this.extractNeutralCitation(fullText);
        }
        // Extract all citations referenced in the text
        judgment.citationTexts = this.extractAllCitations(fullText);
      }

      // Extract judge name
      const judgeText = $('.judge, .judge-name, .coram').text().trim();
      if (judgeText && !judgment.judge) {
        judgment.judge = judgeText.substring(0, MAX_JUDGE_NAME_LENGTH);
      }

      // Extract judgment date from detail page
      const dateText = $('.judgment-date, .date, time[datetime]').first().text().trim();
      if (dateText && !judgment.judgmentDate) {
        judgment.judgmentDate = this.parseDate(dateText);
      }

      // Attempt to get bilingual title
      const titleZh = $('.title-zh, h1.zh').text().trim();
      const titleEn = $('.title-en, h1.en, h1').first().text().trim();
      if (titleZh) judgment.title_zh = titleZh;
      if (titleEn) judgment.title_en = titleEn;

    } catch (error: any) {
      // Non-fatal: detail page errors just mean we proceed with less data
      const isKnown = isKnownError(error.message);
      if (!isKnown) {
        console.warn(`    ⚠️  無法獲取判決詳情 (${judgment.sourceUrl}): ${error.message}`);
      }
    }

    return judgment;
  }

  /**
   * Save judgment to database with AI classification, then create citation links
   */
  async saveJudgment(judgment: HkliiJudgmentData): Promise<'created' | 'updated' | 'skipped'> {
    try {
      // Use neutral citation as externalId when available; fallback to hash of title
      const externalId = judgment.neutralCitation
        ? judgment.neutralCitation.replace(/\s+/g, '_')
        : this.calculateHash(`${judgment.title_en}_${judgment.court}`);

      const existing = await prisma.publicCase.findUnique({
        where: {
          source_externalId: {
            source: CaseSource.HKLII,
            externalId,
          },
        },
      });

      // AI classification for new or unclassified cases
      let aiClassification;
      if (!existing || !existing.category) {
        try {
          console.log(`    🤖 AI 分類: ${judgment.title_zh.substring(0, 50)}...`);
          aiClassification = await classifyCase(
            judgment.title_zh,
            judgment.description_zh + (judgment.fullText ? '\n' + judgment.fullText.substring(0, MAX_AI_CONTEXT_LENGTH) : '')
          );
        } catch {
          console.warn(`    ⚠️  AI 分類失敗，使用預設值`);
          aiClassification = null;
        }
      }

      let savedId: string;

      if (existing) {
        await prisma.publicCase.update({
          where: { id: existing.id },
          data: {
            title_zh: judgment.title_zh,
            title_en: judgment.title_en,
            description_zh: judgment.description_zh,
            description_en: judgment.description_en,
            court: judgment.court,
            courtLevel: judgment.courtLevel,
            judge: judgment.judge || existing.judge,
            judgmentDate: judgment.judgmentDate || existing.judgmentDate,
            sourceUrl: judgment.sourceUrl || existing.sourceUrl,
            neutralCitation: judgment.neutralCitation || existing.neutralCitation,
            fullText: judgment.fullText || existing.fullText,
            category: aiClassification?.category || existing.category,
            keywords: [...new Set([...judgment.keywords, ...(aiClassification?.keywords || [])])],
            updatedAt: new Date(),
          },
        });

        savedId = existing.id;
        this.stats.updated++;
      } else {
        const created = await prisma.publicCase.create({
          data: {
            source: CaseSource.HKLII,
            externalId,
            caseNumber: judgment.caseNumber,
            title_zh: judgment.title_zh,
            title_en: judgment.title_en,
            description_zh: judgment.description_zh,
            description_en: judgment.description_en,
            category: aiClassification?.category,
            court: judgment.court,
            courtLevel: judgment.courtLevel,
            judge: aiClassification?.judge || judgment.judge,
            judgmentDate: judgment.judgmentDate,
            sourceUrl: judgment.sourceUrl,
            neutralCitation: judgment.neutralCitation,
            fullText: judgment.fullText,
            keywords: [...new Set([...judgment.keywords, ...(aiClassification?.keywords || [])])],
            tags: [],
            crawledAt: new Date(),
          },
        });

        savedId = created.id;
        this.stats.created++;
      }

      // Save case citations (references to other cases in the judgment text)
      if (judgment.citationTexts && judgment.citationTexts.length > 0) {
        await this.saveCaseCitations(savedId, judgment.citationTexts);
      }

      return existing ? 'updated' : 'created';
    } catch (error: any) {
      const isKnown = isKnownError(error.message);
      const logLevel = isKnown ? '⚠️' : '❌';
      console.error(`    ${logLevel} 保存案件失敗 (${judgment.neutralCitation || judgment.title_en.substring(0, 40)}): ${error.message}`);
      this.stats.errors++;
      return 'skipped';
    }
  }

  /**
   * Persist case citation relationships: for each cited neutral citation,
   * look up (or skip if not found) the cited case and create a CaseCitation row.
   */
  private async saveCaseCitations(citingCaseId: string, citationTexts: string[]): Promise<void> {
    for (const citationText of citationTexts) {
      try {
        const citedCase = await prisma.publicCase.findFirst({
          where: { neutralCitation: { equals: citationText } },
          select: { id: true },
        });

        if (!citedCase) continue; // cited case not yet in DB — skip silently

        // Avoid self-citation
        if (citedCase.id === citingCaseId) continue;

        await prisma.caseCitation.upsert({
          where: {
            citingCaseId_citedCaseId: {
              citingCaseId,
              citedCaseId: citedCase.id,
            },
          },
          create: {
            citingCaseId,
            citedCaseId: citedCase.id,
            citationText,
          },
          update: {},
        });

        this.stats.citations++;
      } catch {
        // Non-fatal: citation errors should not stop the main crawl
      }
    }
  }

  /**
   * Scrape all configured courts (with pagination up to 2 pages per court)
   */
  async crawl(): Promise<number> {
    console.log('\n⚖️  開始抓取 HKLII 案件...');
    console.log('='.repeat(70));

    try {
      // Reset stats
      this.stats = { fetched: 0, created: 0, updated: 0, skipped: 0, errors: 0, citations: 0 };

      const allJudgments: HkliiJudgmentData[] = [];

      for (const court of HKLII_COURTS) {
        console.log(`\n  🏛️  抓取 ${court.courtName_zh} (${court.courtName_en})...`);

        // Fetch first 2 pages (most recent judgments)
        for (let page = 1; page <= 2; page++) {
          const judgments = await this.scrapeCourtListPage(court, page);
          allJudgments.push(...judgments);

          // Stop early if the page returned fewer than 10 results — it is likely the
        // last page.  Note: a real last page may genuinely contain <10 judgments,
        // so this is a best-effort heuristic to avoid unnecessary empty requests.
        if (judgments.length < 10) break;
        }

        // Rate limiting between courts
        await this.delay();
      }

      if (allJudgments.length === 0) {
        console.log('\n  ⚠️  未發現任何判決');
        return 0;
      }

      console.log(`\n  📊 共獲取 ${allJudgments.length} 個判決，開始儲存...\n`);

      // Save all judgments
      for (let i = 0; i < allJudgments.length; i++) {
        const judgment = allJudgments[i];
        console.log(`  [${i + 1}/${allJudgments.length}] ${judgment.neutralCitation || judgment.title_en.substring(0, 60)}`);

        // Enrich judgment with full text and citations from its detail page
        try {
          await this.scrapeJudgmentDetail(judgment);
        } catch (error: any) {
          console.warn(`    ⚠️ 無法抓取詳細內容: ${error?.message ?? error}`);
          this.stats.errors++;
        }

        const result = await this.saveJudgment(judgment);

        if (result === 'created') {
          console.log(`    ✓ 已新增`);
        } else if (result === 'updated') {
          console.log(`    ✓ 已更新`);
        } else {
          console.log(`    ⊘ 略過`);
          this.stats.skipped++;
        }

        // Rate limiting between saves
        if (i < allJudgments.length - 1) {
          await this.delay(500);
        }
      }

      // Print summary
      console.log('\n' + '='.repeat(70));
      console.log('📊 HKLII 爬蟲統計:');
      console.log(`   獲取: ${this.stats.fetched} 個案件`);
      console.log(`   新增: ${this.stats.created} 個`);
      console.log(`   更新: ${this.stats.updated} 個`);
      console.log(`   略過: ${this.stats.skipped} 個`);
      console.log(`   引用: ${this.stats.citations} 條`);
      console.log(`   錯誤: ${this.stats.errors} 個`);
      console.log('='.repeat(70));

      return this.stats.created + this.stats.updated;

    } catch (error: any) {
      console.error(`\n❌ HKLII 爬蟲執行失敗: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Main export function — matches signature of trackJudiciaryCases()
 */
export async function trackHkliiCases(): Promise<number> {
  const crawler = new HkliiCrawler();
  return await crawler.crawl();
}

// Run if called directly
if (require.main === module) {
  trackHkliiCases()
    .then((count) => {
      console.log(`\n✨ HKLII 爬蟲完成: ${count} 個案件已處理`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ HKLII 爬蟲失敗:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
