# HK Legal Case Agency 工程師任務分解與實現指南

## 專案目標

將 HK-Legal-Case-Agency 的核心功能完整整合到 Looper HQ monorepo，提供香港法律案件的公開搜尋、自動追蹤和資料聚合服務。

## 任務分解

### 第一階段：資料庫架構 (2-3 小時)

#### Task 1.1: 擴展 Prisma Schema

**檔案**: `packages/database/prisma/schema.prisma`

**新增模型**:

```prisma
// Public Case from external sources
model PublicCase {
  id          String      @id @default(cuid())
  
  // Source identification
  source      CaseSource
  externalId  String      // External source case ID
  sourceUrl   String?     // Source URL
  
  // Case information
  caseNumber  String?     // e.g., HCAL 123/2024
  title       String
  description String?     @db.Text
  category    String?     // Case category
  court       String?     // Court name
  
  // Parties
  parties     Json?       // { plaintiff: [], defendant: [] }
  
  // Judge and judgment
  judge       String?
  judgmentDate DateTime?
  judgment    String?     @db.Text
  
  // Keywords and tags
  keywords    String[]
  tags        String[]
  
  // News source additional fields
  publishedAt DateTime?
  author      String?
  
  // Metadata
  crawledAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  @@unique([source, externalId])
  @@index([source, crawledAt])
  @@index([caseNumber])
  @@index([keywords])
  @@index([publishedAt])
  @@map("public_cases")
}

// RSS Source configuration
model RssSource {
  id              String   @id @default(cuid())
  
  // Source info
  name            String
  source          CaseSource
  url             String
  
  // Status management
  isActive        Boolean  @default(true)
  status          RssSourceStatus @default(ACTIVE)
  lastError       String?  @db.Text
  lastFetchAt     DateTime?
  
  // Fetch strategy
  fetchInterval   Int      @default(3600)  // seconds
  maxRetries      Int      @default(3)
  retryDelay      Int      @default(300)   // seconds
  
  // Filter rules
  keywords        String[]
  excludeKeywords String[]
  
  // Metadata
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("rss_sources")
}

enum CaseSource {
  HK_JUDICIARY
  APPLE_DAILY_RSS
  SCMP_RSS
  RTHK_RSS
  HKLII
}

enum RssSourceStatus {
  ACTIVE
  INACTIVE
  ERROR
  DEPRECATED
}
```

**執行步驟**:

```bash
# 1. 編輯 schema.prisma
# 2. 格式化 schema
pnpm --filter=@looper-hq/database prisma format

# 3. 生成 migration
pnpm --filter=@looper-hq/database prisma migrate dev --name add_public_case_models

# 4. 生成 Prisma Client
pnpm --filter=@looper-hq/database prisma generate

# 5. 推送到資料庫
pnpm db:push
```

**驗證**:
- [ ] Schema 無語法錯誤
- [ ] Migration 成功執行
- [ ] Prisma Client 成功生成
- [ ] 資料庫中存在 `public_cases` 和 `rss_sources` 表
- [ ] Unique constraint 正確設置

#### Task 1.2: 建立 Seed Data

**檔案**: `packages/database/prisma/seed.ts`

**新增 RSS Source 種子資料**:

```typescript
const rssSources = [
  {
    name: 'South China Morning Post - Legal',
    source: 'SCMP_RSS',
    url: 'https://www.scmp.com/rss/2/feed',
    isActive: true,
    status: 'ACTIVE',
    keywords: [
      'court', 'law', 'legal', 'judge', 'lawsuit',
      '法庭', '法院', '法律', '法官', '訴訟'
    ],
    excludeKeywords: ['sports', 'entertainment']
  },
  {
    name: 'RTHK News',
    source: 'RTHK_RSS',
    url: 'https://rthk.hk/rss/news.xml',
    isActive: true,
    status: 'ACTIVE',
    keywords: ['法庭', '法院', '律師', '檢控', '判決'],
    excludeKeywords: ['體育', '娛樂']
  },
  {
    name: 'Apple Daily (Archived)',
    source: 'APPLE_DAILY_RSS',
    url: 'https://hk.appledaily.com/rss/...',
    isActive: false,
    status: 'DEPRECATED',
    lastError: 'Publication ceased on 2021-06-24',
    keywords: [],
    excludeKeywords: []
  }
];

// In main seed function:
for (const source of rssSources) {
  await prisma.rssSource.upsert({
    where: { 
      source: source.source 
    },
    update: source,
    create: source
  });
}
```

