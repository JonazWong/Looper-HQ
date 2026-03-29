# 香港法案系統 - 快速參考卡片

## 🎯 一鍵診斷

```bash
# 系統健康檢查（爬蟲、AI、資料庫）
tsx .github/skills/hk-legal-case-system/scripts/diagnose.ts

# 資料完整性驗證
tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts

# 檢查最近 24 小時資料
tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts --recent=24

# 僅檢查 RSS 來源
tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts --source=RSS
```

## 🕷️ 爬蟲管理

```bash
# 執行所有爬蟲
pnpm crawler:all

# 單獨執行
pnpm crawler:rss          # RSS 新聞
pnpm crawler:hklii        # HKLII 判例
pnpm crawler:judiciary-dcl # 司法機構每日清單

# 健康檢查
pnpm crawler:health
```

## 🗄️ 資料庫操作

```bash
# 啟動 Docker 服務
pnpm docker:up

# 同步 schema（開發）
pnpm db:push

# 創建 migration（生產）
pnpm db:migrate

# 打開 Prisma Studio
pnpm --filter=@looper-hq/database prisma studio

# 重新生成 Prisma Client
pnpm --filter=@looper-hq/database prisma generate
```

## 🤖 AI 分類

```bash
# 批量分類未分類案件（需自行創建腳本）
tsx scripts/batch-classify.ts

# 訪問 Web 介面批量分類
http://localhost:3005/admin/ai-classify
```

## 🔍 故障排除速查

| 症狀 | 可能原因 | 快速修復 |
|------|----------|----------|
| 爬蟲無資料 | Docker 未啟動 | `pnpm docker:up && sleep 15` |
| Prisma Client 錯誤 | 未生成 client | `pnpm --filter=@looper-hq/database prisma generate` |
| RSS 超時 | 來源過慢 | 增加 `RSS_TIMEOUT=60000` |
| AI 分類失敗 | API key 錯誤 | 檢查 `.env` 的 `OPENAI_API_KEY` |
| 重複資料 | Unique constraint | 使用 `upsert` 而非 `create` |
| db:push 失敗 | DB 未啟動 | `pnpm docker:up && sleep 15 && pnpm db:push` |

## 📊 常用 SQL 查詢

```sql
-- 檢查爬蟲執行記錄
SELECT "startedAt", status, stats, "errorLog" 
FROM "CrawlerJobRun" 
ORDER BY "startedAt" DESC 
LIMIT 5;

-- 各來源案件數
SELECT source, COUNT(*) as count 
FROM "PublicCase" 
GROUP BY source;

-- 未分類案件
SELECT id, "title_zh", "title_en", source 
FROM "PublicCase" 
WHERE "aiClassified" = false 
LIMIT 20;

-- 低信心度分類
SELECT id, "title_zh", category, "aiConfidence" 
FROM "PublicCase" 
WHERE "aiClassified" = true AND "aiConfidence" < 0.7 
ORDER BY "aiConfidence" ASC;

-- 找重複資料
SELECT source, "externalId", COUNT(*) as count 
FROM "PublicCase" 
GROUP BY source, "externalId" 
HAVING COUNT(*) > 1;
```

## 🔗 重要檔案路徑

```
爬蟲主協調器:     scripts/crawlers/unified-tracker.ts
RSS 爬蟲:        scripts/crawlers/rss-news-crawler.ts
HKLII 爬蟲:      scripts/crawlers/hklii-crawler.ts
AI 分類服務:     apps/web/lib/services/ai-classifier.ts
Prisma Schema:   packages/database/prisma/schema.prisma
環境變數範例:    .env.example
```

## 🌐 生產環境

```bash
# 查看 GitHub Actions 執行記錄
gh run list --workflow=crawler.yml --limit 10
gh run view <run_id> --log

# 手動觸發爬蟲
gh workflow run crawler.yml

# SSH 連線到 DO Droplet
ssh user@<droplet-ip>

# 查看生產日誌
pm2 logs looper-web --lines 50
```

## 📞 檔案導覽

| 需求 | 查看檔案 |
|------|----------|
| 添加新爬蟲 | [SKILL.md](./SKILL.md) - 工作流程 1 |
| 修復 AI 分類 | [SKILL.md](./SKILL.md) - 工作流程 2 |
| 診斷失敗 | [troubleshooting.md](./references/troubleshooting.md) |
| 案例類別參考 | [case-categories.md](./references/case-categories.md) |
| 生產同步 | [production-sync.md](./references/production-sync.md) |
| 完整說明 | [README.md](./README.md) |

## 💡 提示

- 修改 schema 後一定要執行 `prisma generate`
- 使用 `db:push` 開發，`db:migrate` 生產
- 爬蟲用 `upsert` 避免重複
- AI 分類加延遲避免 rate limit
- 定期執行診斷腳本確保系統健康

---

**快捷方式**: 將此檔案加入書籤，或列印貼在螢幕旁 📌
