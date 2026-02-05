# RSS 配置優化摘要

**日期：** 2026-02-06  
**版本：** 1.1  
**狀態：** ✅ 已實施

---

## 📋 優化清單

### 1. RSS 來源配置更新

#### 明報每日版 URL 修正
- **原 URL:** `https://news.mingpao.com/rss/pns/s00001.xml` (要聞版)
- **新 URL:** `https://news.mingpao.com/rss/pns/s00002.xml` (港聞版)
- **原因:** 港聞版包含更多本地法律新聞
- **檔案:** `packages/database/prisma/seed.ts` (第 668 行)

#### 明報即時新聞 (保持不變)
- **URL:** `https://news.mingpao.com/rss/ins/s00001.xml`
- **狀態:** ✅ 運作正常 (已成功抓取 23 篇)

### 2. 時段感知延遲系統

#### 實施位置
- **檔案:** `apps/web/lib/services/rss-parser.ts`
- **函數:** `getTimeAwareDelay()`

#### 延遲策略
```typescript
深夜時段 (00:00-06:00): 1 秒
非繁忙時段 (06:00-09:00, 18:00-00:00): 2 秒
繁忙時段 (09:00-18:00): 3 秒
```

#### 優點
- ✅ 減少對伺服器壓力
- ✅ 避免高峰時段被封鎖
- ✅ 提升成功率

### 3. 來源間固定延遲

#### 實施位置
- **檔案:** `scripts/crawlers/rss-news-crawler.ts`
- **延遲:** 2 秒

#### 實施方式
```typescript
// Add 2-second delay between sources
if (i > 0) {
  console.log('  ⏳ Waiting 2s before next source...');
  await sleep(2000);
}
```

#### 優點
- ✅ 遵守爬蟲禮儀
- ✅ 避免連續請求觸發限流
- ✅ 符合文檔建議

### 4. 專業 HTTP Headers

#### 已實施的 Headers
```typescript
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
'Accept': 'application/rss+xml, application/xml, text/xml, */*',
'Accept-Language': 'zh-HK,zh-TW;q=0.9,zh;q=0.8,en;q=0.7',
'Accept-Encoding': 'gzip, deflate, br',
'Cache-Control': 'no-cache',
'Pragma': 'no-cache',
'Referer': 'https://news.mingpao.com/',
```

#### 優點
- ✅ 模擬真實瀏覽器
- ✅ 支援繁體中文優先
- ✅ 減少被識別為機器人

---

## 📊 當前狀態

### RSS 來源測試結果 (2026-02-06)

| 來源 | URL | 狀態 | 備註 |
|------|-----|------|------|
| 明報即時新聞 | `ins/s00001.xml` | ✅ 成功 | 已抓取 23 篇文章 |
| 明報每日港聞 | `pns/s00002.xml` | ⚠️ 測試中 | 從 s00001 改為 s00002 |

### 成功率
- **目標:** 50%+ (1/2 來源可用)
- **當前:** 50% (1/2 來源確認可用)
- **改善空間:** 繼續測試港聞版 URL

---

## 🔧 技術架構

### 配置文件結構

```
packages/database/prisma/
  └── seed.ts                    # RSS 來源配置
  
apps/web/lib/services/
  ├── rss-parser.ts              # RSS 解析服務 + 時段感知延遲
  ├── keyword-filter.ts          # 關鍵字過濾服務
  └── data-sources/
      └── rss-news-adapter.ts    # RSS 數據適配器
      
scripts/crawlers/
  └── rss-news-crawler.ts        # RSS 爬蟲腳本 + 來源間延遲
```

### 資料流程

```
[Seed Config] → [RssSource Table] → [Crawler] → [RssParser] → [Adapter] → [PublicCase Table]
     ↓              ↓                   ↓           ↓            ↓              ↓
  URL配置      資料庫儲存        讀取配置    時段延遲    關鍵字過濾      儲存結果
```

---

## ⚠️ 已知限制與注意事項

### 明報每日版仍遇 403 錯誤

**可能原因：**
1. 明報伺服器的反爬蟲機制
2. 需要更多 cookie 或 session 處理
3. IP 可能被臨時限制

**建議解決方案：**
1. ✅ 已改用港聞版 URL (s00002.xml)
2. ⏳ 測試非繁忙時段抓取
3. 📋 考慮使用代理 IP
4. 📋 增加更長的重試延遲 (10-15 分鐘)

### RSS 來源維護

**定期檢查 (建議每週)：**
- [ ] 驗證 RSS URL 是否仍然有效
- [ ] 檢查新聞內容質量
- [ ] 更新關鍵字列表
- [ ] 審查過濾效果

---

## 📈 效能指標

### 目標指標
- **抓取成功率:** > 80%
- **關鍵字匹配率:** > 30%
- **重複率:** < 5%
- **平均回應時間:** < 5 秒/來源

### 當前指標
- **抓取成功率:** 50% (1/2 來源)
- **關鍵字匹配率:** 待測試
- **重複率:** 0% (首次運行)
- **平均回應時間:** ~3 秒/來源

---

## 🚀 下一步優化建議

### 短期 (1-2 週)

1. **測試港聞版 URL**
   - 驗證 s00002.xml 是否可用
   - 確認新聞內容相關性

2. **增加備用來源**
   - 參考文檔中的其他港聞來源
   - 測試 HK01、RTHK 等

3. **優化關鍵字**
   - 分析已抓取文章的關鍵字
   - 調整過濾規則提升相關性

### 中期 (1 個月)

1. **並發控制**
   - 實施優先級管理 (1-5 級)
   - 限制並發請求數 (1-3)

2. **錯誤處理增強**
   - 區分 403、404、超時等錯誤
   - 針對不同錯誤調整重試策略

3. **監控儀表板**
   - 創建 RSS 來源健康監控頁面
   - 實時顯示成功率和錯誤日誌

### 長期 (3 個月)

1. **智能排程**
   - 根據歷史數據調整抓取頻率
   - 自動避開高峰時段

2. **內容質量評分**
   - ML 模型評估新聞相關性
   - 自動過濾低質量內容

3. **多來源整合**
   - 擴展到 10+ RSS 來源
   - 去重和聚合相似新聞

---

## 📚 參考資源

### 官方文檔
- [港聞新聞源搜尋指南](./港聞新聞源到法律資訊搜尋方法及注意事項指南.md)
- [RSS 實施狀態](./RSS_IMPLEMENTATION_STATUS.md)

### 明報 RSS 端點
- 要聞版: `https://news.mingpao.com/rss/pns/s00001.xml`
- 港聞版: `https://news.mingpao.com/rss/pns/s00002.xml` ⭐ (推薦)
- 即時新聞: `https://news.mingpao.com/rss/ins/s00001.xml` ✅ (可用)

### 技術參考
- [RSS 2.0 規範](https://www.rssboard.org/rss-specification)
- [爬蟲禮儀最佳實踐](https://www.rssboard.org/rss-best-practices)
- [robots.txt 檢查](https://news.mingpao.com/robots.txt)

---

## 變更歷史

### v1.1 (2026-02-06)
- ✅ 更新明報每日版 URL (s00001 → s00002)
- ✅ 實施時段感知延遲系統
- ✅ 添加來源間 2 秒延遲
- ✅ 優化 HTTP Headers (中文語言支持)

### v1.0 (2026-01-30)
- ✅ 初始 RSS 系統實施
- ✅ 明報即時新聞成功整合
- ✅ 關鍵字過濾系統

---

**維護者：** Looper HQ 開發團隊  
**最後更新：** 2026-02-06
