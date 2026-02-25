/**
 * Hong Kong Judiciary Case Crawler
 * 香港司法機構案件爬蟲
 * 
 * Features:
 * - Scrapes latest judgments from HK Judiciary website
 * - AI-powered case classification
 * - Bilingual content support (中英雙語)
 * - Respects robots.txt and rate limits
 * - Automatic deduplication
 */

import { PrismaClient, CaseSource } from '../../packages/database';
import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { classifyCase } from '../../apps/web/lib/services/ai-classifier';
import { defaultCrawlerConfig, getRandomUserAgent, isKnownError } from './crawler-config';

const prisma = new PrismaClient();

interface JudgmentData {
  caseNumber: string;
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
  court: string;
  category?: string;
  judge?: string;
  judgmentDate?: Date;
  documentUrl?: string;
  keywords: string[];
}

class HKJudiciaryCrawler {
  private client: AxiosInstance;
  private readonly baseUrl = 'https://legalref.judiciary.hk';
  private stats = {
    fetched: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  };

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: defaultCrawlerConfig.timeoutMs,
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      }
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
      // Try formats: "DD/MM/YYYY", "YYYY-MM-DD", "D MMMM YYYY"
      const patterns = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
        /(\d{4})-(\d{2})-(\d{2})/,       // YYYY-MM-DD
      ];

      for (const pattern of patterns) {
        const match = dateStr.match(pattern);
        if (match) {
          let year, month, day;
          
          if (pattern.source.startsWith('(\\d{4})')) {
            // YYYY-MM-DD format
            [, year, month, day] = match;
          } else {
            // DD/MM/YYYY format
            [, day, month, year] = match;
          }
          
          const date = new Date(`${year}-${month}-${day}`);
          return isNaN(date.getTime()) ? undefined : date;
        }
      }

      // Fallback to default parsing
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  }

  /**
   * Extract case parties from title
   * Example: "A v B" -> [A, B]
   */
  private extractParties(title: string): string[] {
    const match = title.match(/^(.+?)\s+v\.?\s+(.+?)$/i);
    if (match) {
      return [match[1].trim(), match[2].trim()];
    }
    return [];
  }

  /**
   * Scrape Court of Appeal judgments
   */
  async scrapeCourtOfAppeal(): Promise<JudgmentData[]> {
    console.log('  📜 抓取上訴法庭判決書...');
    const judgments: JudgmentData[] = [];

    try {
      await this.delay();
      
      // Scrape HK Legal Reference System - Court of Appeal
      const response = await this.client.get('/lrs/common/ju/ju_frame.jsp?DIS=152', {
        params: {
          currpage: 1,
          DIS: 152, // Court of Appeal
        }
      });

      const $ = cheerio.load(response.data);
      
      // Parse judgment list (adjust selectors based on actual HTML structure)
      $('table.judgment-list tr').each((_, element) => {
        const $row = $(element);
        
        const caseNumber = $row.find('td:nth-child(1)').text().trim();
        const titleCell = $row.find('td:nth-child(2)');
        const dateStr = $row.find('td:nth-child(3)').text().trim();
        const linkHref = titleCell.find('a').attr('href');

        if (!caseNumber || caseNumber === 'Case No.') return; // Skip header row

        const title = titleCell.text().trim();
        const parties = this.extractParties(title);

        judgments.push({
          caseNumber,
          title_zh: title,
          title_en: title, // English version (same for now)
          description_zh: `上訴法庭案件 ${caseNumber}`,
          description_en: `Court of Appeal Case ${caseNumber}`,
          court: 'Court of Appeal',
          judgmentDate: this.parseDate(dateStr),
          documentUrl: linkHref ? `${this.baseUrl}${linkHref}` : undefined,
          keywords: ['上訴', 'Court of Appeal', ...parties]
        });

        this.stats.fetched++;
      });

      console.log(`    ✓ 獲取 ${judgments.length} 個上訴法庭案件`);
    } catch (error: any) {
      const isKnown = isKnownError(error.message);
      const logLevel = isKnown ? '⚠️' : '❌';
      console.error(`    ${logLevel} 抓取上訴法庭失敗: ${error.message}`);
      this.stats.errors++;
    }

    return judgments;
  }

  /**
   * Scrape High Court judgments
   */
  async scrapeHighCourt(): Promise<JudgmentData[]> {
    console.log('  ⚖️  抓取高等法院判決書...');
    const judgments: JudgmentData[] = [];

    try {
      await this.delay();

      const response = await this.client.get('/lrs/common/ju/ju_frame.jsp?DIS=100', {
        params: {
          currpage: 1,
          DIS: 100, // High Court
        }
      });

      const $ = cheerio.load(response.data);

      $('table.judgment-list tr').each((_, element) => {
        const $row = $(element);
        
        const caseNumber = $row.find('td:nth-child(1)').text().trim();
        const titleCell = $row.find('td:nth-child(2)');
        const dateStr = $row.find('td:nth-child(3)').text().trim();
        const linkHref = titleCell.find('a').attr('href');

        if (!caseNumber || caseNumber === 'Case No.') return;

        const title = titleCell.text().trim();
        const parties = this.extractParties(title);

        judgments.push({
          caseNumber,
          title_zh: title,
          title_en: title,
          description_zh: `高等法院案件 ${caseNumber}`,
          description_en: `High Court Case ${caseNumber}`,
          court: 'High Court',
          judgmentDate: this.parseDate(dateStr),
          documentUrl: linkHref ? `${this.baseUrl}${linkHref}` : undefined,
          keywords: ['高等法院', 'High Court', ...parties]
        });

        this.stats.fetched++;
      });

      console.log(`    ✓ 獲取 ${judgments.length} 個高等法院案件`);
    } catch (error: any) {
      const isKnown = isKnownError(error.message);
      const logLevel = isKnown ? '⚠️' : '❌';
      console.error(`    ${logLevel} 抓取高等法院失敗: ${error.message}`);
      this.stats.errors++;
    }

    return judgments;
  }

  /**
   * Save judgment to database with AI classification
   */
  async saveJudgment(judgment: JudgmentData): Promise<'created' | 'updated' | 'skipped'> {
    try {
      // Generate unique ID based on source + case number
      const externalId = this.calculateHash(judgment.caseNumber);

      // Check if already exists
      const existing = await prisma.publicCase.findUnique({
        where: {
          source_externalId: {
            source: CaseSource.HK_JUDICIARY,
            externalId
          }
        }
      });

      // Use AI to classify if not already classified
      let aiClassification;
      if (!existing || !existing.category) {
        try {
          console.log(`    🤖 AI 分類: ${judgment.title_zh.substring(0, 50)}...`);
          aiClassification = await classifyCase(
            judgment.title_zh,
            judgment.description_zh
          );
        } catch (error) {
          console.warn(`    ⚠️  AI 分類失敗，使用預設值`);
          aiClassification = null;
        }
      }

      if (existing) {
        // Update existing record
        await prisma.publicCase.update({
          where: { id: existing.id },
          data: {
            title_zh: judgment.title_zh,
            title_en: judgment.title_en,
            description_zh: judgment.description_zh,
            description_en: judgment.description_en,
            court: judgment.court,
            judge: judgment.judge || existing.judge,
            judgmentDate: judgment.judgmentDate || existing.judgmentDate,
            sourceUrl: judgment.documentUrl || existing.sourceUrl,
            category: aiClassification?.category || existing.category,
            keywords: [...new Set([...judgment.keywords, ...(aiClassification?.keywords || [])])],
            updatedAt: new Date()
          }
        });

        this.stats.updated++;
        return 'updated';
      } else {
        // Create new record
        await prisma.publicCase.create({
          data: {
            source: CaseSource.HK_JUDICIARY,
            externalId,
            caseNumber: judgment.caseNumber,
            title_zh: judgment.title_zh,
            title_en: judgment.title_en,
            description_zh: judgment.description_zh,
            description_en: judgment.description_en,
            category: aiClassification?.category,
            court: judgment.court,
            judge: aiClassification?.judge || judgment.judge,
            judgmentDate: judgment.judgmentDate,
            sourceUrl: judgment.documentUrl,
            keywords: [...new Set([...judgment.keywords, ...(aiClassification?.keywords || [])])],
            tags: [],
            crawledAt: new Date()
          }
        });

        this.stats.created++;
        return 'created';
      }
    } catch (error: any) {
      const isKnown = isKnownError(error.message);
      const logLevel = isKnown ? '⚠️' : '❌';
      console.error(`    ${logLevel} 保存案件失敗 (${judgment.caseNumber}): ${error.message}`);
      this.stats.errors++;
      return 'skipped';
    }
  }

  /**
   * Main crawl function
   */
  async crawl(): Promise<number> {
    console.log('\n📜 開始抓取香港司法機構案件...');
    console.log('=' .repeat(70));

    try {
      // Reset stats
      this.stats = { fetched: 0, created: 0, updated: 0, skipped: 0, errors: 0 };

      // Scrape different courts
      const allJudgments = [
        ...(await this.scrapeCourtOfAppeal()),
        ...(await this.scrapeHighCourt()),
        // Add more courts as needed:
        // ...(await this.scrapeDistrictCourt()),
        // ...(await this.scrapeCourtOfFirstInstance()),
      ];

      if (allJudgments.length === 0) {
        console.log('\n  ⚠️  未發現任何新判決');
        return 0;
      }

      console.log(`\n  📊 共獲取 ${allJudgments.length} 個判決，開始儲存...\n`);

      // Save judgments with rate limiting
      for (let i = 0; i < allJudgments.length; i++) {
        const judgment = allJudgments[i];
        console.log(`  [${i + 1}/${allJudgments.length}] ${judgment.caseNumber}`);
        
        const result = await this.saveJudgment(judgment);
        
        if (result === 'created') {
          console.log(`    ✓ 已新增`);
        } else if (result === 'updated') {
          console.log(`    ✓ 已更新`);
        } else {
          console.log(`    ⊘ 略過`);
          this.stats.skipped++;
        }

        // Rate limiting between saves (500ms for AI classification)
        if (i < allJudgments.length - 1) {
          await this.delay(500);
        }
      }

      // Print summary
      console.log('\n' + '='.repeat(70));
      console.log('📊 爬蟲統計:');
      console.log(`   獲取: ${this.stats.fetched} 個案件`);
      console.log(`   新增: ${this.stats.created} 個`);
      console.log(`   更新: ${this.stats.updated} 個`);
      console.log(`   略過: ${this.stats.skipped} 個`);
      console.log(`   錯誤: ${this.stats.errors} 個`);
      console.log('=' .repeat(70));

      return this.stats.created + this.stats.updated;

    } catch (error: any) {
      console.error(`\n❌ 爬蟲執行失敗: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Main export function
 */
export async function trackJudiciaryCases(): Promise<number> {
  const crawler = new HKJudiciaryCrawler();
  return await crawler.crawl();
}

// Run if called directly
if (require.main === module) {
  trackJudiciaryCases()
    .then((count) => {
      console.log(`\n✨ 司法機構爬蟲完成: ${count} 個案件已處理`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 司法機構爬蟲失敗:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
