# RSS Crawler GitHub Actions 設置指南

## 📋 概述

自動化RSS新聞爬蟲，每15分鐘檢查一次，但會根據每個RSS源的`fetchInterval`智能決定是否抓取。

## ⏰ 排程頻率

| RSS源 | fetchInterval | 實際抓取頻率 |
|-------|--------------|-------------|
| 明報即時版 (INS) | 900秒 (15分鐘) | 每15分鐘 |
| 明報日報版 (PNS) | 7200秒 (2小時) | 每2小時 |

**Workflow執行頻率**: 每15分鐘  
**智能機制**: Crawler會檢查`lastFetchAt + fetchInterval`，只抓取需要更新的源

---

## 🔧 設置步驟

### 1️⃣ 配置GitHub Secrets

前往 GitHub Repository：
```
Settings → Secrets and variables → Actions → New repository secret
```

**必須添加的Secret**:

#### `DATABASE_URL`
```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
```

**示例**（生產環境）:
```
postgresql://looper_user:YOUR_PASSWORD@db.looper-hq.com:5432/looper_hq?schema=public
```

**本地測試**:
```
postgresql://postgres:Ken202318@localhost:5432/looper_hq?schema=public
```

---

### 2️⃣ 驗證Workflow文件

檢查 [`.github/workflows/rss-crawler.yml`](../../.github/workflows/rss-crawler.yml) 是否正確：

```yaml
on:
  schedule:
    - cron: '*/15 * * * *'  # 每15分鐘執行
  workflow_dispatch:        # 允許手動觸發
```

---

### 3️⃣ 測試Workflow

#### 手動測試
1. 前往 **Actions** 標籤
2. 選擇 **RSS News Crawler**
3. 點擊 **Run workflow** → 選擇 `main` branch → **Run**
4. 等待執行完成（通常1-3分鐘）
5. 點擊workflow run查看日誌

#### 預期輸出
```
📰 Found 2 RSS sources in database
  ✓ Ming Pao Instant News - Legal: Last fetched 16m ago (interval: 15m)
  ⏭ Ming Pao Daily News - Hong Kong News: Skip - next fetch in 104m

🚀 Processing 1 sources...

Processing [1/1]: Ming Pao Instant News - Legal...
  Found 23 articles after filtering
  ✅ Ming Pao Instant News - Legal: 5 new, 18 updated

📊 Success Rate Summary:
  Total sources: 1
  Successful: 1
  Success rate: 100.0%

✨ RSS tracking completed: 23 articles processed
```

---

## 📊 監控與維護

### 檢查執行狀態

**GitHub Actions頁面**:
```
https://github.com/YOUR_USERNAME/Looper-HQ/actions/workflows/rss-crawler.yml
```

**查看日誌**:
- 綠色勾 ✅ = 成功
- 紅色叉 ❌ = 失敗（會自動創建Issue）
- 黃色點 🟡 = 執行中

### 失敗處理

Workflow失敗時會自動：
1. 創建GitHub Issue（標籤：`bug`, `rss-crawler`, `automated`）
2. 包含workflow run連結和錯誤時間
3. 列出可能原因：
   - RSS源返回403/404錯誤
   - 資料庫連線問題
   - 網路超時

### 資料庫驗證

**Prisma Studio**（本地）:
```bash
pnpm db:studio
```

檢查：
1. `PublicCase` 表 - 新文章是否成功存儲
2. `RssSource` 表 - `lastFetchAt` 時間戳是否更新
3. `RssSource.status` - 應該是 `ACTIVE`（成功）或 `ERROR`（失敗）

---

## 🧪 本地測試

在推送到GitHub前本地測試：

```bash
# 1. 確保Docker運行
pnpm docker:up

# 2. 設置環境變量
export DATABASE_URL="postgresql://postgres:Ken202318@localhost:5432/looper_hq?schema=public"

# 3. 運行crawler
pnpm crawler:rss
```

**預期行為**:
- 首次運行：抓取所有active sources
- 15分鐘內再次運行：跳過INS源（interval未達）
- 2小時後運行：抓取PNS源

---

## ⚙️ 進階配置

### 修改執行頻率

編輯 [`.github/workflows/rss-crawler.yml`](../../.github/workflows/rss-crawler.yml):

```yaml
on:
  schedule:
    - cron: '0 * * * *'  # 每小時執行
    # - cron: '*/30 * * * *'  # 每30分鐘執行
```

### 停用自動執行

註解掉schedule（只允許手動觸發）:

```yaml
on:
  # schedule:
  #   - cron: '*/15 * * * *'
  workflow_dispatch:
```

### 修改RSS源配置

在 [`packages/database/prisma/seed.ts`](../../packages/database/prisma/seed.ts) 修改：

```typescript
{
  name: 'Ming Pao Instant News - Legal',
  fetchInterval: 900,    // 15分鐘 = 900秒
  isActive: true,         // true = 啟用, false = 停用
  maxRetries: 3,          // 重試次數
  retryDelay: 300,        // 重試延遲（秒）
}
```

重新seed:
```bash
pnpm db:seed
```

---

## ❓ 常見問題

### Q: Workflow每次都跳過所有sources？
**A**: `lastFetchAt`太新，等待fetchInterval時間後再試，或手動設置為null：
```sql
UPDATE "RssSource" SET "lastFetchAt" = NULL WHERE source = 'MINGPAO_INS_RSS';
```

### Q: 403錯誤持續出現？
**A**: 
1. 檢查防火牆/IP白名單
2. 嘗試深夜時段執行（00:00-06:00 HKT）
3. 增加`retryDelay`：300秒 → 600秒

### Q: 如何查看crawler處理了多少文章？
**A**: 
1. 查看workflow logs中的 "✨ RSS tracking completed: X articles processed"
2. Prisma Studio → PublicCase表 → 按`crawledAt`排序

### Q: GitHub Actions有使用限制嗎？
**A**: 
- Public repos: 無限免費
- Private repos: 2000分鐘/月（免費套餐）
- 每次運行約1-3分鐘 → 每月約720次執行（每15分鐘 × 30天）

---

## 📚 相關文件

- [RSS配置優化文檔](./RSS_CONFIG_OPTIMIZATIONS.md)
- [Crawler源碼](../../scripts/crawlers/rss-news-crawler.ts)
- [RSS Parser服務](../../apps/web/lib/services/rss-parser.ts)
- [Keyword Filter服務](../../apps/web/lib/services/keyword-filter.ts)

---

## 🎯 下次優化建議

- [ ] 添加Slack/Discord通知webhook
- [ ] 記錄每次抓取的統計數據到資料庫
- [ ] 根據403頻率自動調整fetchInterval
- [ ] 添加unit tests for crawler logic
- [ ] 實作exponential backoff for retries
