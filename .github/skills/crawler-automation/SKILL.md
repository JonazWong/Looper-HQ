---
name: crawler-automation
description: "爬蟲配置檢查與自修復工作流程。Use for: 檢查 RSS/HK Judiciary 爬蟲配置、驗證自動化任務、診斷爬蟲健康、執行自我修復操作、優化抓取參數、黑名單與故障源管理。Keywords: crawler, RSS, judiciary, automation, self-heal, retry, health check, configuration, CRAWLER_ENABLED, RssSource, CrawlerJobRun, auto-fix."
argument-hint: "指定命令: check|fix 或 --fix"
---

# 爬蟲自動化與自修復技能

這個技能專注於 Looper HQ 的爬蟲系統自動檢查與修復。它覆蓋以下內容：

- 核心爬蟲配置檢查 (`scripts/crawlers/crawler-config.ts`)
- RSS 來源健康與活躍性檢查
- 爬蟲黑名單 / 已知失敗來源分析
- 自動修復建議與安全操作
- 生成可直接執行的檢查/修復命令

## 何時使用

- 想確認爬蟲自動化是否被正確啟用
- 需要查找錯誤 Data/Fetch 與爬蟲狀態異常
- 想讓爬蟲自動停用連續失敗來源
- 想優化抓取頻率、重試策略與超時設定
- 需快速定位 crawler config 與資料庫來源問題

## 運行指令

```bash
pnpm crawler:auto-check
pnpm crawler:auto-fix
```

## 內容說明

### `crawler:auto-check`

執行完整檢查：

- 環境變數配置是否健全
- `crawler-config.ts` 的重要參數是否明確
- RSS 來源是否有黑名單衝突
- 各來源是否處於 stale/error/active 狀態
- 建議的優化措施

### `crawler:auto-fix`

在安全條件下，對以下項目進行自動修復：

- 將明確黑名單 URL 的來源標記為 `isActive=false`
- 將長時間錯誤或無法正常抓取的來源標記為 `INACTIVE`
- 提供修復日誌與操作總結

## 相關檔案

- `scripts/crawlers/crawler-config.ts`
- `scripts/crawlers/source-blacklist.ts`
- `scripts/crawlers/health-check.ts`
- `scripts/crawlers/crawler-automation.ts`
- `scripts/ensure-rss-sources.ts`
- `package.json`

## 注意事項

- 修復模式 (`--fix`) 會修改資料庫中的來源狀態，請在正式環境前先備份資料
- 若需要更複雜的自修復規則，可擴展為 `--fix-unsafe` 或 `--fix-strict`
