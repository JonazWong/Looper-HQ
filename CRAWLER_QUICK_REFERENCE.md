# 🕷️ 爬蟲系統快速參考

## ✅ 當前配置

| 系統 | 狀態 | 排程時間 | 命令 |
|------|------|---------|------|
| Daily Case Tracking | ✅ 已啟用 | 每天 2:00 AM HKT | `pnpm crawler:all` |
| RSS News Crawler | ✅ 已啟用 | 每天 2:30 AM HKT | `pnpm crawler:rss` |

## 🚀 快速命令

```bash
# 本地測試所有爬蟲
pnpm crawler:all

# 只測試 RSS 爬蟲
pnpm crawler:rss

# 只測試司法機構爬蟲
pnpm crawler:judiciary

# 檢查爬蟲健康狀態
pnpm crawler:health

# 測試 RSS 來源配置
pnpm test:rss

# 查看爬取的資料
pnpm db:studio
```

## 🔧 GitHub Actions 手動觸發

1. 前往: https://github.com/JonazWong/Looper-HQ/actions
2. 選擇 workflow：
   - **Daily Case Tracking** - 綜合爬蟲
   - **RSS News Crawler** - RSS 新聞爬蟲
3. 點擊 **Run workflow** → 選擇 `main` branch → **Run workflow**

## 📊 監控

- **Actions 執行記錄**: [GitHub Actions](https://github.com/JonazWong/Looper-HQ/actions)
- **資料庫查看**: `pnpm db:studio` → 查看 `PublicCase` 表格
- **RSS 來源狀態**: `pnpm db:studio` → 查看 `RssSource` 表格

## 📚 完整文檔

詳細設置指南請參考: [docs/CRAWLER_SETUP_GUIDE.md](./docs/CRAWLER_SETUP_GUIDE.md)

## ⚙️ 必要配置

### GitHub Secrets
前往: **Settings** → **Secrets and variables** → **Actions**

需要設置:
- `DATABASE_URL` - 生產環境資料庫連接字串

### 本地環境
```bash
# 複製環境變數範例
cp .env.example .env

# 編輯 .env 文件，設置：
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/looper_hq"
CRAWLER_ENABLED=true
RSS_TIMEOUT=30000
RSS_MAX_RETRIES=3
```

---
**最後更新**: 2026-02-14
