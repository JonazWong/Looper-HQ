import { CaseSource, CourtLevel } from '@looper-hq/database';

export interface SearchParams {
  query?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface PublicCaseData {
  source: CaseSource;
  externalId: string;
  sourceUrl?: string;
  caseNumber?: string;
  title: string;
  description?: string;
  category?: string;
  court?: string;
  parties?: any;
  judge?: string;
  judgmentDate?: Date;
  judgment?: string;
  keywords: string[];
  tags: string[];
  publishedAt?: Date;
  author?: string;
  neutralCitation?: string;
  courtLevel?: CourtLevel;
  fullText?: string;
}

export interface FetchResult {
  cases: PublicCaseData[];
  total: number;
}

export abstract class BaseDataSourceAdapter {
  abstract source: CaseSource;

  /**
   * Fetch cases from the data source
   */
  abstract fetch(params: SearchParams): Promise<FetchResult>;

  /**
   * Parse raw data to PublicCase format
   */
  abstract parse(raw: any): PublicCaseData;

  /**
   * Validate if the adapter is operational
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.fetch({ limit: 1 });
      return true;
    } catch {
      return false;
    }
  }
}
