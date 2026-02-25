# 司法機構爬蟲配置整合完成報告
## HK Judiciary Crawler - Crawler-Config Integration

**日期**: 2025年2月14日 (週五)  
**狀態**: ✅ 完成  
**相關文件**: PR #199 爬蟲模組化改進

---

## 📋 整合內容

### 1. **配置模組導入**
```typescript
import { defaultCrawlerConfig, getRandomUserAgent, isKnownError } from './crawler-config';
```

### 2. **已替換的硬編碼值**

| 原始值 | 新配置 | 說明 |
|--------|--------|------|
| `timeout: 15000` | `defaultCrawlerConfig.timeoutMs` | 15秒超時 |
| `delayMs = 2000` | `defaultCrawlerConfig.rateLimitDelayMs` | 請求間隔 2 秒 |
| 固定 User-Agent | `getRandomUserAgent()` | 7 組瀏覽器輪換 |

### 3. **智能錯誤分類**

新增錯誤級別判斷，減少已知錯誤的噪音：

```typescript
catch (error: any) {
  const isKnown = isKnownError(error.message);
  const logLevel = isKnown ? '⚠️' : '❌';  // 已知錯誤降級為警告
  console.error(`${logLevel} 錯誤訊息...`);
}
```

**應用位置**:
- `scrapeCourtOfAppeal()` - 上訴法庭抓取
- `scrapeHighCourt()` - 高等法院抓取
- `saveJudgment()` - 案件保存

### 4. **已知錯誤模式** (crawler-config.ts)

以下錯誤會被識別為已知問題（WARNING 級別）：
- `403`, `404`, `ECONNRESET`, `ETIMEDOUT`, `ENOTFOUND`
- `socket hang up`, `Cloudflare`, `Access denied`, `Forbidden`
- `Non-whitespace before first tag`, `Invalid XML`, `XML parsing error`

---

## 🧪 測試方法

### **快速測試** (PowerShell)
```powershell
./test-judiciary-crawler.ps1
```

### **快速測試** (Bash)
```bash
chmod +x test-judiciary-crawler.sh
./test-judiciary-crawler.sh
```

### **手動測試**
```bash
# 1. 確保環境準備完成
pnpm docker:up
pnpm --filter=@looper-hq/database prisma generate
pnpm db:push

# 2. 執行爬蟲
cd scripts/crawlers
npx tsx hk-judiciary-crawler.ts

# 3. 查看結果
pnpm --filter=@looper-hq/database prisma studio
# 檢查 public_cases 表中 source='HK_JUDICIARY' 的記錄
```

---

## 📊 預期行為

### **正常流程**:
```
📜 開始抓取香港司法機構案件...
======================================================================
  📜 抓取上訴法庭判決書...
    ✓ 獲取 X 個上訴法庭案件
  ⚖️  抓取高等法院判決書...
    ✓ 獲取 X 個高等法院案件

  📊 共獲取 X 個判決，開始儲存...

  [1/X] CACV 123/2025
    🤖 AI 分類: 民事 v 刑事案件...
    ✓ 已新增

======================================================================
📊 爬蟲統計:
   獲取: X 個案件
   新增: X 個
   更新: X 個
   略過: X 個
   錯誤: 0 個
======================================================================

✨ 司法機構爬蟲完成: X 個案件已處理
```

### **錯誤處理**:
- ⚠️ **已知錯誤** (如超時、Cloudflare): WARNING 級別，不影響執行
- ❌ **未知錯誤**: ERROR 級別，記錄到 stats.errors

---

## 🔧 配置參數 (crawler-config.ts)

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `maxRetries` | 3 | 重試次數 |
| `retryDelayMs` | 5000 | 重試延遲 (5秒) |
| `timeoutMs` | 15000 | 請求超時 (15秒) |
| `rateLimitDelayMs` | 2000 | 請求間隔 (2秒) |
| `successRateThreshold` | 0.6 | 成功率閾值 (60%) |
| `userAgentRotation` | true | 啟用 User-Agent 輪換 |
| `silenceKnownErrors` | true | 降低已知錯誤日誌級別 |

### **User-Agent 池** (7組輪換):
- Chrome 120 (Windows)
- Firefox 121 (Windows)
- Safari 17 (macOS)
- Edge 120 (Windows)
- Chrome 120 (macOS)
- Firefox 121 (macOS)
- Chrome 120 (Linux)

---

## 🔗 相關文件

### **配置模組**:
- `scripts/crawlers/crawler-config.ts` - 統一配置
- `scripts/crawlers/source-blacklist.ts` - 黑名單管理

### **爬蟲實現**:
- `scripts/crawlers/hk-judiciary-crawler.ts` - **司法機構爬蟲** ✅ 已整合
- `scripts/crawlers/rss-news-crawler.ts` - RSS 新聞爬蟲 ✅ 已整合

### **測試腳本**:
- `test-judiciary-crawler.ps1` - PowerShell 測試
- `test-judiciary-crawler.sh` - Bash 測試
- `test-crawler-local.ps1` - RSS 爬蟲測試

---

## ✅ 驗證清單

- [x] 導入 crawler-config 模組
- [x] 替換 timeout 硬編碼值
- [x] 替換 delayMs 硬編碼值
- [x] 實現 User-Agent 輪換
- [x] 添加智能錯誤分類（3 處錯誤處理）
- [x] TypeScript 編譯無錯誤
- [x] 建立測試腳本 (PowerShell + Bash)
- [x] 文檔整理

---

## 📌 下一步

### **立即測試**:
```powershell
./test-judiciary-crawler.ps1
```

### **設置每日自動抓取** (可選):
在 `.github/workflows/` 新增 `daily-judiciary-crawler.yml`:
```yaml
name: Daily Judiciary Crawler
on:
  schedule:
    - cron: '0 2 * * *'  # 每天早上 2:00 HKT 執行
  workflow_dispatch:      # 支援手動觸發

jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Generate Prisma Client
        run: pnpm --filter=@looper-hq/database prisma generate
      
      - name: Run Judiciary Crawler
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          cd scripts/crawlers
          npx tsx hk-judiciary-crawler.ts
```

### **查看資料庫記錄**:
```sql
-- 查看抓取的案件數量
SELECT COUNT(*) FROM public_cases WHERE source = 'HK_JUDICIARY';

-- 查看最新案件
SELECT 
  case_number, 
  title_zh, 
  court, 
  category, 
  judgment_date, 
  crawled_at
FROM public_cases 
WHERE source = 'HK_JUDICIARY'
ORDER BY crawled_at DESC
LIMIT 10;

-- 查看案件分類統計
SELECT 
  category, 
  court, 
  COUNT(*) as count
FROM public_cases 
WHERE source = 'HK_JUDICIARY'
GROUP BY category, court
ORDER BY count DESC;
```

---

## 🎯 成果

✅ **配置統一化**: 司法機構爬蟲現在使用集中配置管理  
✅ **User-Agent 輪換**: 降低被識別為機器人的風險  
✅ **智能錯誤處理**: 減少已知錯誤的日誌噪音  
✅ **可維護性提升**: 配置修改無需改動爬蟲代碼  
✅ **測試腳本**: 一鍵啟動測試環境  

**與 PR #199 整合狀態**: 完全整合 ✅  
**TypeScript 編譯**: 無錯誤 ✅  
**準備投入使用**: 是 ✅