**執行**:
```bash
pnpm db:seed
```

---

### 第二階段：後端服務層 (4-6 小時)

#### Task 2.1: RSS Parser Service

**檔案**: `apps/web/lib/services/rss-parser.ts`

**功能**:
- 獲取並解析 RSS feed
- 錯誤處理與重試
- 超時控制
- User agent 設定

**依賴安裝**:
```bash
cd apps/web
pnpm add rss-parser axios
pnpm add -D @types/rss-parser
```

**實現範例**:

```typescript
import Parser from 'rss-parser';
import axios from 'axios';

interface RssFeedItem {
  title: string;
  link: string;
  pubDate: string;
  content?: string;
  contentSnippet?: string;
  creator?: string;
}

export class RssParserService {
  private parser: Parser;
  private timeout = 30000; // 30 seconds
  
  constructor() {
    this.parser = new Parser({
      timeout: this.timeout,
      headers: {
        'User-Agent': 'Looper-HQ/1.0'
      }
    });
  }
  
  async fetchFeed(url: string): Promise<RssFeedItem[]> {
    try {
      const feed = await this.parser.parseURL(url);
      return feed.items.map(item => ({
        title: item.title || '',
        link: item.link || '',
        pubDate: item.pubDate || new Date().toISOString(),
        content: item.content || item.contentSnippet,
        contentSnippet: item.contentSnippet,
        creator: item.creator
      }));
    } catch (error) {
      throw new Error(`Failed to fetch RSS feed: ${error.message}`);
    }
  }
  
  async fetchWithRetry(
    url: string, 
    maxRetries: number = 3,
    retryDelay: number = 300
  ): Promise<RssFeedItem[]> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.fetchFeed(url);
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries - 1) {
          const delay = retryDelay * Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
}
```

#### Task 2.2: Keyword Filter Service

**檔案**: `apps/web/lib/services/keyword-filter.ts`

**功能**:
- 關鍵字匹配
- 排除關鍵字過濾
- 多語言支援
- 大小寫不敏感

```typescript
export class KeywordFilterService {
  /**
   * Check if text contains any of the keywords
   */
  containsKeyword(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => 
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
    return items.filter(item => {
      const text = `${item.title} ${item.contentSnippet || ''}`;
      
      // Must contain at least one keyword
      if (!this.containsKeyword(text, keywords)) {
        return false;
      }
      
      // Must not contain any exclude keyword
      if (excludeKeywords.length > 0 && 
          this.containsKeyword(text, excludeKeywords)) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Extract keywords from text
   */
  extractKeywords(text: string, dictionary: string[]): string[] {
    const lowerText = text.toLowerCase();
    return dictionary.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
  }
}
```

#### Task 2.3: Data Source Adapter Pattern

**檔案**: `apps/web/lib/services/data-sources/base-adapter.ts`

**抽象介面**:

```typescript
import { PublicCase, CaseSource } from '@looper-hq/database';

export interface SearchParams {
  query?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface FetchResult {
  cases: Partial<PublicCase>[];
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
  abstract parse(raw: any): Partial<PublicCase>;
  
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
```

**HK Judiciary Adapter**:

**檔案**: `apps/web/lib/services/data-sources/hk-judiciary-adapter.ts`

```typescript
import { BaseDataSourceAdapter, SearchParams, FetchResult } from './base-adapter';
import { CaseSource } from '@looper-hq/database';

export class HkJudiciaryAdapter extends BaseDataSourceAdapter {
  source: CaseSource = 'HK_JUDICIARY';
  
  async fetch(params: SearchParams): Promise<FetchResult> {
    // TODO: Implement actual HK Judiciary API/scraping
    // For now, return mock data
    return {
      cases: [],
      total: 0
    };
  }
  
  parse(raw: any) {
    return {
      source: this.source,
      externalId: raw.id,
      caseNumber: raw.caseNumber,
      title: raw.title,
      description: raw.description,
      court: raw.court,
      judge: raw.judge,
      judgmentDate: raw.judgmentDate ? new Date(raw.judgmentDate) : null,
      keywords: raw.keywords || [],
      sourceUrl: raw.url
    };
  }
}
```

**RSS News Adapter**:

**檔案**: `apps/web/lib/services/data-sources/rss-news-adapter.ts`

