/**
 * Looper-HQ 香港司法機構爬蟲適配器
 * 與 Looper-HQ 專案的爬蟲系統整合
 * 
 * 使用方法:
 * 1. 將此檔案複製到 services/crawlers/ 目錄
 * 2. 在 apps/legal-case-search 應用中導入使用
 */

import { prisma } from '@looper-hq/database';
import logger from '@looper-hq/utils/logger';
import axios from 'axios';
import { CheerioAPI, load } from 'cheerio';
import { parseISO } from 'date-fns';

interface CaseRecord {
  caseNumber: string;
  court: string;
  hearingDate: string;
  hearingTime?: string;
  room?: string;
  judge?: string;
  parties?: string;
  nature?: string;
  solicitors?: string;
  sourceUrl: string;
  externalId: string;
}

interface CrawlResult {
  court: string;
  casesFound: number;
  casesSaved: number;
  duration: number;
  status: 'success' | 'failed' | 'partial';
  error?: string;
}

/**
 * 香港司法機構爬蟲服務
 */
export class HKJudiciaryService {
  private baseUrl = 'https://e-services.judiciary.hk/dcl/index.jsp';
  
  private courtCodes = {
    'DC': '區域法院',
    'DCMC': '區域法院(聆案官聆訊案件表)',
    'HCA': '高等法院(上訴法庭)',
    'HCCFI': '高等法院(原訟法庭)',
    'HCMC': '高等法院(聆案官聆訊案件表)',
    'MC': '裁判法院',
    'EDD': '東區裁判法院',
    'KCC': '九龍城裁判法院',
    'KTN': '觀塘裁判法院',
    'WKL': '西九龍裁判法院',
    'ST': '沙田裁判法院',
    'FL': '粉嶺裁判法院',
    'TM': '屯門裁判法院',
    'FHC': '家事法庭',
    'LT': '土地審裁處',
    'LEC': '勞資審裁處',
    'SDCC': '小額錢債審裁處'
  };

  private requestTimeout = 15000;
  private maxRetries = 3;

