# 🕷️ 爬蟲系統設置指南

## 📋 概述

Looper HQ 包含兩個自動化爬蟲系統，每天自動抓取香港法律案件和新聞：

| 爬蟲系統 | 排程時間 | 功能 | 狀態 |
|---------|---------|------|------|
| **Daily Case Tracking** | 每天 2:00 AM HKT | 抓取香港司法機構案件 + RSS 新聞 | ✅ 已啟用 |
| **RSS News Crawler** | 每天 2:30 AM HKT | 單獨抓取 RSS 新聞來源 | ✅ 已啟用 |

## 🚀 快速開始

### 1️⃣ 配置 GitHub Secrets

前往您的 GitHub Repository：
```
Settings → Secrets and variables → Actions → New repository secret
```

**必須添加的 Secret**:

#### `DATABASE_URL`
```bash
postgresql://[用戶名]:[密碼]@[主機]:[端口]/[資料庫名稱]?schema=public
```

**生產環境範例**:
```bash
postgresql://looper_user:YOUR_STRONG_PASSWORD@db.looper-hq.com:5432/looper_hq?schema=public
```

**本地測試範例**:
```bash
postgresql://postgres:postgres@localhost:5433/looper_hq?schema=public
```

### 2️⃣ 驗證 Workflow 配置

檢查兩個 workflow 文件是否正確：

#### Daily Case Tracking
文件：`.github/workflows/daily-case-tracking.yml`
```yaml
on:
  schedule:
    - cron: '0 18 * * *'  # 每天 2:00 AM HKT (18:00 UTC)
  workflow_dispatch:      # 允許手動觸發
```

#### RSS News Crawler
文件：`.github/workflows/rss-crawler.yml`
```yaml
on:
  schedule:
    - cron: '30 18 * * *'  # 每天 2:30 AM HKT (18:30 UTC)
  workflow_dispatch:       # 允許手動觸發
```

### 3️⃣ 手動測試 Workflow

#### 測試 Daily Case Tracking

1. 前往 **Actions** 標籤
2. 選擇 **Daily Case Tracking**
3. 點擊 **Run workflow** → 選擇 `main` branch → **Run workflow**
4. 等待執行完成（約 2-5 分鐘）
5. 查看執行日誌

**預期輸出**:
```
🚀 Starting daily case tracking...
============================================================

📜 Tracking HK Judiciary cases...
------------------------------------------------------------
✅ Judiciary: 15 cases processed

📰 Tracking RSS news sources...
------------------------------------------------------------
  ✓ Ming Pao Instant News - Legal: Last fetched 16m ago
  🚀 Processing 1 sources...
  ✅ RSS: 23 articles processed

============================================================
📊 Tracking Summary:
============================================================
   HK Judiciary: 15 cases
   RSS News:     23 articles
   Total:        38 items

✨ Daily tracking completed successfully!
```

#### 測試 RSS Crawler

1. 前往 **Actions** 標籤
2. 選擇 **RSS News Crawler**
3. 點擊 **Run workflow** → 選擇 `main` branch → **Run workflow**
4. 等待執行完成（約 1-3 分鐘）
5. 查看執行日誌

## 📊 監控與維護

### 檢查執行狀態

**查看所有 Workflow 執行記錄**:
```
https://github.com/YOUR_USERNAME/Looper-HQ/actions
```

**查看特定 Workflow**:
- Daily Case Tracking: `https://github.com/YOUR_USERNAME/Looper-HQ/actions/workflows/daily-case-tracking.yml`
- RSS Crawler: `https://github.com/YOUR_USERNAME/Looper-HQ/actions/workflows/rss-crawler.yml`

### 查看抓取的資料

#### 使用 Prisma Studio（本地）
```bash
pnpm db:studio
```
然後查看 `PublicCase` 表格。

#### 使用 API（生產環境）
```bash
# 獲取公開案件列表
curl https://your-domain.com/api/public-cases

# 帶分頁
curl https://your-domain.com/api/public-cases?page=1&perPage=20

# 按來源篩選
curl https://your-domain.com/api/public-cases?source=HK_JUDICIARY
curl https://your-domain.com/api/public-cases?source=MINGPAO_INS_RSS
```

### 監控 RSS 來源狀態

```bash
# 本地執行健康檢查
pnpm crawler:health

# 查看 RSS 來源配置
pnpm db:studio
# → 打開 RssSource 表格
```

## 🔧 本地開發與測試