```typescript
import { BaseDataSourceAdapter, SearchParams, FetchResult } from './base-adapter';
import { RssParserService } from '../rss-parser';
import { KeywordFilterService } from '../keyword-filter';

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
    const items = await this.rssParser.fetchFeed(this.feedUrl);
    const filtered = this.keywordFilter.filterItems(
      items,
      this.keywords,
      this.excludeKeywords
    );
    
    const cases = filtered.map(item => this.parse(item));
    
    return {
      cases,
      total: cases.length
    };
  }
  
  parse(item: any) {
    const extractedKeywords = this.keywordFilter.extractKeywords(
      `${item.title} ${item.contentSnippet}`,
      this.keywords
    );
    
    return {
      source: this.source,
      externalId: item.link, // Use URL as unique ID
      title: item.title,
      description: item.contentSnippet || item.content,
      publishedAt: new Date(item.pubDate),
      author: item.creator,
      keywords: extractedKeywords,
      sourceUrl: item.link
    };
  }
}
```

---

### 第三階段：API 端點 (3-4 小時)

#### Task 3.1: Public Cases Search API

**檔案**: `apps/web/app/api/public-cases/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().optional(),
  source: z.enum(['HK_JUDICIARY', 'SCMP_RSS', 'RTHK_RSS', 'APPLE_DAILY_RSS', 'HKLII']).optional(),
  category: z.string().optional(),
  court: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = searchSchema.parse(Object.fromEntries(searchParams));
    
    const { query, source, category, court, dateFrom, dateTo, page, limit } = params;
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { keywords: { has: query } }
      ];
    }
    
    if (source) {
      where.source = source;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (court) {
      where.court = { contains: court, mode: 'insensitive' };
    }
    
    if (dateFrom || dateTo) {
      where.crawledAt = {};
      if (dateFrom) where.crawledAt.gte = new Date(dateFrom);
      if (dateTo) where.crawledAt.lte = new Date(dateTo);
    }
    
    // Fetch data
    const [cases, total] = await Promise.all([
      prisma.publicCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { crawledAt: 'desc' }
      }),
      prisma.publicCase.count({ where })
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        cases,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Public cases search error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Task 3.2: Manual Tracking Trigger API

**檔案**: `apps/web/app/api/admin/track-cases/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { trackAllSources } from '@/lib/services/case-tracker';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await requireAuth();
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { sources, dateFrom } = body;
    
    // Run tracking
    const result = await trackAllSources({
      sources: sources || ['HK_JUDICIARY', 'SCMP_RSS', 'RTHK_RSS'],
      dateFrom: dateFrom ? new Date(dateFrom) : undefined
    });
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Manual tracking error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

### 第四階段：爬蟲腳本 (4-5 小時)

#### Task 4.1: RSS News Crawler

**檔案**: `scripts/crawlers/rss-news-crawler.ts`

```typescript
import { PrismaClient } from '@looper-hq/database';
import { RssNewsAdapter } from '../../apps/web/lib/services/data-sources/rss-news-adapter';

const prisma = new PrismaClient();

export async function trackRssNews(): Promise<number> {
  let totalUpdated = 0;
  
  try {
    // Load active RSS sources
    const sources = await prisma.rssSource.findMany({
      where: {
        isActive: true,
        status: { in: ['ACTIVE', 'ERROR'] }
      }
    });
    
    console.log(`📰 Found ${sources.length} RSS sources to track`);
    
    for (const source of sources) {
      try {
        console.log(`Processing ${source.name}...`);
        
        const adapter = new RssNewsAdapter(
          source.source,
          source.url,
          source.keywords,
          source.excludeKeywords
        );
        
        const result = await adapter.fetch({});
        
        // Upsert each case
        for (const caseData of result.cases) {
          await prisma.publicCase.upsert({
            where: {
              source_externalId: {
                source: caseData.source!,
                externalId: caseData.externalId!
              }
            },
            update: {
              ...caseData,
              updatedAt: new Date()
            },
            create: {
              ...caseData as any,
              crawledAt: new Date()
            }
          });
          totalUpdated++;
        }
        
        // Update source status
        await prisma.rssSource.update({
          where: { id: source.id },
          data: {
            status: 'ACTIVE',
            lastFetchAt: new Date(),
            lastError: null
          }
        });
        
        console.log(`✅ ${source.name}: ${result.cases.length} articles`);
      } catch (error) {
        console.error(`❌ ${source.name} failed:`, error.message);
        
        // Update error status
        await prisma.rssSource.update({
          where: { id: source.id },
          data: {
            status: 'ERROR',
            lastError: error.message
          }
        });
      }
    }
    
    return totalUpdated;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  trackRssNews()
    .then(count => {
      console.log(`✨ RSS tracking completed: ${count} articles processed`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ RSS tracking failed:', error);
      process.exit(1);
    });
}
```

