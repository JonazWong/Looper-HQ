# Looper HQ - RSS 新聞源問題診斷與修復方案

**診斷日期**: 2026-02-06  
**問題**: GitHub Actions 和本機都無法執行 RSS 爬蟲  
**錯誤**: `Status code 403` (Forbidden)

---

## 🔍 問題診斷

### 1. 當前狀態

**症狀**:
```
RSS fetch failed for MINGPAO_INS_RSS: Failed to fetch RSS feed: Status code 403
Retry 1/3 after 300s delay...
```

**來源配置** (packages/database/prisma/seed.ts):
- ✅ `MINGPAO_PNS_RSS` - **已禁用** (isActive: false)
- ❌ `MINGPAO_INS_RSS` - **啟用但 403 錯誤**
  - URL: `https://news.mingpao.com/rss/ins/s00001.xml`
  - 抓取間隔: 900 秒 (15 分鐘)

### 2. 根本原因

#### 原因 A: 明報反爬蟲機制升級 ⚠️

明報最近加強了反爬蟲措施：
  - ❌ 單純的 User-Agent 不足以繞過檢測
  - ❌ 可能需要 Referer 或 Cookies
  - ❌ RSS URL 可能已經改變或需要登入

#### 原因 B: RSS URL 已失效 🚨

與 HK-Legal-Case-Agency 專案相同的問題：
  - 2025 年後香港多個新聞網站調整了 RSS 策略
  - 部分 RSS 源已停止公開提供或變更 URL

#### 原因 C: 請求頻率過高

現有配置：
  - 每 15 分鐘抓取一次（900 秒）
  - GitHub Actions: 每 15 分鐘執行一次 (`*/15 * * * *`)
  - **可能觸發反爬蟲限制**

### 3. 當前 Headers 配置

```typescript
// apps/web/lib/services/rss-parser.ts
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  'Accept-Language': 'zh-HK,zh-TW;q=0.9,zh;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Referer': 'https://news.mingpao.com/', // ✓ 已有
}
```

**分析**: Headers 已經相當完善，但仍然 403

---

## 🔧 修復方案

### 方案 A: 更新 RSS 來源清單（推薦）✅

**停用失效來源，添加可用來源**

#### 1. 測試並更新明報 URL

```typescript
// 可能的替代 URL（需要測試）
const MingPaoAlternatives = [
  'https://news.mingpao.com/rss/ins/s00001.xml',  // 原 URL（403）
  'https://news.mingpao.com/rss/instant',         // 可能的新 URL
  'https://www.mingpao.com/rss/pns/s00002.xml',   // 不同域名
];
```

#### 2. 添加其他香港新聞源

```typescript
// 建議新增來源（基於 HK-Legal-Case-Agency 測試結果）
const NewRssSources = [
  {
    name: 'RTHK News - Local',
    source: 'RTHK_LOCAL_RSS',
    url: 'https://news.rthk.hk/rthk/ch/rss/local.htm',
    isActive: true,
    fetchInterval: 1800, // 30 分鐘
    // ⚠️ 注意：可能有 XML 解析問題
  },
  {
    name: 'HK01 - Hong Kong News',
    source: 'HK01_HK_RSS',
    url: 'https://www.hk01.com/rss/zone/2',
    isActive: false, // 需要先測試
    fetchInterval: 1800,
  },
  {
    name: 'SCMP - Hong Kong',
    source: 'SCMP_HK_RSS',
    url: 'https://www.scmp.com/rss/91/feed',
    isActive: false, // 英文來源
    fetchInterval: 3600,
  },
];
```

#### 3. 更新種子資料

