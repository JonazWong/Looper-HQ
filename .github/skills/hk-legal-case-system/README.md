# 香港法案系統技能 - README

## 📖 技能概述

這個技能包提供完整的工作流程和工具，用於維護 Looper HQ 的香港法案記錄與文件搜尋系統。

## 🎯 適用場景

當你需要：
- ✅ 添加新的法律資料來源（新爬蟲）
- ✅ 修復失敗的爬蟲執行
- ✅ 診斷 AI 分類錯誤
- ✅ 驗證資料庫同步狀態
- ✅ 批量處理案件資料
- ✅ 擴展資料庫 schema
- ✅ 同步本地與生產環境

## 📁 檔案結構

```
.github/skills/hk-legal-case-system/
├── SKILL.md                          # 主要技能文件（工作流程）
├── README.md                         # 本檔案
├── scripts/                          # 執行腳本
│   ├── diagnose.ts                   # 系統健康檢查
│   └── verify-data-integrity.ts      # 資料完整性驗證
└── references/                       # 參考文件
    ├── case-categories.md            # 22 種案例類別參考
    ├── production-sync.md            # 生產環境同步指南
    └── troubleshooting.md            # 故障排除快速指南
```

## 🚀 快速開始

### 1. 系統健康檢查

```bash
# 檢查爬蟲、AI 分類、資料庫狀態
tsx .github/skills/hk-legal-case-system/scripts/diagnose.ts
```

**輸出範例**:
```
🔍 系統健康檢查
==============================================================
✅ 資料庫連線正常

📊 最近爬蟲執行:
   狀態: SUCCESS
   時間: 2 小時前
   統計: {"rss":45,"hklii":12,"judiciaryDCL":8}

🤖 AI 分類狀態:
   總案件數: 1234
   已分類: 890 (72%)
   未分類: 344
   低信心 (<0.7): 23

📋 驗證總結
   錯誤 (ERROR): 0
   警告 (WARNING): 1
   資訊 (INFO): 1

✅ 系統狀態良好
```

### 2. 資料完整性驗證

```bash
# 檢查所有資料
tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts

# 僅檢查 RSS 來源
tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts --source=RSS

# 僅檢查最近 24 小時
tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts --recent=24
```

**檢查項目**:
- 爬蟲執行記錄
- PublicCase 資料品質（缺標題/摘要/URL）
- 重複資料偵測
- AI 分類狀態
- 來源分佈與健康度
- 資料關聯完整性

### 3. 使用 GitHub Copilot 觸發技能

在 VS Code 聊天視窗輸入：

```
/hk-legal-case-system 診斷爬蟲失敗原因
```

或

```
/hk-legal-case-system 添加新的法律資料來源：香港政府新聞公報
```

或

```
/hk-legal-case-system 批量重新分類低信心度案件
```

## 📚 主要工作流程

### 工作流程 1: 添加新爬蟲

詳見 [SKILL.md](./SKILL.md) → "工作流程 1: 添加新爬蟲"

**步驟摘要**:
1. 創建爬蟲檔案 `scripts/crawlers/xxx-crawler.ts`
2. 實作 `trackXXX()` 函數
3. 註冊到 `unified-tracker.ts`
4. 添加執行腳本到 `package.json`
5. 測試並驗證資料

### 工作流程 2: 修復 AI 分類問題

詳見 [SKILL.md](./SKILL.md) → "工作流程 2: 修復 AI 分類問題"

**常見情境**:
- 錯誤分類（如：司法覆核誤判為行政法）
- 信心度過低
- 欄位缺失（法官、法院）

### 工作流程 3: 診斷爬蟲失敗

詳見 [troubleshooting.md](./references/troubleshooting.md)

**快速診斷**:
```bash
# 1. 檢查最近執行記錄
pnpm --filter=@looper-hq/database prisma studio
# 瀏覽 CrawlerJobRun 表

# 2. 本地重現
pnpm crawler:rss

# 3. 檢查來源可用性
curl -I https://www.scmp.com/rss/2/feed
```