#### Task 4.2: HK Judiciary Crawler

**檔案**: `scripts/crawlers/hk-judiciary-crawler.ts`

```typescript
import { PrismaClient } from '@looper-hq/database';

const prisma = new PrismaClient();

export async function trackJudiciaryCases(): Promise<number> {
  // TODO: Implement HK Judiciary scraping
  // This is a placeholder for future implementation
  console.log('📜 HK Judiciary tracking not yet implemented');
  return 0;
}

if (require.main === module) {
  trackJudiciaryCases()
    .then(count => {
      console.log(`✨ Judiciary tracking completed: ${count} cases`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Judiciary tracking failed:', error);
      process.exit(1);
    });
}
```

#### Task 4.3: Unified Tracker

**檔案**: `scripts/crawlers/unified-tracker.ts`

```typescript
import { trackJudiciaryCases } from './hk-judiciary-crawler';
import { trackRssNews } from './rss-news-crawler';

async function main() {
  console.log('🚀 Starting daily case tracking...\n');
  
  const stats = {
    judiciary: 0,
    rss: 0,
    errors: []
  };
  
  try {
    // 1. Track HK Judiciary
    console.log('📜 Tracking HK Judiciary cases...');
    stats.judiciary = await trackJudiciaryCases();
    console.log(`✅ Judiciary: ${stats.judiciary} cases\n`);
  } catch (error) {
    console.error('❌ Judiciary tracking failed:', error);
    stats.errors.push(`Judiciary: ${error.message}`);
  }
  
  try {
    // 2. Track RSS News
    console.log('📰 Tracking RSS news...');
    stats.rss = await trackRssNews();
    console.log(`✅ RSS: ${stats.rss} articles\n`);
  } catch (error) {
    console.error('❌ RSS tracking failed:', error);
    stats.errors.push(`RSS: ${error.message}`);
  }
  
  // Summary
  console.log('📊 Tracking Summary:');
  console.log(`   Judiciary: ${stats.judiciary} cases`);
  console.log(`   RSS: ${stats.rss} articles`);
  console.log(`   Total: ${stats.judiciary + stats.rss} items`);
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors occurred:`);
    stats.errors.forEach(err => console.log(`   - ${err}`));
    process.exit(1);
  }
  
  console.log('\n✨ Daily tracking completed successfully!');
  process.exit(0);
}

main();
```

**添加到 package.json**:

```json
{
  "scripts": {
    "crawler:all": "tsx scripts/crawlers/unified-tracker.ts",
    "crawler:judiciary": "tsx scripts/crawlers/hk-judiciary-crawler.ts",
    "crawler:rss": "tsx scripts/crawlers/rss-news-crawler.ts"
  }
}
```

---

### 第五階段：GitHub Actions 自動化 (1-2 小時)

#### Task 5.1: Daily Tracking Workflow

**檔案**: `.github/workflows/daily-case-tracking.yml`

```yaml
name: Daily Case Tracking

on:
  schedule:
    # Daily at 2:00 AM HKT (18:00 UTC previous day)
    - cron: '0 18 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  track-cases:
    name: Track Legal Cases
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Generate Prisma Client
        run: pnpm --filter=@looper-hq/database prisma generate
      
      - name: Run Unified Tracker
        run: pnpm run crawler:all
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NODE_ENV: production
      
      - name: Create issue on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            const date = new Date().toISOString().split('T')[0];
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `[Crawler] Daily Case Tracking Failed - ${date}`,
              body: `The daily case tracking job has failed.\n\nWorkflow Run: ${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`,
              labels: ['bug', 'crawler', 'automated']
            });
```

---

### 第六階段：前端 UI (4-6 小時)

#### Task 6.1: Public Search Page

**檔案**: `apps/web/app/(dashboard)/public-search/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicCase } from '@looper-hq/database';