```typescript
// packages/database/prisma/seed.ts
await prisma.rssSource.createMany({
  data: [
    // 停用明報（暫時）
    {
      name: 'Ming Pao Instant News - Legal',
      source: 'MINGPAO_INS_RSS',
      url: 'https://news.mingpao.com/rss/ins/s00001.xml',
      isActive: false, // 改為 false
      status: 'ERROR',  // 標記為錯誤
      lastError: 'HTTP 403 Forbidden - 2026-02-06',
      // ...其他配置
    },
    // 添加 RTHK
    {
      name: 'RTHK News - Local',
      source: 'RTHK_LOCAL_RSS',
      url: 'https://news.rthk.hk/rthk/ch/rss/local.htm',
      isActive: true,
      status: 'ACTIVE',
      fetchInterval: 1800, // 30 分鐘
      maxRetries: 3,
      retryDelay: 600, // 10 分鐘（增加重試延遲）
      keywords: [
        'court', 'law', 'legal', 'judge', 'lawsuit',
        '法庭', '法院', '法律', '法官', '訴訟',
        '律師', '檢控', '判決', '裁決', '司法',
      ],
      excludeKeywords: ['體育', '娛樂', '美食', '旅遊'],
    },
  ],
});
```

---

### 方案 B: 改進錯誤處理（立即實施）✅

#### 1. 降低重試延遲（避免阻塞）

```typescript
// scripts/crawlers/rss-news-crawler.ts (第 102 行)
// 當前: 300 秒（5 分鐘）
// 建議: 30 秒（避免長時間等待）

while (retryCount <= source.maxRetries && !sourceSuccess) {
  try {
    if (retryCount > 0) {
      // 改為漸進式延遲：30s → 60s → 120s
      const delay = Math.min(30 * Math.pow(2, retryCount - 1), 300);
      console.log(`  Retry ${retryCount}/${source.maxRetries} after ${delay}s delay...`);
      await sleep(delay * 1000);
    }
    // ...
```

#### 2. 失敗後繼續其他來源

```typescript
// 當前邏輯已經正確（失敗不會中斷）
// 但可以改進：記錄失敗並更新資料庫狀態

} catch (error) {
  lastError = error instanceof Error ? error.message : String(error);
  console.error(`  ✗ Error: ${lastError}`);
  retryCount++;
  
  // 達到最大重試次數後，更新狀態但繼續處理其他來源
  if (retryCount > source.maxRetries) {
    await prisma.rssSource.update({
      where: { id: source.id },
      data: {
        status: 'ERROR',
        lastError: lastError.slice(0, 500), // 限制長度
      },
    });
    console.error(`  ⚠️ Marking source as ERROR after ${source.maxRetries} retries`);
    break; // 跳出重試循環，處理下一個來源
  }
}
```

#### 3. 添加來源健康檢查

```typescript
// scripts/crawlers/health-check.ts (新文件)
import { PrismaClient } from '../../packages/database';

const prisma = new PrismaClient();

async function checkRssHealth() {
  const sources = await prisma.rssSource.findMany({
    where: { isActive: true },
  });
  
  console.log('🏥 RSS Source Health Check\n');
  
  for (const source of sources) {
    const lastFetchAgo = source.lastFetchAt 
      ? Math.floor((Date.now() - source.lastFetchAt.getTime()) / 60000)
      : null;
    
    const status = lastFetchAgo === null 
      ? '🔴 Never fetched'
      : lastFetchAgo > source.fetchInterval / 60 * 2
      ? '🟡 Stale'
      : '🟢 Healthy';
    
    console.log(`${status} ${source.name}`);
    console.log(`  Last fetch: ${lastFetchAgo ? `${lastFetchAgo}m ago` : 'Never'}`);
    console.log(`  Status: ${source.status}`);
    if (source.lastError) {
      console.log(`  Last error: ${source.lastError.slice(0, 100)}...`);
    }
    console.log('');
  }
}

checkRssHealth();
```

---

### 方案 C: 減少抓取頻率（避免封鎖）✅

#### 1. 調整 GitHub Actions 排程

```yaml
# .github/workflows/rss-crawler.yml
on:
  schedule:
    # 從每 15 分鐘改為每小時
    - cron: '0 * * * *'  # 每小時 0 分執行
  workflow_dispatch:
```

#### 2. 增加來源抓取間隔

```typescript
// packages/database/prisma/seed.ts
{
  fetchInterval: 3600, // 從 900 秒（15 分鐘）改為 3600 秒（1 小時）
  retryDelay: 600,     // 從 300 秒（5 分鐘）改為 600 秒（10 分鐘）
}
```

---

### 方案 D: 實作備用抓取策略（進階）

#### 1. 使用 Puppeteer 無頭瀏覽器

