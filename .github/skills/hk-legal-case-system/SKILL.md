---
name: hk-legal-case-system
description: '香港法案記錄與文件搜尋器開發維護工作流程。Use for: 添加/修改爬蟲 (crawler)、AI 分類系統 (classification)、公開案件搜尋功能、資料庫 schema 變更、診斷爬蟲失敗、批量處理案件、擴展法律資料來源 (RSS, HKLII, Judiciary)。Keywords: PublicCase, crawler, AI classification, legal case search, 香港司法機構, HKLII, RSS feeds.'
argument-hint: '指定任務類型: add-crawler|fix-classifier|diagnose|batch-process|extend-schema'
---

# 香港法案記錄與文件搜尋器系統

## 系統概述

Looper HQ 的法案搜尋系統整合以下核心功能：

1. **多源爬蟲系統** - 自動追蹤香港法律案例與新聞
2. **AI 智能分類** - OpenAI/OpenRouter 自動分析案例元數據
3. **公開案件搜尋** - 雙語搜尋介面與分面過濾
4. **資料庫管理** - PostgreSQL + Prisma 結構化儲存

## 何時使用此技能

**添加新功能**:
- 添加新的法律資料來源（新爬蟲）
- 擴展 AI 分類邏輯（新案例類別、新法院）
- 修改搜尋過濾器或排序邏輯

**維護與診斷**:
- 爬蟲執行失敗或資料缺失
- AI 分類錯誤或信心度過低
- 資料庫查詢效能問題

**批量操作**:
- 重新分類歷史案件
- 匯出/匯入案件資料
- 清理重複或無效記錄

## 核心組件架構

### 1. 爬蟲系統 (`scripts/crawlers/`)

**統一協調器**: `unified-tracker.ts`
- 每日自動執行（2am HKT via GitHub Actions）
- 建立 `CrawlerJobRun` 追蹤記錄
- 按順序執行各爬蟲並聚合統計

**已啟用爬蟲**:
- `rss-news-crawler.ts` - SCMP, RTHK, HK01 等新聞源
- `hklii-crawler.ts` - 香港法律資訊研究所判例
- `hk-judiciary-dcl-crawler.ts` - 司法機構每日審訊清單

**已停用**:
- `hk-judiciary-crawler.ts` - 舊司法機構爬蟲（來源封鎖，等待新 API）

**執行命令**:
```bash
pnpm crawler:all          # 執行所有爬蟲
pnpm crawler:rss          # 僅 RSS 新聞
pnpm crawler:hklii        # 僅 HKLII 判例
pnpm crawler:judiciary-dcl # 僅每日審訊清單
pnpm crawler:health       # 健康檢查
```

### 2. AI 分類系統 (`apps/web/lib/services/`)

**核心服務**: `ai-classifier.ts`
- 函數: `classifyCase(title, content)`
- 回傳: `ClassificationResult` (category, court, judge, parties, etc.)
- Prompt: 結構化 JSON 模式，支援 22 種案例類別

**API 路由**:
- `/api/classify` - 單一案例分類
- `/api/ai/classify` - 批量分類
- `/api/ai/summarize` - 案例摘要生成
- `/api/ai/pipeline` - 完整 AI 處理管道

**前端組件**:
- `AIClassifyButton` - 單鍵分類按鈕
- `/admin/ai-classify` - 批量分類管理介面

**環境配置**:
```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.1
OPENAI_BASE_URL=https://openrouter.ai/api/v1  # 可選
```

### 3. 資料庫 Schema (`packages/database/prisma/schema.prisma`)

**PublicCase 模型** (核心實體):
```prisma
model PublicCase {
  id              Int       @id @default(autoincrement())
  title_zh        String?   # 標題（繁中）
  title_en        String?   # 標題（英文）
  summary_zh      String?   # 摘要（繁中）
  summary_en      String?   # 摘要（英文）
  category        CaseCategory?
  court           String?
  judge           String?
  parties         Json?     # 當事人陣列
  judgmentDate    DateTime?
  source          String    # RSS, HKLII, JUDICIARY_DCL
  externalId      String    # 來源系統 ID
  url             String?
  aiClassified    Boolean   @default(false)
  aiConfidence    Float?
  citations       Int       @default(0)
  createdAt       DateTime  @default(now())
  
  @@unique([source, externalId])
  @@index([category])
  @@index([judgmentDate])
  @@index([aiClassified])
}
```

**相關模型**:
- `CrawlerJobRun` - 爬蟲執行記錄
- `RssSource` - RSS 來源配置
- `CrawlerHealthCheck` - 健康檢查記錄