export default function PublicSearchPage() {
  const searchParams = useSearchParams();
  const [cases, setCases] = useState<PublicCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    source: searchParams.get('source') || '',
    category: searchParams.get('category') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || ''
  });
  
  const handleSearch = async (page = 1) => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        ...filters,
        page: page.toString(),
        limit: '20'
      });
      
      const response = await fetch(`/api/public-cases?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setCases(data.data.cases);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">公開案件搜尋</h1>
      
      {/* Search Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="搜尋關鍵字..."
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            className="border rounded px-4 py-2"
          />
          
          <select
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            className="border rounded px-4 py-2"
          >
            <option value="">所有來源</option>
            <option value="HK_JUDICIARY">香港司法機構</option>
            <option value="SCMP_RSS">南華早報</option>
            <option value="RTHK_RSS">香港電台</option>
          </select>
          
          <button
            onClick={() => handleSearch(1)}
            disabled={loading}
            className="bg-blue-600 text-white rounded px-6 py-2 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '搜尋中...' : '搜尋'}
          </button>
        </div>
      </div>
      
      {/* Results */}
      <div className="space-y-4">
        {cases.map((case_) => (
          <div key={case_.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold">{case_.title}</h3>
              <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded">
                {case_.source}
              </span>
            </div>
            
            {case_.caseNumber && (
              <p className="text-gray-600 mb-2">案件編號: {case_.caseNumber}</p>
            )}
            
            {case_.description && (
              <p className="text-gray-700 mb-4">{case_.description}</p>
            )}
            
            <div className="flex flex-wrap gap-2 mb-4">
              {case_.keywords.map((keyword, idx) => (
                <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {keyword}
                </span>
              ))}
            </div>
            
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{new Date(case_.crawledAt).toLocaleDateString('zh-HK')}</span>
              {case_.sourceUrl && (
                <a href={case_.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  查看來源
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => handleSearch(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            上一頁
          </button>
          
          <span className="px-4 py-2">
            {pagination.page} / {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handleSearch(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### 第七階段：測試與文件 (2-3 小時)

#### Task 7.1: 手動測試清單

- [ ] 資料庫 migration 成功
- [ ] Seed data 正確插入
- [ ] RSS parser 可正常獲取 feed
- [ ] Keyword filter 正確過濾
- [ ] API endpoint 回傳正確格式
- [ ] Upsert 邏輯避免重複
- [ ] 錯誤處理與重試機制
- [ ] 前端搜尋頁面可正常使用
- [ ] GitHub Actions 可手動觸發
- [ ] 爬蟲腳本可本地執行

#### Task 7.2: 更新文件

**更新**: `README.md`

**更新**: `.env.example`

```env
# ... existing vars ...

# Public Case Tracking
CRAWLER_ENABLED=true
CRAWLER_SCHEDULE="0 18 * * *"
RSS_TIMEOUT=30000
RSS_MAX_RETRIES=3
RSS_USER_AGENT="Looper-HQ/1.0"
```

**新增**: `docs/PUBLIC_CASE_TRACKING.md`

包含:
- 功能說明
- 設定步驟
- 手動執行方式
- 疑難排解

---

## 時間估算總結

| 階段 | 任務 | 預估時間 |
|------|------|----------|
| 1 | 資料庫架構 | 2-3 小時 |
| 2 | 後端服務層 | 4-6 小時 |
| 3 | API 端點 | 3-4 小時 |
| 4 | 爬蟲腳本 | 4-5 小時 |
| 5 | GitHub Actions | 1-2 小時 |
| 6 | 前端 UI | 4-6 小時 |
| 7 | 測試與文件 | 2-3 小時 |
| **總計** | | **20-29 小時** |

## 成功標準

- ✅ PublicCase 和 RssSource 模型已建立
- ✅ Unique constraint 和索引正確設置
- ✅ RSS parser 可成功獲取並解析 feed
- ✅ 關鍵字過濾正常運作
- ✅ API endpoint 回傳符合規格的 JSON
- ✅ 爬蟲可本地手動執行
- ✅ GitHub Actions 每日自動執行
- ✅ 前端搜尋頁面可正常使用
- ✅ 文件完整更新

## 風險與挑戰

1. **RSS Feed 可用性**
   - 新聞網站可能更改 RSS URL
   - 解決: 監控錯誤，手動更新配置

2. **關鍵字過濾準確度**
   - 可能過濾掉相關文章或包含不相關文章
   - 解決: 持續調整關鍵字列表

3. **HK Judiciary 資料獲取**
   - 官方網站無 public API
   - 可能需要 web scraping (注意法律問題)
   - 解決: 研究 robots.txt，遵守爬蟲規範

4. **資料量增長**
   - 長期累積資料量可能影響查詢效能
   - 解決: 適當的索引、分頁、資料歸檔策略

5. **GitHub Actions 限制**
   - 免費額度可能不足
   - 解決: 優化執行時間，考慮自架 CI/CD