  /**
   * 取得最新案件表日期
   */
  async getLatestDate(): Promise<string | null> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          lang: 'tc',
          mode: 'view',
          date: 'latest',
          court: 'DC'
        },
        timeout: this.requestTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });

      const $ = load(response.data);
      const dateInput = $('#dclDate');
      const dateValue = dateInput.attr('value');
      
      return dateValue || null;
    } catch (error) {
      logger.error('無法取得最新日期', { error });
      return null;
    }
  }

  /**
   * 爬取特定法院的案件表
   */
  async fetchCourtList(
    courtCode: string,
    date: string = 'latest'
  ): Promise<string | null> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await axios.get(this.baseUrl, {
          params: {
            lang: 'tc',
            mode: 'view',
            date,
            court: courtCode
          },
          timeout: this.requestTimeout,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          }
        });

        logger.info(`成功取得 ${this.courtCodes[courtCode as keyof typeof this.courtCodes] || courtCode}`);
        return response.data;
      } catch (error) {
        logger.warn(`第 ${attempt + 1} 次嘗試失敗 (${courtCode})`, { error });
        
        if (attempt < this.maxRetries - 1) {
          // 指數退避
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    logger.error(`無法取得 ${this.courtCodes[courtCode as keyof typeof this.courtCodes] || courtCode}`);
    return null;
  }

  /**
   * 解析案件表 HTML
   */
  private parseCourtList(
    html: string,
    courtCode: string,
    date: string
  ): CaseRecord[] {
    const cases: CaseRecord[] = [];

    try {
      const $ = load(html);
      const courtName = this.courtCodes[courtCode as keyof typeof this.courtCodes] || courtCode;

      // 解析表格方法 1: 尋找 table 元素
      const tables = $('table');
      
      if (tables.length > 0) {
        tables.each((_, table) => {
          const $table = $(table);
          const rows = $table.find('tbody tr, tr');
          
          rows.each((rowIndex, row) => {
            if (rowIndex === 0) return; // 跳過標題行
            
            const cells = $(row).find('td');
            if (cells.length >= 3) {
              const caseRecord = this.extractCaseFromCells($, cells, courtCode, courtName, date);
              if (caseRecord) {
                cases.push(caseRecord);
              }
            }
          });
        });
      }

      // 解析方法 2: 尋找特定 class 的 div
      if (cases.length === 0) {
        const caseContainers = $('.case-row, .case-item, .list-item');
        caseContainers.each((_, container) => {
          const $container = $(container);
          const caseRecord = this.extractCaseFromContainer($container, courtCode, courtName, date);
          if (caseRecord) {
            cases.push(caseRecord);
          }
        });
      }

      logger.info(`解析 ${courtName} 找到 ${cases.length} 個案件`);
      return cases;
    } catch (error) {
      logger.error(`解析案件表失敗 (${courtCode})`, { error });
      return [];
    }
  }

  /**
   * 從表格單元格提取案件資訊
   */
  private extractCaseFromCells(
    $: CheerioAPI,
    cells: any,
    courtCode: string,
    courtName: string,
    date: string
  ): CaseRecord | null {
    try {
      const caseNumber = $(cells[0]).text().trim();
      
      if (!caseNumber) {
        return null;
      }

      return {
        caseNumber,
        court: courtName,
        hearingDate: date,
        hearingTime: $(cells[2])?.text().trim() || undefined,
        parties: $(cells[1])?.text().trim() || undefined,
        sourceUrl: `${this.baseUrl}?lang=tc&mode=view&date=${date}&court=${courtCode}`,
        externalId: `${courtCode}-${caseNumber}-${date}`
      };
    } catch (error) {
      logger.debug('提取案件資訊失敗', { error });
      return null;
    }
  }

  /**
   * 從 div 容器提取案件資訊
   */
  private extractCaseFromContainer(
    $container: any,
    courtCode: string,
    courtName: string,
    date: string
  ): CaseRecord | null {
    try {
      const text = $container.text().trim();
      if (!text) {
        return null;
      }

      return {
        caseNumber: text.substring(0, 50),
        court: courtName,
        hearingDate: date,
        parties: text.substring(50, 150) || undefined,
        sourceUrl: `${this.baseUrl}?lang=tc&mode=view&date=${date}&court=${courtCode}`,
        externalId: `${courtCode}-${text.substring(0, 30)}-${date}`
      };
    } catch (error) {
      logger.debug('提取容器內容失敗', { error });
      return null;
    }
  }

  /**
   * 爬取所有法院的案件表
   */
  async crawlAllCourts(date?: string): Promise<CrawlResult[]> {
    const results: CrawlResult[] = [];
    const targetDate = date || (await this.getLatestDate()) || new Date().toISOString().split('T')[0];

    logger.info(`開始爬取所有法院審訊案件表 (日期: ${targetDate})`);

    for (const [courtCode, courtName] of Object.entries(this.courtCodes)) {
      const startTime = Date.now();

      try {
        const html = await this.fetchCourtList(courtCode, targetDate);

        if (html) {
          const cases = this.parseCourtList(html, courtCode, targetDate);
          let savedCount = 0;

          // 儲存案件到資料庫
          for (const caseRecord of cases) {
            try {
              await prisma.publicCase.upsert({
                where: {
                  source_externalId: {
                    source: 'HK_JUDICIARY',
                    externalId: caseRecord.externalId
                  }
                },
                update: {
                  title: caseRecord.caseNumber,
                  description: `法院: ${caseRecord.court}\n聆訊日期: ${caseRecord.hearingDate}\n訴訟各方: ${caseRecord.parties || ''}`,
                  category: 'court_hearing',
                  source: 'HK_JUDICIARY',
                  keywords: [caseRecord.court, caseRecord.caseNumber],
                  courtInfo: {
                    create: {
                      caseNumber: caseRecord.caseNumber,
                      court: caseRecord.court,
                      hearingDate: caseRecord.hearingDate,
                      hearingTime: caseRecord.hearingTime,
                      room: caseRecord.room,
                      judge: caseRecord.judge,
                      parties: caseRecord.parties,
                      nature: caseRecord.nature,
                      solicitors: caseRecord.solicitors
                    }
                  }
                },
                create: {
                  title: caseRecord.caseNumber,
                  description: `法院: ${caseRecord.court}\n聆訊日期: ${caseRecord.hearingDate}\n訴訟各方: ${caseRecord.parties || ''}`,
                  category: 'court_hearing',
                  source: 'HK_JUDICIARY',
                  externalId: caseRecord.externalId,
                  sourceUrl: caseRecord.sourceUrl,
                  keywords: [caseRecord.court, caseRecord.caseNumber],
                  courtInfo: {
                    create: {
                      caseNumber: caseRecord.caseNumber,
                      court: caseRecord.court,
                      hearingDate: caseRecord.hearingDate,
                      hearingTime: caseRecord.hearingTime,
                      room: caseRecord.room,
                      judge: caseRecord.judge,
                      parties: caseRecord.parties,
                      nature: caseRecord.nature,
                      solicitors: caseRecord.solicitors
                    }
                  }
                }
              });
              savedCount++;
            } catch (error) {
              logger.warn(`儲存案件失敗: ${caseRecord.caseNumber}`, { error });
            }
          }

          const duration = Date.now() - startTime;
          results.push({
            court: courtName,
            casesFound: cases.length,
            casesSaved: savedCount,
            duration: duration / 1000,
            status: savedCount === cases.length ? 'success' : 'partial'
          });

          logger.info(`${courtName}: 找到 ${cases.length} 個案件，儲存 ${savedCount} 個`);
        } else {
          const duration = Date.now() - startTime;
          results.push({
            court: courtName,
            casesFound: 0,
            casesSaved: 0,
            duration: duration / 1000,
            status: 'failed',
            error: 'HTML 取得失敗'
          });
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        results.push({
          court: courtName,
          casesFound: 0,
          casesSaved: 0,
          duration: duration / 1000,
          status: 'failed',
          error: String(error)
        });
        logger.error(`${courtName} 爬取失敗`, { error });
      }

      // 禮貌延遲
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }
}

/**
 * Looper-HQ 爬蟲整合函數
 */
export async function crawlHKJudiciary(): Promise<void> {
  const service = new HKJudiciaryService();
  const results = await service.crawlAllCourts();

  const totalFound = results.reduce((sum, r) => sum + r.casesFound, 0);
  const totalSaved = results.reduce((sum, r) => sum + r.casesSaved, 0);

  logger.info(`爬蟲完成: 共找到 ${totalFound} 個案件，儲存 ${totalSaved} 個`);

  // 輸出結果摘要
  console.log('\n=== 香港司法機構案件爬蟲結果 ===');
  results.forEach(result => {
    console.log(
      `${result.court}: ${result.casesSaved}/${result.casesFound} ` +
      `(${result.status}, ${result.duration.toFixed(2)}s)`
    );
  });
}

export default HKJudiciaryService;
