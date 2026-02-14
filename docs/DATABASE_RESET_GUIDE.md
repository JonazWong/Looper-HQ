# 📋 數據庫重置指南

## 📌 概述

本指南說明如何完全重置 Looper HQ 數據庫，清除所有模擬數據，只保留 RSS 爬蟲配置。

根據以下文檔優化：
- `docs/港聞新聞源到法律資訊搜尋方法及注意事項指南.md`
- `docs/香港司法機構案件數據自動抓取系統 - 完整實現指南.md`

---

## 🎯 使用場景

### ✅ 何時需要完全重置

1. **開發環境初始化** - 首次設置或重新開始
2. **清除測試資料** - 移除所有模擬數據
3. **生產部署前** - 確保乾淨的初始狀態
4. **結構變更後** - Prisma schema 重大更新

### ❌ 不適合的場景

- 生產環境有真實用戶數據
- 只需要更新 RSS 配置（用 seed-minimal.ts）
- 小規模數據清理（用 SQL 手動清理）

---

## 🚀 方案 1：自動化腳本（推薦）

### Windows PowerShell

```powershell
.\reset-database.ps1
```

**執行流程**：
1. 確認操作（輸入 `YES`）
2. 檢查 Docker 容器
3. 設置環境變數
4. 完全重置資料庫
5. 重新生成 Prisma Client
6. 初始化 RSS 來源配置

**預期輸出**：
```
✅ 數據庫重置完成！

📊 當前狀態：
  • 資料庫：已清空
  • RSS 來源：已配置（明報日報、明報即時）
  • 模擬數據：無
```

---

## 🛠️ 方案 2：手動執行（逐步）

### 步驟 1：確保資料庫運行

```bash
# 啟動 Docker 容器
pnpm docker:up

# 等待 15 秒讓資料庫就緒
```

### 步驟 2：設置環境變數

```powershell
# PowerShell
$env:DATABASE_URL = "postgresql://postgres:Ken202318@localhost:5432/looper_hq"
```

```bash
# Bash/Zsh
export DATABASE_URL="postgresql://postgres:Ken202318@localhost:5432/looper_hq"
```

### 步驟 3：完全重置資料庫

```bash
cd packages/database

# 強制重置（刪除所有資料）
npx prisma db push --force-reset --accept-data-loss --skip-generate

cd ../..
```

### 步驟 4：重新生成 Prisma Client

```bash
pnpm --filter=@looper-hq/database generate
```

### 步驟 5：初始化 RSS 配置

```bash
cd packages/database
npx tsx prisma/seed-minimal.ts
cd ../..
```

---

## 📊 RSS 來源配置詳情

重置後會自動配置以下 RSS 來源：

| 來源 | URL | 抓取頻率 | 狀態 |
|------|-----|---------|------|
| **明報日報 - 港聞** | https://news.mingpao.com/rss/pns/s00002.xml | 每 2 小時 | ✅ 啟用 |
| **明報即時新聞 - 法律** | https://news.mingpao.com/rss/ins/s00001.xml | 每 15 分鐘 | ✅ 啟用 |

### 配置特點

**關鍵詞過濾**（中英文）：
- 法律相關：法庭、法院、法律、法官、訴訟、律師、檢控、判決
- 案件類型：刑事、民事、司法覆核、僱傭糾紛、合約糾紛
- 法院名稱：高等法院、區域法院、裁判法院、終審法院

**排除關鍵詞**：
- 體育、娛樂、美食、旅遊、天氣、財經、股市、樓市

**抓取策略**（根據文檔建議）：
- 即時新聞源：每 10-15 分鐘
- 每日新聞源：每 1-2 小時
- 速率限制：每次請求間隔 1-2 秒
- 重試機制：最多 3 次，每次間隔 5 分鐘

---

## ✅ 驗證重置結果

### 1. 查看資料庫

```bash
pnpm db:studio
```

**檢查項目**：
- `RssSource` 表格應該有 2 條記錄
- `PublicCase` 表格應該為空
- `User`、`Case`、`Client` 等表格應該為空

### 2. 測試爬蟲

```bash
# 運行 RSS 爬蟲
pnpm crawler:rss
```

**預期輸出**：
```
📰 Found 2 RSS sources in database
  ✓ 明報日報 - 港聞: Never fetched before
  ✓ 明報即時新聞 - 法律: Never fetched before

🚀 Processing 2 sources...

Processing [1/2]: 明報日報 - 港聞...
  Found XX articles after filtering
  ✅ 新增 XX 條法律新聞

Processing [2/2]: 明報即時新聞 - 法律...
  Found XX articles after filtering
  ✅ 新增 XX 條法律新聞

✨ RSS tracking completed: XX articles processed
```

### 3. 查看抓取的資料

```bash
pnpm db:studio
```

打開 `PublicCase` 表格，應該看到：
- 真實的新聞標題（中文和英文）
- 來源標註為 `MINGPAO_PNS_RSS` 或 `MINGPAO_INS_RSS`
- 發布日期、關鍵詞等信息

---

## 🔧 常見問題

### Q1: 重置後沒有 RSS 來源？

**A**: 檢查 `seed-minimal.ts` 是否正確執行：

```bash
cd packages/database
$env:DATABASE_URL = "postgresql://postgres:Ken202318@localhost:5432/looper_hq"
npx tsx prisma/seed-minimal.ts
```

### Q2: 爬蟲沒有抓取到資料？

**A**: 可能原因：
1. RSS 源暫時無法訪問
2. 關鍵詞過濾太嚴格
3. 網絡連接問題

檢查方法：
```bash
# 查看 RSS 源狀態
pnpm db:studio
# → 檢查 RssSource 表格的 lastError 欄位

# 直接訪問 RSS 源
curl https://news.mingpao.com/rss/ins/s00001.xml
```

### Q3: 想恢復模擬數據怎麼辦？

**A**: 使用完整版 seed：

```bash
cd packages/database
npx tsx prisma/seed.ts
```

### Q4: 如何只重置特定表格？

**A**: 使用 Prisma Studio 或 SQL：

```sql
-- 只清空 PublicCase
DELETE FROM "public_cases";

-- 只清空用戶相關資料
DELETE FROM "activities";
DELETE FROM "cases";
DELETE FROM "users";
DELETE FROM "firms";
```

---

## 📚 相關文檔

- [爬蟲設置指南](./CRAWLER_SETUP_GUIDE.md)
- [爬蟲快速參考](../CRAWLER_QUICK_REFERENCE.md)
- [港聞新聞源指南](./港聞新聞源到法律資訊搜尋方法及注意事項指南.md)
- [香港司法案件抓取指南](./香港司法機構案件數據自動抓取系統 - 完整實現指南.md)

---

## ⚠️ 注意事項

### 生產環境警告

**❌ 絕對不要在生產環境執行完全重置**，除非：
1. 已完成完整資料備份
2. 得到所有相關人員確認
3. 在維護時段進行
4. 有完整的回滾方案

### 開發環境建議

**✅ 開發環境可以自由重置**：
- 定期清理測試數據
- 驗證新功能前重置
- 結構變更後重新開始

---

**最後更新**: 2026-02-14  
**維護者**: Looper HQ Team
