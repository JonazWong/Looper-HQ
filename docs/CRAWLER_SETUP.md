# 香港法律案件自動爬蟲系統

## 📊 現狀檢查

檢查爬蟲是否已抓取到資料：

```bash
pnpm crawler:check
```

這會顯示：
- ✅ 各來源的案件數量 (RSS、司法機構)
- 📅 最近24小時新增案件
- 📡 RSS來源狀態
- 📝 最新5筆案件

## 🚀 手動執行爬蟲

### 1. 執行所有爬蟲 (司法機構 + RSS)
```bash
pnpm crawler:all
```

### 2. 僅執行司法機構爬蟲
```bash
pnpm crawler:judiciary
```

### 3. 僅執行RSS新聞爬蟲
```bash
pnpm crawler:rss
```

## ⏰ 自動執行時間表

### 司法機構爬蟲
- **時間**: 每天 4:00 AM HKT (20:00 UTC)
- **來源**: 香港司法機構網站
- **功能**:
  - ✅ 抓取上訴法庭判決書
  - ✅ 抓取高等法院判決書
  - ✅ AI自動分類案件類型
  - ✅ 提取法官、當事人、判決日期
  - ✅ 中英雙語支持

### RSS新聞爬蟲
- **時間**: 每天 4:30 AM HKT (20:30 UTC)
- **來源**: 
  - SCMP (南華早報)
  - RTHK (香港電台)
  - 其他RSS來源
- **功能**:
  - ✅ 關鍵字過濾
  - ✅ 去重機制
  - ✅ 自動重試
  - ✅ AI分類

## 🤖 AI分類功能

每個抓取的案件會自動使用AI進行分類：

```typescript
{
  category: 'CIVIL' | 'CRIMINAL' | 'PROPERTY' | 'EMPLOYMENT' | 'FAMILY' | 'CORPORATE',
  court: '法院名稱',
  judge: '法官姓名',
  parties: ['當事人1', '當事人2'],
  judgmentDate: Date,
  summary: '案件摘要',
  keywords: ['關鍵字1', '關鍵字2']
}
```

## 📁 案件數據結構

所有案件儲存在 `PublicCase` 模型：

```prisma
model PublicCase {
  source      CaseSource       // HK_JUDICIARY, SCMP_RSS, RTHK_RSS
  externalId  String           // 唯一識別碼
  caseNumber  String?          // 案件編號 (例: HCAL 123/2024)
  
  // 雙語欄位
  title_zh       String
  title_en       String
  description_zh String?
  description_en String?
  
  category    CaseCategory?    // CIVIL, CRIMINAL, etc.
  court       String?          // 法院名稱
  judge       String?          // 法官姓名
  judgmentDate DateTime?       // 判決日期
  
  keywords    String[]         // 關鍵字
  tags        String[]         // 標籤
  
  crawledAt   DateTime         // 爬取時間
  updatedAt   DateTime         // 更新時間
}
```

## 🔍 查詢案件範例

```typescript
// 查詢最新司法判決
const judgments = await prisma.publicCase.findMany({
  where: {
    source: 'HK_JUDICIARY'
  },
  orderBy: {
    crawledAt: 'desc'
  },
  take: 10
});

// 按關鍵字搜尋
const cases = await prisma.publicCase.findMany({
  where: {
    keywords: {
      has: '刑事'
    }
  }
});

// 按案件編號查詢
const case = await prisma.publicCase.findFirst({
  where: {
    caseNumber: 'HCAL 123/2024'
  }
});
```

## 📊 監控與日誌

### GitHub Actions 監控
- 每次執行會產生workflow日誌
- 失敗會自動建立Issue
- 可在 Actions tab 查看執行歷史

### 本地日誌
爬蟲執行時會輸出：
```
📜 開始抓取香港司法機構案件...
======================================================================
  📜 抓取上訴法庭判決書...
    ✓ 獲取 15 個上訴法庭案件
  ⚖️  抓取高等法院判決書...
    ✓ 獲取 23 個高等法院案件
  
  📊 共獲取 38 個判決，開始儲存...

  [1/38] CACV 123/2024
    🤖 AI 分類: A v B (刑事上訴)...
    ✓ 已新增
  ...

======================================================================
📊 爬蟲統計:
   獲取: 38 個案件
   新增: 32 個
   更新: 6 個
   略過: 0 個
   錯誤: 0 個
======================================================================
```

## 🛠️ 故障排查

### 問題: 沒有抓到資料

```bash
# 1. 檢查數據庫連接
pnpm --filter=@looper-hq/database prisma studio

# 2. 手動執行爬蟲看錯誤訊息
pnpm crawler:judiciary

# 3. 檢查RSS來源狀態
pnpm crawler:check
```

### 問題: AI分類失敗

確保環境變數設置正確：
```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://openrouter.ai/api/v1
```

### 問題: 爬蟲太慢

- 司法機構爬蟲預設2秒延遲 (遵守robots.txt)
- AI分類每個案件間隔500ms
- 這是正常的，避免對伺服器造成壓力

## 🔧 配置選項

### 調整爬蟲頻率

編輯 `.github/workflows/daily-case-tracking.yml`:
```yaml
schedule:
  # 每天 4:00 AM HKT (20:00 UTC)
  - cron: '0 20 * * *'
```

### 調整爬蟲延遲

編輯 `scripts/crawlers/hk-judiciary-crawler.ts`:
```typescript
private readonly delayMs = 2000; // 改為 3000 = 3秒延遲
```

### 添加更多法院

在 `hk-judiciary-crawler.ts` 的 `crawl()` 方法添加：
```typescript
const allJudgments = [
  ...(await this.scrapeCourtOfAppeal()),
  ...(await this.scrapeHighCourt()),
  ...(await this.scrapeDistrictCourt()),  // 新增
  ...(await this.scrapeMagistratesCourt()), // 新增
];
```

## 📚 相關文檔

- [完整實現指南](./香港司法機構案件數據自動抓取系統%20-%20完整實現指南.md) - 31KB詳細文檔
- [快速設置指南](./香港司法案件爬蟲%20-%20快速設置指南%20(30%20分鐘啟動).md) - 30分鐘上手

## ✅ 完成檢查清單

- [x] 司法機構爬蟲已實現
- [x] RSS新聞爬蟲已運作
- [x] AI分類功能已整合
- [x] 雙語支持 (中英)
- [x] 自動去重機制
- [x] GitHub Actions 定時執行 (每天4AM HKT)
- [x] 錯誤處理與重試
- [x] 資料檢查腳本
- [x] 監控與告警

---

**版本**: v1.0  
**最後更新**: 2026-02-15  
**自動執行**: ✅ 已啟用 (每天 4:00 AM HKT)