### 工作流程 4: 擴展資料庫 Schema

詳見 [SKILL.md](./SKILL.md) → "工作流程 4: 擴展資料庫 Schema"

**關鍵步驟**:
1. 修改 `packages/database/prisma/schema.prisma`
2. 執行 `pnpm --filter=@looper-hq/database prisma generate`
3. 開發環境: `pnpm db:push`
4. 生產環境: `pnpm db:migrate`
5. 同步更新 Zod schemas 和 API 路由

### 工作流程 5: 批量處理案件

詳見 [SKILL.md](./SKILL.md) → "工作流程 5: 批量處理歷史案件"

**範例**: 重新分類過去 6 個月未分類案件

## 🔗 參考文件

### [case-categories.md](./references/case-categories.md)
22 種案例類別完整參考，包括：
- 每種類別的定義與典型場景
- 關鍵詞與範例
- AI 分類提示最佳實踐
- 常見分類錯誤與修正

### [production-sync.md](./references/production-sync.md)
本地與 DO 生產環境同步指南：
- 3 種同步策略
- Prisma Migration 部署流程
- 資料完整性驗證腳本
- SSH Tunnel 安全連線

### [troubleshooting.md](./references/troubleshooting.md)
6 大失敗情境快速修復：
- RSS 超時
- HKLII 反爬
- 網站結構變更
- Unique constraint 違反
- Prisma Client 未生成
- AI 分類失敗

## 🛠️ 可用腳本

| 腳本 | 用途 | 執行方式 |
|------|------|----------|
| `diagnose.ts` | 系統健康檢查 | `tsx .github/skills/hk-legal-case-system/scripts/diagnose.ts` |
| `verify-data-integrity.ts` | 資料完整性驗證 | `tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts [--source=XXX] [--recent=24]` |
| 爬蟲執行 | 執行特定爬蟲 | `pnpm crawler:all` / `pnpm crawler:rss` / `pnpm crawler:hklii` |
| 健康檢查 | 爬蟲來源健康檢查 | `pnpm crawler:health` |

## 💡 最佳實踐

### 1. 開發流程
- 使用 `db:push` 快速迭代
- 正式發佈前建立 migration
- 修改 schema 前先備份資料庫

### 2. 爬蟲設計
- 使用 `upsert` 確保冪等性
- 個別來源失敗不中斷整體流程
- 添加速率限制避免封鎖
- 使用結構化日誌

### 3. AI 分類
- 提供明確範例與指引
- 設定信心閾值（建議 0.7）
- 限制輸入長度控制成本
- 添加延遲避免 rate limit

### 4. 資料管理
- 為常用查詢建立索引
- 使用 transaction 確保一致性
- 考慮軟刪除保留歷史
- 定期備份生產資料庫

## 🚨 常見陷阱

❌ 直接修改生產資料庫  
✅ 使用 SSH tunnel + 唯讀角色

❌ 忘記執行 `prisma generate`  
✅ 修改 schema 後立即執行

❌ 爬蟲無速率限制  
✅ 添加 `await delay(2000)` 避免封鎖

❌ AI 分類無錯誤處理  
✅ 使用 try-catch 並記錄失敗案例

## 📞 需要協助？

1. **查看參考文件**: `references/troubleshooting.md`
2. **執行診斷腳本**: `tsx scripts/diagnose.ts`
3. **檢查 GitHub Issues**: [Looper-HQ Issues](https://github.com/JonazWong/Looper-HQ/issues)
4. **詢問 AI**: 在 VS Code 使用 `/hk-legal-case-system` 觸發此技能

## 📝 維護記錄

| 日期 | 版本 | 變更 |
|------|------|------|
| 2026-03-26 | 1.0 | 初始版本 - 完整工作流程與參考文件 |

---

**維護者**: Looper HQ Team  
**最後更新**: 2026-03-26