### 4. 公開案件搜尋 (`apps/web/app/[locale]/public-cases/`)

**頁面路由**:
- `/public-cases` - 列表頁（支援分頁、過濾、排序）
- `/public-cases/[id]` - 詳情頁
- `/courts/[court]` - 按法院過濾
- `/judges/[name]` - 按法官過濾

**API 端點**:
- `GET /api/public-cases` - 列表查詢（支援 facets）
- `GET /api/public-cases/facets` - 分面統計（法院、類別、來源）
- `GET /api/public-cases/[id]` - 單一案例
- `GET /api/public-cases/[id]/related` - 相關案例推薦

## 常見工作流程

### 工作流程 1: 添加新爬蟲

**場景**: 添加「香港政府新聞公報」作為新資料來源

**步驟**:

1. **創建爬蟲檔案** `scripts/crawlers/hkgovnews-crawler.ts`
   ```typescript
   import { PrismaClient } from '@looper-hq/database';
   
   const prisma = new PrismaClient();
   
   export async function trackHkGovNews(): Promise<number> {
     // 1. 抓取資料（HTML parsing 或 API 呼叫）
     const items = await fetchHkGovNewsItems();
     
     // 2. 去重與插入
     let count = 0;
     for (const item of items) {
       const created = await prisma.publicCase.upsert({
         where: {
           source_externalId: {
             source: 'HKGOVNEWS',
             externalId: item.id,
           },
         },
         create: {
           title_zh: item.title,
           summary_zh: item.summary,
           url: item.url,
           source: 'HKGOVNEWS',
           externalId: item.id,
           publishedAt: item.date,
         },
         update: {}, // 不更新已存在記錄
       });
       if (created) count++;
     }
     
     return count;
   }
   ```

2. **註冊到統一協調器** `scripts/crawlers/unified-tracker.ts`
   - Import: `import { trackHkGovNews } from './hkgovnews-crawler';`
   - 在 `main()` 添加執行區塊:
     ```typescript
     try {
       console.log('\n📰 Tracking HK Gov News...');
       stats.hkgovnews = await trackHkGovNews();
       console.log(`✅ HK Gov News: ${stats.hkgovnews} items`);
     } catch (error: any) {
       stats.errors.push(`HKGovNews: ${error.message}`);
     }
     ```

3. **添加執行腳本** `package.json`
   ```json
   {
     "scripts": {
       "crawler:hkgovnews": "tsx scripts/crawlers/hkgovnews-crawler.ts"
     }
   }
   ```

4. **測試執行**
   ```bash
   pnpm crawler:hkgovnews  # 單獨測試
   pnpm crawler:all        # 完整測試
   ```

5. **檢查資料**
   ```bash
   pnpm --filter=@looper-hq/database prisma studio
   # 瀏覽 PublicCase 表確認新記錄
   ```

### 工作流程 2: 修復 AI 分類問題

**場景**: AI 經常將「司法覆核」誤分類為「行政法」

**診斷步驟**:

1. **檢查錯誤案例**
   ```sql
   -- 在 Prisma Studio 或直接查詢
   SELECT id, title_zh, category, aiConfidence
   FROM "PublicCase"
   WHERE category = 'ADMINISTRATIVE'
   AND (title_zh LIKE '%司法覆核%' OR summary_zh LIKE '%judicial review%')
   ORDER BY createdAt DESC LIMIT 20;
   ```

2. **分析 Prompt** - 打開 `apps/web/lib/services/ai-classifier.ts`
   - 檢查分類說明是否清晰
   - 確認 `JUDICIAL_REVIEW` 類別與 `ADMINISTRATIVE` 的區別

3. **改進 Prompt** - 修改分類提示
   ```typescript
   const prompt = `...
   分類說明：
   - ADMINISTRATIVE: 行政法（政府決定、行政措施審查）
   - JUDICIAL_REVIEW: 司法覆核（挑戰公權力決定的合法性）
      關鍵詞：judicial review, 司法覆核, certiorari, mandamus
   ...`;
   ```

4. **測試改進** - 創建測試案例
   ```bash
   # 建立測試檔案 scripts/test-classification.ts
   import { classifyCase } from '../apps/web/lib/services/ai-classifier';
   
   const testCases = [
     {
       title: '申請人訴食物環境衞生署司法覆核案',
       content: '申請人申請司法覆核，要求撤銷食環署的決定...',
     },
   ];
   
   for (const tc of testCases) {
     const result = await classifyCase(tc.title, tc.content);
     console.log(`分類: ${result.category}, 信心: ${result.confidence}`);
   }
   ```