### 本地執行爬蟲

```bash
# 執行所有爬蟲（司法機構 + RSS）
pnpm crawler:all

# 只執行 RSS 爬蟲
pnpm crawler:rss

# 只執行司法機構爬蟲
pnpm crawler:judiciary

# 執行健康檢查
pnpm crawler:health

# 測試 RSS 來源配置
pnpm test:rss
```

### 更新 RSS 來源配置

編輯 `packages/database/prisma/seed.ts`：

```typescript
{
  name: '您的 RSS 來源名稱',
  source: 'YOUR_SOURCE_CODE',
  url: 'https://example.com/rss/feed.xml',
  isActive: true,
  status: 'ACTIVE',
  fetchInterval: 900,  // 15 分鐘（秒）
  maxRetries: 3,
  retryDelay: 300,     // 5 分鐘（秒）
  keywords: [
    'court', 'law', 'legal', 'judge',
    '法庭', '法院', '法律', '法官'
  ],
  excludeKeywords: ['sports', 'entertainment', '體育', '娛樂'],
}
```

重新 seed 資料庫：
```bash
pnpm db:seed
```

## 🚨 常見問題

### 1. Workflow 執行失敗

**檢查項目**:
- ✅ `DATABASE_URL` secret 是否正確設置
- ✅ 資料庫是否可訪問（防火牆、IP 白名單）
- ✅ 資料庫憑證是否正確

**查看錯誤日誌**:
前往 Actions → 點擊失敗的 workflow → 查看詳細日誌

### 2. RSS 來源返回 403/404 錯誤

**可能原因**:
- Cloudflare 或其他防火牆阻擋
- RSS 源 URL 已更改
- 需要特定的 User-Agent 或 headers

**解決方案**:
1. 暫時禁用該來源（設置 `isActive: false`）
2. 尋找替代 RSS 源
3. 聯繫新聞網站獲取正確的 RSS URL

### 3. 抓取重複資料

爬蟲系統使用 `(source, externalId)` 唯一約束來防止重複。如果仍有重複：

**檢查**:
- `externalId` 的生成邏輯是否正確
- 時間範圍設置是否合理（預設 7 天）

### 4. 沒有新資料被抓取

**檢查項目**:
- RSS 源是否有新文章
- 關鍵詞過濾是否太嚴格
- `fetchInterval` 設置是否合理
- `lastFetchAt` 時間是否正常更新

## 📈 性能優化建議

### RSS 來源分層抓取策略

| 優先級 | 抓取頻率 | fetchInterval | 來源類型 |
|--------|---------|---------------|---------|
| 高 | 每 15 分鐘 | 900 秒 | 即時新聞（Instant News） |
| 中 | 每 1 小時 | 3600 秒 | 滾動新聞 |
| 低 | 每 2 小時 | 7200 秒 | 日報版 |

### 減少 API 請求

- 使用 `fetchInterval` 智能控制抓取頻率
- 設置合理的 `maxRetries` 和 `retryDelay`
- 在來源之間添加延遲（已實現，2 秒）

### 資料庫優化

```sql
-- 建立索引加速查詢
CREATE INDEX idx_public_case_source_external 
ON "PublicCase"(source, "externalId");

CREATE INDEX idx_public_case_crawled_at 
ON "PublicCase"("crawledAt" DESC);
```

## 🔐 安全建議

1. **資料庫密碼**: 使用強密碼（至少 16 字元，包含大小寫、數字、特殊符號）
2. **IP 白名單**: 限制資料庫只能從 GitHub Actions IP 範圍訪問
3. **Secrets 管理**: 定期輪換 `DATABASE_URL` 密碼
4. **監控**: 設置資料庫異常訪問告警

## 📚 相關文檔

- [RSS 實施狀態](./RSS_IMPLEMENTATION_STATUS.md)
- [RSS 配置優化](./RSS_CONFIG_OPTIMIZATIONS.md)
- [架構文檔](./ARCHITECTURE.md)
- [快速開始指南](./QUICKSTART.md)

## 🆘 獲取幫助

如遇到問題，請：

1. 查看 GitHub Actions 日誌
2. 檢查 Issues 頁面看是否有類似問題
3. 創建新 Issue 並附上：
   - Workflow 執行 URL
   - 錯誤日誌截圖
   - 您的配置（去除敏感資訊）

---

**最後更新**: 2026-02-14  
**維護者**: Looper HQ Team
