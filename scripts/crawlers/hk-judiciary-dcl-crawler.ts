/**
 * HK Judiciary Daily Cause List (DCL) Crawler
 * 香港司法機構每日審訊時間表爬蟲
 *
 * Target: https://e-services.judiciary.hk/dcl/index.jsp
 *
 * Features:
 * - Scrapes daily cause lists from 17 HK courts / tribunals
 * - Covers District Court, High Court, Magistrates' Courts, Family Court, etc.
 * - Bilingual content support (中英雙語)
 * - MD5-based externalId deduplication
 * - Polite rate-limiting and retry logic
 * - Saves to PublicCase table using CaseSource.HK_JUDICIARY
 */

import { PrismaClient, CaseSource } from '../../packages/database';
import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { defaultCrawlerConfig, getRandomUserAgent, isKnownError } from './crawler-config';

const prisma = new PrismaClient();

// ─── Court configuration ────────────────────────────────────────────────────

interface CourtConfig {
  code: string;       // URL query-param value for `court`
  name_zh: string;
  name_en: string;
  keywords: string[];
}

const DCL_COURTS: CourtConfig[] = [
  { code: 'DC',    name_zh: '區域法院',                   name_en: 'District Court',                          keywords: ['區域法院', 'DC', 'District Court'] },
  { code: 'DCMC',  name_zh: '區域法院(聆案官聆訊)',        name_en: 'District Court (Master Hearings)',         keywords: ['區域法院', 'DCMC', 'Master'] },
  { code: 'HCA',   name_zh: '高等法院(上訴法庭)',           name_en: 'Court of Appeal',                         keywords: ['上訴法庭', 'HCA', 'Court of Appeal'] },
  { code: 'HCCFI', name_zh: '高等法院(原訟法庭)',           name_en: 'Court of First Instance',                 keywords: ['原訟法庭', 'HCCFI', 'Court of First Instance'] },
  { code: 'HCMC',  name_zh: '高等法院(聆案官聆訊)',         name_en: 'High Court (Master Hearings)',             keywords: ['高等法院', 'HCMC', 'Master'] },
  { code: 'MC',    name_zh: '裁判法院',                   name_en: "Magistrates' Court",                       keywords: ['裁判法院', 'MC', "Magistrates' Court"] },
  { code: 'EDD',   name_zh: '東區裁判法院',               name_en: 'Eastern District Magistracy',              keywords: ['東區', 'EDD', 'Eastern District'] },
  { code: 'KCC',   name_zh: '九龍城裁判法院',             name_en: 'Kowloon City Magistracy',                  keywords: ['九龍城', 'KCC', 'Kowloon City'] },
  { code: 'KTN',   name_zh: '觀塘裁判法院',               name_en: 'Kwun Tong Magistracy',                     keywords: ['觀塘', 'KTN', 'Kwun Tong'] },
  { code: 'WKL',   name_zh: '西九龍裁判法院',             name_en: 'West Kowloon Magistracy',                  keywords: ['西九龍', 'WKL', 'West Kowloon'] },
  { code: 'ST',    name_zh: '沙田裁判法院',               name_en: 'Sha Tin Magistracy',                       keywords: ['沙田', 'ST', 'Sha Tin'] },
  { code: 'FL',    name_zh: '粉嶺裁判法院',               name_en: 'Fanling Magistracy',                       keywords: ['粉嶺', 'FL', 'Fanling'] },
  { code: 'TM',    name_zh: '屯門裁判法院',               name_en: 'Tuen Mun Magistracy',                      keywords: ['屯門', 'TM', 'Tuen Mun'] },
  { code: 'FHC',   name_zh: '家事法庭',                   name_en: 'Family Court',                             keywords: ['家事法庭', 'FHC', 'Family Court'] },
  { code: 'LT',    name_zh: '土地審裁處',                 name_en: 'Lands Tribunal',                           keywords: ['土地審裁處', 'LT', 'Lands Tribunal'] },
  { code: 'LEC',   name_zh: '勞資審裁處',                 name_en: 'Labour Tribunal',                          keywords: ['勞資審裁處', 'LEC', 'Labour Tribunal'] },
  { code: 'SDCC',  name_zh: '小額錢債審裁處',             name_en: 'Small Claims Tribunal',                    keywords: ['小額錢債', 'SDCC', 'Small Claims'] },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface HearingRecord {
  caseNumber: string;
  court_zh: string;
  court_en: string;
  courtCode: string;
  hearingDate: string;   // ISO date string YYYY-MM-DD
  hearingTime?: string;
  room?: string;
  judge?: string;
  parties?: string;
  nature?: string;
  solicitors?: string;
  sourceUrl: string;
}

// Truncation limits for div-based fallback extraction
const DIV_CASE_NUMBER_MAX_LENGTH = 50;
const DIV_PARTIES_TEXT_MAX_LENGTH = 200;

// ─── Crawler class ────────────────────────────────────────────────────────────

class JudiciaryDclCrawler {
  private readonly baseUrl = 'https://e-services.judiciary.hk/dcl/index.jsp';
  private client: AxiosInstance;
  private stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  constructor() {
    this.client = axios.create({
      timeout: defaultCrawlerConfig.timeoutMs,
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  private async delay(ms: number = defaultCrawlerConfig.rateLimitDelayMs): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Build the DCL page URL for a given court and date.
   */
  private buildUrl(courtCode: string, date: string): string {
    return `${this.baseUrl}?lang=tc&mode=view&date=${date}&court=${courtCode}`;
  }

  // ── Data fetching ─────────────────────────────────────────────────────────

  /**
   * Resolve "latest" hearing date from the DCL index page.
   * Falls back to today's date if the page cannot be reached.
   * 從 DCL 首頁取得最新審訊日期，失敗時回退至今天
   */
  async resolveLatestDate(): Promise<string> {
    try {
      const response = await this.client.get(this.baseUrl, {
        params: { lang: 'tc', mode: 'view', date: 'latest', court: 'DC' },
      });
      const $ = cheerio.load(response.data);
      // The page typically has a date input or displays the date in an element
      const dateInput = $('#dclDate').attr('value') || $('input[name="date"]').attr('value');
      if (dateInput && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
      }
      // Try to find a date in the page text (format: YYYY-MM-DD or DD/MM/YYYY)
      const bodyText = $('body').text();
      const isoMatch = bodyText.match(/(\d{4}-\d{2}-\d{2})/);
      if (isoMatch) return isoMatch[1];
      const dmyMatch = bodyText.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
    } catch (error: any) {
      if (!isKnownError(error.message)) {
        console.warn(`  ⚠️  無法取得最新日期: ${error.message}`);
      }
    }
    // Fallback: use today's date (Asia/Hong_Kong = UTC+8, no DST)
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }));
    return now.toISOString().split('T')[0];
  }

  /**
   * Fetch raw HTML for a specific court's cause list on a given date.
   * Implements retry with exponential backoff.
   * 取得指定法院審訊時間表 HTML，含指數退避重試
   */
  async fetchCourtPage(courtCode: string, date: string): Promise<string | null> {
    const url = this.buildUrl(courtCode, date);

    for (let attempt = 0; attempt < defaultCrawlerConfig.maxRetries; attempt++) {
      try {
        // Rotate User-Agent on each retry
        this.client.defaults.headers['User-Agent'] = getRandomUserAgent();
        const response = await this.client.get(url);
        return response.data as string;
      } catch (error: any) {
        const known = isKnownError(error.message);
        const label = known ? '⚠️' : '❌';
        if (attempt < defaultCrawlerConfig.maxRetries - 1) {
          const backoff = Math.pow(2, attempt) * 1000;
          console.warn(`  ${label} 第 ${attempt + 1} 次請求失敗 (${courtCode}): ${error.message} — 等待 ${backoff}ms`);
          await this.delay(backoff);
        } else {
          console.error(`  ${label} 取得 ${courtCode} 失敗 (${defaultCrawlerConfig.maxRetries} 次重試後放棄): ${error.message}`);
        }
      }
    }
    return null;
  }

  // ── HTML parsing ──────────────────────────────────────────────────────────

  /**
   * Parse hearing records from the DCL HTML response.
   * The DCL page uses a table-based layout.  We try two strategies:
   *   1. Standard <table> rows
   *   2. <div>-based row containers (fallback)
   * 從 HTML 解析聆訊記錄（表格優先，div 備用）
   */
  parseHearings(html: string, court: CourtConfig, date: string): HearingRecord[] {
    const records: HearingRecord[] = [];
    const $ = cheerio.load(html);
    const sourceUrl = this.buildUrl(court.code, date);

    // Strategy 1: table rows
    const tables = $('table');
    if (tables.length > 0) {
      tables.each((_, table) => {
        const rows = $(table).find('tr');
        rows.each((rowIndex, row) => {
          // Skip header rows (first row, or rows with <th> cells only)
          if (rowIndex === 0) return;
          const ths = $(row).find('th');
          if (ths.length > 0) return;

          const cells = $(row).find('td');
          if (cells.length < 2) return;

          const record = this.extractFromCells($, cells, court, date, sourceUrl);
          if (record) records.push(record);
        });
      });
    }

    // Strategy 2: div-based containers (fallback when no table rows found)
    if (records.length === 0) {
      const containers = $('.case-row, .cause-row, .list-item, .case-item');
      containers.each((_, el) => {
        const record = this.extractFromContainer($, $(el), court, date, sourceUrl);
        if (record) records.push(record);
      });
    }

    return records;
  }

  /**
   * Extract a HearingRecord from a set of <td> cells.
   * Column order assumed: caseNumber | parties | time | room | judge | nature | solicitors
   * (The DCL page may omit trailing columns — we handle missing columns gracefully.)
   */
  private extractFromCells(
    $: cheerio.CheerioAPI,
    cells: cheerio.Cheerio<any>,
    court: CourtConfig,
    date: string,
    sourceUrl: string,
  ): HearingRecord | null {
    try {
      const getText = (index: number): string => $(cells[index])?.text().trim() ?? '';

      const caseNumber = getText(0);
      if (!caseNumber) return null;

      return {
        caseNumber,
        court_zh: court.name_zh,
        court_en: court.name_en,
        courtCode: court.code,
        hearingDate: date,
        parties:     getText(1) || undefined,
        hearingTime: getText(2) || undefined,
        room:        getText(3) || undefined,
        judge:       getText(4) || undefined,
        nature:      getText(5) || undefined,
        solicitors:  getText(6) || undefined,
        sourceUrl,
      };
    } catch {
      return null;
    }
  }

  /**
   * Extract a HearingRecord from a div-based container element.
   */
  private extractFromContainer(
    $: cheerio.CheerioAPI,
    el: cheerio.Cheerio<any>,
    court: CourtConfig,
    date: string,
    sourceUrl: string,
  ): HearingRecord | null {
    try {
      const text = el.text().trim();
      if (!text) return null;

      const caseNumber = text.substring(0, DIV_CASE_NUMBER_MAX_LENGTH).trim();
      if (!caseNumber) return null;

      return {
        caseNumber,
        court_zh: court.name_zh,
        court_en: court.name_en,
        courtCode: court.code,
        hearingDate: date,
        parties: text.length > DIV_CASE_NUMBER_MAX_LENGTH ? text.substring(DIV_CASE_NUMBER_MAX_LENGTH, DIV_PARTIES_TEXT_MAX_LENGTH).trim() : undefined,
        sourceUrl,
      };
    } catch {
      return null;
    }
  }

  // ── Database persistence ──────────────────────────────────────────────────

  /**
   * Upsert a single hearing record into the PublicCase table.
   * externalId is an MD5 hash of court+caseNumber+date to prevent duplicates.
   * 將聆訊記錄 upsert 進 PublicCase 資料表
   */
  async saveHearing(record: HearingRecord): Promise<'created' | 'updated' | 'skipped'> {
    try {
      const hashSource = `${record.courtCode}-${record.caseNumber}-${record.hearingDate}`;
      const externalId = this.calculateHash(hashSource);

      const partiesText = record.parties ? `訴訟各方: ${record.parties}\n` : '';
      const timeText    = record.hearingTime ? `聆訊時間: ${record.hearingTime}\n` : '';
      const roomText    = record.room ? `法庭: ${record.room}\n` : '';
      const judgeText   = record.judge ? `法官: ${record.judge}\n` : '';

      const description_zh =
        `法院: ${record.court_zh}\n` +
        `聆訊日期: ${record.hearingDate}\n` +
        timeText + roomText + partiesText + judgeText;

      const description_en =
        `Court: ${record.court_en}\n` +
        `Hearing Date: ${record.hearingDate}\n` +
        (record.hearingTime ? `Time: ${record.hearingTime}\n` : '') +
        (record.room ? `Room: ${record.room}\n` : '') +
        (record.parties ? `Parties: ${record.parties}\n` : '') +
        (record.judge ? `Judge: ${record.judge}\n` : '');

      const keywords = [
        ...new Set([
          record.court_zh,
          record.court_en,
          record.caseNumber,
          record.hearingDate,
          ...(record.judge ? [record.judge] : []),
          ...(record.nature ? [record.nature] : []),
        ]),
      ];

      const existing = await prisma.publicCase.findUnique({
        where: { source_externalId: { source: CaseSource.HK_JUDICIARY, externalId } },
        select: { id: true },
      });

      if (existing) {
        await prisma.publicCase.update({
          where: { id: existing.id },
          data: {
            title_zh: `${record.court_zh} - ${record.caseNumber}`,
            title_en: `${record.court_en} - ${record.caseNumber}`,
            description_zh,
            description_en,
            court: record.court_zh,
            judge: record.judge || undefined,
            keywords,
            sourceUrl: record.sourceUrl,
            updatedAt: new Date(),
          },
        });
        this.stats.updated++;
        return 'updated';
      }

      await prisma.publicCase.create({
        data: {
          source: CaseSource.HK_JUDICIARY,
          externalId,
          caseNumber: record.caseNumber,
          title_zh: `${record.court_zh} - ${record.caseNumber}`,
          title_en: `${record.court_en} - ${record.caseNumber}`,
          description_zh,
          description_en,
          court: record.court_zh,
          judge: record.judge || undefined,
          sourceUrl: record.sourceUrl,
          keywords,
          tags: [],
          crawledAt: new Date(),
        },
      });
      this.stats.created++;
      return 'created';
    } catch (error: any) {
      const known = isKnownError(error.message);
      const label = known ? '⚠️' : '❌';
      console.error(`    ${label} 儲存案件失敗 (${record.caseNumber}): ${error.message}`);
      this.stats.errors++;
      this.stats.skipped++;
      return 'skipped';
    }
  }

  // ── Main crawl loop ───────────────────────────────────────────────────────

  /**
   * Crawl all configured courts for the specified (or latest) date.
   * Returns the total number of records created + updated.
   * 爬取所有配置法院的審訊時間表，返回新增+更新總數
   */
  async crawl(targetDate?: string): Promise<number> {
    const date = targetDate ?? await this.resolveLatestDate();
    console.log(`\n📅 審訊日期: ${date}`);
    console.log('='.repeat(70));

    for (const court of DCL_COURTS) {
      console.log(`\n🏛️  爬取 ${court.name_zh} (${court.code})...`);

      const html = await this.fetchCourtPage(court.code, date);
      if (!html) {
        console.warn(`  ⚠️  無法取得 ${court.name_zh} 的審訊時間表，跳過`);
        continue;
      }

      const records = this.parseHearings(html, court, date);
      console.log(`  📋 解析到 ${records.length} 筆聆訊記錄`);

      for (const record of records) {
        await this.saveHearing(record);
      }

      // Polite delay between court requests / 法院之間的禮貌延遲
      await this.delay(defaultCrawlerConfig.rateLimitDelayMs);
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 爬蟲統計:');
    console.log(`   新增: ${this.stats.created} 筆`);
    console.log(`   更新: ${this.stats.updated} 筆`);
    console.log(`   略過: ${this.stats.skipped} 筆`);
    console.log(`   錯誤: ${this.stats.errors} 筆`);
    console.log('='.repeat(70));

    return this.stats.created + this.stats.updated;
  }
}

// ─── Exported integration function ───────────────────────────────────────────

/**
 * Exported entry point for the unified-tracker.
 * Crawls today's (or latest available) cause lists and returns the count of
 * records that were created or updated.
 *
 * 匯出給 unified-tracker 調用的入口函數
 */
export async function trackJudiciaryDailyList(targetDate?: string): Promise<number> {
  const crawler = new JudiciaryDclCrawler();
  try {
    return await crawler.crawl(targetDate);
  } finally {
    await prisma.$disconnect();
  }
}

// ─── Standalone execution ─────────────────────────────────────────────────────

// Allow direct invocation: tsx scripts/crawlers/hk-judiciary-dcl-crawler.ts
if (require.main === module) {
  (async () => {
    console.log('🚀 HK 司法機構每日審訊時間表爬蟲啟動');
    console.log('='.repeat(70));
    try {
      const count = await trackJudiciaryDailyList();
      console.log(`\n✅ 完成: 共處理 ${count} 筆聆訊記錄`);
      process.exit(0);
    } catch (error: any) {
      console.error(`\n💥 爬蟲執行失敗: ${error.message}`);
      process.exit(1);
    }
  })();
}