5. **批量重新分類** - 使用 Admin 介面
   - 訪問 `/admin/ai-classify`
   - 選擇「未分類」或「低信心」案例
   - 點擊「批量分類」

### 工作流程 3: 診斷爬蟲失敗

**場景**: 昨日自動爬蟲執行失敗，RSS 來源無新資料

**診斷步驟**:

1. **檢查 GitHub Actions 日誌**
   - 前往 `.github/workflows/crawler.yml`
   - 查看最近執行記錄
   - 複製錯誤訊息

2. **查看資料庫記錄**
   ```bash
   pnpm --filter=@looper-hq/database prisma studio
   # 瀏覽 CrawlerJobRun 表
   # 檢查 status, errorLog, stats 欄位
   ```

3. **本地重現問題**
   ```bash
   # 設置環境變數
   cp .env.example .env
   # 編輯 .env 確保 DATABASE_URL 正確
   
   # 執行單一爬蟲
   pnpm crawler:rss
   
   # 啟用除錯模式
   DEBUG=crawler:* pnpm crawler:rss
   ```

4. **檢查來源可用性**
   ```typescript
   // scripts/crawlers/test-source.ts
   import Parser from 'rss-parser';
   
   const parser = new Parser({ timeout: 30000 });
   const feed = await parser.parseURL('https://example.com/rss');
   console.log(`標題: ${feed.title}`);
   console.log(`項目數: ${feed.items.length}`);
   ```

5. **修復問題**
   - **超時**: 增加 `RSS_TIMEOUT` 環境變數
   - **格式變更**: 更新 `rss-news-crawler.ts` 的解析邏輯
   - **來源失效**: 在 `RssSource` 表標記為 `active: false`

6. **驗證修復**
   ```bash
   pnpm crawler:health  # 執行健康檢查
   pnpm crawler:all     # 完整執行
   ```

### 工作流程 4: 擴展資料庫 Schema

**場景**: 需要為 PublicCase 添加「引用判例」關聯

**步驟**:

1. **修改 Prisma Schema** `packages/database/prisma/schema.prisma`
   ```prisma
   model PublicCase {
     // ... 現有欄位
     
     // 新增：此案件引用哪些判例
     citedCases   PublicCaseCitation[] @relation("CitingCase")
     // 新增：哪些案件引用此判例
     citedByCases PublicCaseCitation[] @relation("CitedCase")
   }
   
   model PublicCaseCitation {
     id            Int         @id @default(autoincrement())
     citingCaseId  Int         # 引用者
     citedCaseId   Int         # 被引用者
     context       String?     # 引用上下文
     createdAt     DateTime    @default(now())
     
     citingCase    PublicCase  @relation("CitingCase", fields: [citingCaseId], references: [id], onDelete: Cascade)
     citedCase     PublicCase  @relation("CitedCase", fields: [citedCaseId], references: [id], onDelete: Cascade)
     
     @@unique([citingCaseId, citedCaseId])
   }
   ```

2. **生成新 Prisma Client**
   ```bash
   pnpm --filter=@looper-hq/database prisma generate
   ```

3. **同步資料庫** (開發環境)
   ```bash
   pnpm db:push
   ```
   
   或 **創建 Migration** (生產環境)
   ```bash
   pnpm db:migrate
   # 輸入遷移名稱: add_case_citations
   ```

4. **更新 Zod Schema** `apps/web/lib/validations/schemas.ts`
   ```typescript
   export const publicCaseCitationSchema = z.object({
     citingCaseId: z.number().int().positive(),
     citedCaseId: z.number().int().positive(),
     context: z.string().optional(),
   });
   ```

5. **更新 API 路由** `apps/web/app/api/public-cases/[id]/citations/route.ts`
   ```typescript
   export async function GET(
     request: NextRequest,
     { params }: { params: { id: string } }
   ) {
     const caseId = parseInt(params.id);
     
     const citations = await prisma.publicCaseCitation.findMany({
       where: { citingCaseId: caseId },
       include: {
         citedCase: {
           select: { id: true, title_zh: true, title_en: true },
         },
       },
     });
     
     return successResponse(citations);
   }
   ```

6. **更新前端組件** - 在案件詳情頁顯示引用列表
   ```typescript
   // apps/web/app/[locale]/public-cases/[id]/page.tsx
   const citations = await fetch(`/api/public-cases/${id}/citations`);
   
   return (
     <section>
       <h3>引用判例</h3>
       <ul>
         {citations.map(c => (
           <li key={c.id}>
             <Link href={`/public-cases/${c.citedCase.id}`}>
               {c.citedCase.title_zh}
             </Link>
           </li>
         ))}
       </ul>
     </section>
   );
   ```

