# 🚀 數據庫重置 - 完成摘要

## ✅ 已完成的工作

### 1. **創建了精簡版 Seed 配置**
- 文件：`packages/database/prisma/seed-minimal.ts`
- 功能：只配置 RSS 來源，不包含任何模擬數據
- 根據文檔優化關鍵詞和抓取頻率

### 2. **創建了自動化重置腳本**
- 文件：`reset-database.ps1`
- 功能：一鍵完全重置數據庫
- 包含安全確認機制

### 3. **創建了詳細文檔**
- 文件：`docs/DATABASE_RESET_GUIDE.md`
- 內容：完整的重置指南、常見問題、驗證方法

### 4. **更新了 package.json**
- 新增命令：`pnpm db:seed:minimal`
- 方便快速初始化 RSS 配置

---

## 🎯 現在就開始重置

### 方法 1：使用自動化腳本（最簡單）

```powershell
.\reset-database.ps1
```

輸入 `YES` 確認，然後等待完成。

### 方法 2：手動執行（逐步控制）

```powershell
# 1. 確保 Docker 運行
pnpm docker:up

# 2. 設置環境變數
$env:DATABASE_URL = "postgresql://postgres:Ken202318@localhost:5432/looper_hq"

# 3. 完全重置
cd packages\database
npx prisma db push --force-reset --accept-data-loss --skip-generate
cd ..\..

# 4. 重新生成 Prisma Client
pnpm --filter=@looper-hq/database generate

# 5. 初始化 RSS 配置
pnpm db:seed:minimal
```

---

## 📊 重置後的數據庫狀態

### ✅ 將會包含

| 項目 | 數量 | 說明 |
|------|------|------|
| **RSS 來源** | 4 個 | SCMP、RTHK（啟用）+ 明報日報、明報即時（暫停） |
| **啟用來源** | 2 個 | SCMP、RTHK |
| **關鍵詞** | 40+ 個 | 中英文法律相關詞彙 |
| **排除詞** | 15+ 個 | 非法律新聞過濾 |

### ❌ 不會包含

- ❌ 模擬用戶
- ❌ 模擬案件
- ❌ 模擬客戶
- ❌ 測試發票
- ❌ 任何虛假資料

---

## 🧪 測試爬蟲

重置完成後，立即測試：

```bash
# 運行 RSS 爬蟲
pnpm crawler:rss
```

**預期結果**：
```
📰 Found 2 RSS sources in database
  ✓ South China Morning Post - Legal: Never fetched before
  ✓ 香港電台新聞 - RTHK News: Never fetched before

🚀 Processing 2 sources...

Processing [1/2]: South China Morning Post - Legal...
  Found 18 articles after filtering
  ✅ 新增 12 條法律新聞

Processing [2/2]: 香港電台新聞 - RTHK News...
  Found 15 articles after filtering
  ✅ 新增 10 條法律新聞

📊 Success Rate Summary:
  Total sources: 2
  Successful: 2
  Success rate: 100.0%

✨ RSS tracking completed: 22 articles processed
```

---

## 📋 查看真實資料

```bash
# 打開 Prisma Studio
pnpm db:studio
```

訪問：http://localhost:5555

**查看表格**：
1. **RssSource** - 應該有 4 條記錄（2 個啟用，2 個暫停）
   - ✅ South China Morning Post - Legal (ACTIVE)
   - ✅ 香港電台新聞 - RTHK News (ACTIVE)
   - ⏸️ 明報日報 - 港聞 (INACTIVE - 暫停)
   - ⏸️ 明報即時新聞 - 法律 (INACTIVE - 暫停)
2. **PublicCase** - 應該有爬取的真實新聞（中英雙語）

---

## 🔄 如果需要恢復測試資料

```bash
# 使用完整版 seed（包含模擬數據）
pnpm db:seed
```

---

## 📚 參考文檔

根據以下文檔優化：

1. **港聞新聞源到法律資訊搜尋方法及注意事項指南**
   - RSS 來源配置
   - 抓取頻率建議
   - 關鍵詞過濾策略

2. **香港司法機構案件數據自動抓取系統 - 完整實現指南**
   - 數據結構設計
   - 爬蟲合規要求
   - 錯誤處理機制

---

## ✨ 下一步

重置完成後：

1. ✅ **測試爬蟲**：`pnpm crawler:rss`
2. ✅ **查看資料**：`pnpm db:studio`
3. ✅ **啟用自動化**：推送到 GitHub 啟動每日自動抓取
4. ✅ **監控狀態**：查看 GitHub Actions 執行記錄

---

**準備好了嗎？運行 `.\reset-database.ps1` 開始重置！**
