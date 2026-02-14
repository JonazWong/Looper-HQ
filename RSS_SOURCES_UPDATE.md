# 📰 RSS 來源更新說明

**更新日期**: 2026-02-14  
**原因**: 明報 RSS 源被封鎖

---

## 🔄 變更摘要

### ⏸️ 已暫停的來源

| 來源 | URL | 狀態 | 原因 |
|------|-----|------|------|
| 明報日報 - 港聞 | `https://news.mingpao.com/rss/pns/s00002.xml` | `INACTIVE` | 被封鎖 |
| 明報即時新聞 - 法律 | `https://news.mingpao.com/rss/ins/s00001.xml` | `INACTIVE` | 被封鎖 |

### ✅ 新啟用的來源

| 來源 | URL | 語言 | 抓取頻率 |
|------|-----|------|----------|
| **SCMP** - South China Morning Post | `https://www.scmp.com/rss/2/feed` | 英文為主 | 每 1 小時 |
| **RTHK** - 香港電台新聞 | `https://rthk.hk/rss/news.xml` | 中文為主 | 每 1 小時 |

---

## 📊 新來源特點

### South China Morning Post (SCMP)
- **優點**:
  - 國際視角的香港法律報導
  - 英文內容詳細，適合國際客戶
  - 涵蓋高院、上訴庭等重要案件
  - 較少被封鎖
  
- **關鍵詞**: 
  - 英文: court, law, legal, judge, lawsuit, prosecution, trial, verdict, justice
  - 中文: 法庭, 法院, 法律, 法官, 訴訟

### 香港電台新聞 (RTHK)
- **優點**:
  - 官方媒體，可靠性高
  - 中文報導詳細準確
  - 涵蓋本地法律新聞
  - 服務穩定，較少問題
  
- **關鍵詞**:
  - 中文: 法庭, 法院, 司法, 檢控, 判決, 司法覆核
  - 英文: court, law, legal, judge, prosecution

---

## 🚀 如何應用這些變更

### 方法 1: 完全重置（推薦）

```powershell
.\reset-database.ps1
```

這會：
- ✅ 清空數據庫
- ✅ 配置 4 個 RSS 源（2 個啟用，2 個暫停）
- ✅ 設置完整的關鍵詞和排除詞

### 方法 2: 手動更新現有數據庫

```bash
# 進入 Prisma Studio
pnpm db:studio

# 手動操作：
# 1. 找到 RssSource 表
# 2. 將明報的 2 個源設為 isActive: false, status: INACTIVE
# 3. 手動添加 SCMP 和 RTHK 兩個新源
```

---

## 🧪 測試新來源

重置後立即測試：

```bash
pnpm crawler:rss
```

應該只會抓取 SCMP 和 RTHK 的內容（明報因為 `isActive: false` 會被跳過）。

---

## 📝 後續監控

### 查看爬蟲狀態

```bash
# 打開 Prisma Studio
pnpm db:studio

# 查看：
# 1. RssSource 表 - 確認狀態
# 2. PublicCase 表 - 查看新抓取的案件
# 3. 檢查 lastFetchedAt 和 successfulFetches 欄位
```

### GitHub Actions

每日自動執行時間：
- **Daily Case Tracking**: 2:00 AM HKT
- **RSS Crawler**: 2:30 AM HKT

查看執行記錄：
https://github.com/JonazWong/Looper-HQ/actions

---

## 🔮 未來計劃

### 何時重新啟用明報？

當明報解除封鎖後：

1. 進入 Prisma Studio
2. 將明報來源的:
   - `isActive` 改為 `true`
   - `status` 改為 `ACTIVE`
3. 重新測試

或運行：
```typescript
await prisma.rssSource.updateMany({
  where: { source: { in: ['MINGPAO_PNS_RSS', 'MINGPAO_INS_RSS'] } },
  data: { isActive: true, status: 'ACTIVE' }
});
```

### 其他潛在來源

可考慮添加：
- HK01 法律頻道
- 立場新聞（如仍運作）
- 司法機構官網（需要 web scraping）

---

## ⚠️ 注意事項

1. **遵守服務條款**: SCMP 和 RTHK 都有使用條款，請遵守
2. **抓取頻率**: 目前設為 1 小時，如有問題可調整
3. **關鍵詞優化**: 如發現太多或太少結果，可調整關鍵詞
4. **監控成功率**: 定期檢查 `successfulFetches` 和 `failedFetches`

---

## 📞 問題排查

### 如果 SCMP 也被封鎖？

- 考慮使用 proxy 或 VPN
- 調整 User-Agent
- 延長抓取間隔

### 如果抓不到法律新聞？

- 檢查關鍵詞設置
- 查看原始 RSS feed 內容
- 調整 `excludeKeywords`

---

**準備好了嗎？運行 `.\reset-database.ps1` 開始使用新的 RSS 來源！**