7. **驗證變更**
   ```bash
   pnpm build               # 類型檢查
   pnpm --filter=@looper-hq/web type-check
   pnpm dev                 # 本地測試
   ```

### 工作流程 5: 批量處理歷史案件

**場景**: 為過去 6 個月未分類的案件執行 AI 分類

**步驟**:

1. **查詢未分類案件**
   ```typescript
   // scripts/batch-classify.ts
   import { PrismaClient } from '@looper-hq/database';
   import { classifyCase } from '../apps/web/lib/services/ai-classifier';
   
   const prisma = new PrismaClient();
   
   const sixMonthsAgo = new Date();
   sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
   
   const unclassifiedCases = await prisma.publicCase.findMany({
     where: {
       aiClassified: false,
       createdAt: { gte: sixMonthsAgo },
       OR: [
         { title_zh: { not: null } },
         { title_en: { not: null } },
       ],
     },
     take: 100, // 批次處理 100 筆
   });
   ```

2. **批量分類並更新**
   ```typescript
   let successCount = 0;
   let failCount = 0;
   
   for (const caseItem of unclassifiedCases) {
     try {
       const title = caseItem.title_zh || caseItem.title_en || '';
       const content = caseItem.summary_zh || caseItem.summary_en || '';
       
       if (!title || !content) continue;
       
       const result = await classifyCase(title, content);
       
       await prisma.publicCase.update({
         where: { id: caseItem.id },
         data: {
           category: result.category,
           court: result.court,
           judge: result.judge,
           parties: result.parties,
           judgmentDate: result.judgmentDate,
           aiClassified: true,
           aiConfidence: result.confidence,
         },
       });
       
       successCount++;
       console.log(`✅ [${successCount}/${unclassifiedCases.length}] ${title.substring(0, 50)}`);
       
       // 避免 API 限速
       await new Promise(resolve => setTimeout(resolve, 1000));
       
     } catch (error) {
       failCount++;
       console.error(`❌ 失敗: ${caseItem.id}`, error.message);
     }
   }
   
   console.log(`\n完成: ${successCount} 成功, ${failCount} 失敗`);
   ```

3. **執行腳本**
   ```bash
   tsx scripts/batch-classify.ts
   ```

4. **監控成本** (OpenRouter Dashboard)
   - 登入 https://openrouter.ai/
   - 檢查 API 用量與費用
   - 調整批次大小或模型選擇

## 最佳實踐

### 爬蟲開發

1. **冪等性** - 使用 `upsert` 與 unique constraint 防止重複
   ```typescript
   await prisma.publicCase.upsert({
     where: { source_externalId: { source, externalId } },
     create: { ... },
     update: {}, // 不覆蓋已存在資料
   });
   ```

2. **錯誤處理** - 個別來源失敗不應中斷整體流程
   ```typescript
   try {
     stats.rss = await trackRssNews();
   } catch (error) {
     console.error('RSS failed:', error);
     stats.errors.push(`RSS: ${error.message}`);
     // 繼續執行其他爬蟲
   }
   ```

3. **速率限制** - 避免被封鎖
   ```typescript
   const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
   
   for (const item of items) {
     await processItem(item);
     await delay(1000); // 每秒 1 請求
   }
   ```

4. **日誌記錄** - 使用結構化日誌
   ```typescript
   console.log(JSON.stringify({
     timestamp: new Date().toISOString(),
     crawler: 'RSS',
     action: 'FETCH',
     source: feedUrl,
     itemCount: items.length,
   }));
   ```

### AI 分類

1. **Prompt Engineering** - 提供明確範例與指引
   ```typescript
   const prompt = `
   範例：
   輸入: "甲訴乙侵佔土地案"
   輸出: { "category": "PROPERTY", "parties": ["甲", "乙"] }
   
   現在分析：
   ${title}
   ${content}
   `;
   ```

2. **信心閾值** - 低信心結果標記為需人工審查
   ```typescript
   if (result.confidence < 0.7) {
     await prisma.publicCase.update({
       where: { id },
       data: { needsReview: true },
     });
   }
   ```

3. **成本控制** - 使用較小模型或限制輸入長度
   ```typescript
   const content = fullContent.substring(0, 2000); // 限制 2000 字元
   ```

### 資料庫操作

1. **索引優化** - 為常用查詢條件建立索引
   ```prisma
   @@index([category, judgmentDate])  // 複合索引
   @@index([aiClassified])            // 批量處理篩選
   ```