```typescript
// apps/web/lib/services/browser-rss-fetcher.ts
import puppeteer from 'puppeteer';

export async function fetchRssWithBrowser(url: string): Promise<string> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // 模擬真實瀏覽器行為
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)...');
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const content = await page.content();
  await browser.close();
  
  return content;
}
```

**注意**: 需要安裝 `puppeteer` 和 `chromium`，成本較高

#### 2. 使用代理或 VPN

```typescript
// 如果是地區限制
const proxyConfig = {
  host: 'proxy.hk',
  port: 8080,
};

this.parser = new Parser({
  requestOptions: {
    proxy: `http://${proxyConfig.host}:${proxyConfig.port}`,
  },
});
```

---

## 🚀 立即執行步驟

### Step 1: 停用失效來源

```bash
cd "d:\Looper HQ Platform\Looper-HQ"

# 連接資料庫
pnpm --filter=@looper-hq/database studio

# 在 Prisma Studio 中：
# 1. 打開 RssSource 表
# 2. 找到 MINGPAO_INS_RSS
# 3. 設置 isActive = false, status = "ERROR"
# 4. 保存
```

### Step 2: 添加新來源（手動測試）

建立測試腳本：

```typescript
// scripts/test-rss-sources.ts
import Parser from 'rss-parser';

const testSources = [
  'https://news.rthk.hk/rthk/ch/rss/local.htm',
  'https://www.hk01.com/rss/zone/2',
  'https://www.scmp.com/rss/91/feed',
];

async function testRss() {
  const parser = new Parser({ timeout: 10000 });
  
  for (const url of testSources) {
    try {
      console.log(`Testing: ${url}`);
      const feed = await parser.parseURL(url);
      console.log(`✅ Success! Found ${feed.items.length} items\n`);
    } catch (error) {
      console.error(`❌ Failed: ${error.message}\n`);
    }
  }
}

testRss();
```

執行測試：

```bash
pnpm tsx scripts/test-rss-sources.ts
```

### Step 3: 更新種子資料

根據測試結果，更新 `packages/database/prisma/seed.ts`：

```typescript
// 停用明報
{
  source: 'MINGPAO_INS_RSS',
  isActive: false,
  status: 'ERROR',
}

// 添加可用來源
{
  name: 'RTHK News - Local',
  source: 'RTHK_LOCAL_RSS',
  url: 'https://news.rthk.hk/rthk/ch/rss/local.htm',
  isActive: true, // 如果測試通過
}
```

重新播種：

```bash
pnpm db:push
pnpm db:seed
```

### Step 4: 測試爬蟲

```bash
# 本機測試
pnpm run crawler:rss

# 應該看到：
# 📰 Found 1 RSS sources in database
# 🚀 Processing 1 sources...
# ✅ Successfully fetched 20 items from RTHK_LOCAL_RSS
```

### Step 5: 更新 GitHub Actions 排程

```yaml
# .github/workflows/rss-crawler.yml
on:
  schedule:
    - cron: '0 * * * *'  # 每小時一次（降低頻率）
```

### Step 6: 監控執行

```bash
# 檢查 GitHub Actions 執行狀態
# https://github.com/JonazWong/Looper-HQ/actions

# 或建立健康檢查腳本
pnpm tsx scripts/crawlers/health-check.ts
```

---

## 📊 預期結果

### 修復前
- ❌ 0/1 來源成功
- ❌ 每次執行等待 15+ 分鐘（重試延遲）
- ❌ GitHub Actions 失敗
- ❌ 沒有案件數據

### 修復後
- ✅ 1-2 個可用來源
- ✅ 失敗快速跳過（30-120 秒重試）
- ✅ GitHub Actions 穩定執行
- ✅ 每小時抓取 10-30 筆法律新聞

---

## 🔗 相關文件

- HK-Legal-Case-Agency RSS 狀態報告: `docs/RSS_IMPLEMENTATION_STATUS.md`
- GitHub Issue 回應: `docs/GITHUB_ISSUE_RSS_TRACKING_RESPONSE.md`
- Looper HQ Copilot Instructions: `.github/copilot-instructions.md`

---

**建立日期**: 2026-02-06  
**狀態**: 待執行  
**優先級**: 🔴 高（影響核心功能）