2. **批量操作** - 使用 transaction 確保一致性
   ```typescript
   await prisma.$transaction([
     prisma.publicCase.deleteMany({ where: { source: 'OLD_SOURCE' } }),
     prisma.rssSource.update({ where: { id }, data: { active: false } }),
   ]);
   ```

3. **軟刪除** - 保留歷史記錄
   ```prisma
   model PublicCase {
     deletedAt DateTime?
     @@index([deletedAt])
   }
   ```

## 故障排除

### 問題: 爬蟲執行但無資料插入

**檢查清單**:
- [ ] 資料庫連線正常？(`pnpm db:push` 成功)
- [ ] Unique constraint 衝突？(檢查 `source_externalId` 是否重複)
- [ ] 來源網站結構變更？(手動訪問 URL 驗證)
- [ ] 解析邏輯錯誤？(添加 `console.log` 檢查中間結果)

**除錯技巧**:
```typescript
// 在爬蟲檔案添加除錯輸出
console.log('Fetched items:', JSON.stringify(items, null, 2));

// 檢查 Prisma 操作結果
const result = await prisma.publicCase.create({ data });
console.log('Created case:', result.id);
```

### 問題: AI 分類返回錯誤格式

**常見原因**:
- OpenAI API key 無效或過期
- JSON 模式解析失敗
- Token 限制超出

**解決方法**:
```typescript
// 添加詳細錯誤處理
try {
  const result = JSON.parse(cleaned);
} catch (error) {
  console.error('Raw response:', responseContent);
  console.error('Cleaned:', cleaned);
  throw new Error(`JSON parse failed: ${error.message}`);
}
```

### 問題: Prisma Client 未找到

**解決步驟**:
```bash
# 1. 重新生成 Prisma Client
pnpm --filter=@looper-hq/database prisma generate

# 2. 清理並重新安裝
rm -rf node_modules packages/database/node_modules
pnpm install --frozen-lockfile

# 3. 驗證 import 路徑
# 正確: import { PrismaClient } from '@looper-hq/database';
# 錯誤: import { PrismaClient } from '@prisma/client';
```

### 問題: 資料庫 Schema 不同步

**症狀**: `prisma.publicCase.findMany()` 報錯欄位不存在

**解決**:
```bash
# 開發環境：直接推送到資料庫
pnpm db:push

# 生產環境：使用 migration
pnpm db:migrate
git add packages/database/prisma/migrations
git commit -m "feat(db): add citations table"
```

## 相關資源

### 文件
- [AI_CLASSIFICATION_GUIDE.md](../../../apps/web/docs/AI_CLASSIFICATION_GUIDE.md) - AI 分類詳細指南
- [CRAWLER_SETUP.md](../../../docs/CRAWLER_SETUP.md) - 爬蟲設置與配置
- [PROJECT_CONFIGURATION_STATUS.md](../../../PROJECT_CONFIGURATION_STATUS.md) - 系統配置狀態

### 配置檔案
- [.env.example](../../../.env.example) - 環境變數範本
- [crawler-config.ts](../../../scripts/crawlers/crawler-config.ts) - 爬蟲全域配置
- [source-blacklist.ts](../../../scripts/crawlers/source-blacklist.ts) - 黑名單管理

### API 參考
- NextAuth 認證: `apps/web/lib/api/auth.ts`
- Response Helper: `apps/web/lib/api/response.ts`
- Error Handler: `apps/web/lib/api/errors.ts`

## 執行前檢查

在修改任何爬蟲或 AI 分類邏輯之前：

1. **備份資料庫**
   ```bash
   pg_dump looper_hq > backup_$(date +%Y%m%d).sql
   ```

2. **檢查環境變數**
   ```bash
   # 必需
   - DATABASE_URL
   - NEXTAUTH_SECRET
   
   # AI 功能必需
   - OPENAI_API_KEY
   
   # 爬蟲可選
   - CRAWLER_ENABLED=true
   - RSS_TIMEOUT=30000
   ```

3. **驗證依賴版本**
   ```bash
   node --version  # >= 18.0.0
   pnpm --version  # >= 8.0.0
   ```

4. **確保服務運行**
   ```bash
   pnpm docker:up  # PostgreSQL, Redis, Keycloak
   sleep 15        # 等待 DB 就緒
   ```

---

**提示**: 遇到問題時，先查看 `CrawlerJobRun` 和 GitHub Actions 日誌定位錯誤來源。大部分問題都是環境變數或網路連線導致的。
