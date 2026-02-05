# 港聞新聞源到法律資訊搜尋方法及注意事項指南

**專為香港律師行業設計的資訊整合系統**

作者：天賜  
日期：2026-01-30

---

## 📋 目錄

1. [港聞 RSS 新聞源清單](#1-港聞-rss-新聞源清單)
2. [法律資訊獲取方法](#2-法律資訊獲取方法)
3. [資料庫架構設計](#3-資料庫架構設計)
4. [搜尋系統實作](#4-搜尋系統實作)
5. [法律合規注意事項](#5-法律合規注意事項)
6. [系統維護與優化](#6-系統維護與優化)
7. [快速開始指南](#7-快速開始指南)

---

## 1. 港聞 RSS 新聞源清單

### 1.1 主要港聞新聞源

| 媒體 | RSS URL | 更新頻率 |
|------|---------|----------|
| 明報 | https://news.mingpao.com/rss/pns/s00002.xml | 每日 |
| 明報即時 | https://news.mingpao.com/rss/ins/s00001.xml | 即時 |

### 1.2 獲取頻率建議

- **即時新聞源**：每 10-15 分鐘
- **每日新聞源**：每 1-2 小時
- **非繁忙時段**：每 30 分鐘

### 1.3 注意事項

⚠️ **重要提醒：**

1. **遵守 robots.txt**：檢查各網站的爬蟲政策
2. **設定延遲**：每次請求間隔至少 1-2 秒
3. **User-Agent**：設定合理的識別標籤
4. **錯誤處理**：實作重試機制和錯誤日誌
5. **去重機制**：使用文章 ID 或 URL hash 避免重複

---

## 2. 法律資訊獲取方法

### 2.1 每日聆訊表

#### 資料來源

**司法機構官網：** https://www.judiciary.hk/

**主要法院：**
- 終審法院 (CFA)
- 高等法院上訴法庭 (CA)
- 高等法院原訟法庭 (CFI)
- 區域法院 (DC)
- 裁判法院 (MC)
- 死因裁判法庭

#### 案件編號格式

```
FACV 123/2025  - 終審法院民事
FACC 123/2025  - 終審法院刑事
CACV 123/2025  - 上訴法庭民事
CACC 123/2025  - 上訴法庭刑事
HCAL 123/2025  - 高院民事上訴
HCA 123/2025   - 高院民事訴訟
HCAJ 123/2025  - 高院司法覆核
HCMP 123/2025  - 高院雜項案件
DCCC 123/2025  - 區院刑事
DCCJ 123/2025  - 區院民事
```

### 2.2 判案書獲取

#### 資料來源優先級

**1. HKLII (香港法律資訊研究所)**
- URL: https://www.hklii.hk/
- 優點：免費、完整、搜尋功能強
- 更新：通常在判決後 1-2 週

**2. 司法機構 Legal Reference System**
- URL: https://legalref.judiciary.hk/
- 優點：官方、最權威
- 缺點：需處理 JavaScript

**3. 各級法院網站**
- 終審法院：https://www.hkcfa.hk/
- 直接發布重要判決

### 2.3 法律改革文件

#### 監控來源

**1. 法律改革委員會**
- URL: https://www.hkreform.gov.hk/
- 文件類型：諮詢文件、研究報告、建議書
- 檢查頻率：每週

**2. 律政司**
- URL: https://www.doj.gov.hk/
- 文件類型：法律草案、政策文件、法律意見
- 檢查頻率：每週

**3. 立法會**
- URL: https://www.legco.gov.hk/
- 文件類型：法案委員會文件、會議紀錄
- 檢查頻率：每日（會期內）

---

## 3. 資料庫架構設計

### 3.1 PostgreSQL Schema

#### 新聞文章表

```sql
CREATE TABLE news_articles (
    id SERIAL PRIMARY KEY,
    article_id VARCHAR(255) UNIQUE NOT NULL,
    source VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT '港聞',
    title TEXT NOT NULL,
    content TEXT,
    summary TEXT,
    author VARCHAR(100),
    published_date TIMESTAMP,
    url TEXT,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 建立索引
CREATE INDEX idx_news_published ON news_articles(published_date DESC);
CREATE INDEX idx_news_source ON news_articles(source);
CREATE INDEX idx_news_tags ON news_articles USING GIN(tags);

-- 全文搜尋索引
CREATE INDEX idx_news_fulltext ON news_articles 
    USING gin(to_tsvector('chinese', title || ' ' || COALESCE(content, '')));
```

#### 聆訊表

```sql
CREATE TABLE court_hearings (
    id SERIAL PRIMARY KEY,
    hearing_date DATE NOT NULL,
    court VARCHAR(100) NOT NULL,
    court_room VARCHAR(50),
    case_number VARCHAR(100) NOT NULL,
    case_type VARCHAR(100),
    parties TEXT,
    hearing_time TIME,
    judge VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(case_number, hearing_date, hearing_time)
);

-- 建立索引
CREATE INDEX idx_hearings_date ON court_hearings(hearing_date DESC);
CREATE INDEX idx_hearings_case ON court_hearings(case_number);
CREATE INDEX idx_hearings_court ON court_hearings(court);
```

#### 判案書表

```sql
CREATE TABLE judgments (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(100) UNIQUE NOT NULL,
    case_name TEXT NOT NULL,
    court VARCHAR(100) NOT NULL,
    judges TEXT[],
    date_of_judgment DATE,
    date_of_hearing DATE,
    neutral_citation VARCHAR(100),
    subject_matter TEXT[],
    summary TEXT,
    full_text TEXT,
    full_text_url TEXT,
    pdf_url TEXT,
    language VARCHAR(20) DEFAULT 'zh',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 建立索引
CREATE INDEX idx_judgments_date ON judgments(date_of_judgment DESC);
CREATE INDEX idx_judgments_case ON judgments(case_number);
CREATE INDEX idx_judgments_court ON judgments(court);
CREATE INDEX idx_judgments_subject ON judgments USING GIN(subject_matter);
```

---

## 4. 搜尋系統實作

### 4.1 搜尋功能需求

#### 基本搜尋
- 關鍵字搜尋（中英文）
- 日期範圍篩選
- 來源篩選
- 分類篩選

#### 進階搜尋
- 布林運算（AND, OR, NOT）
- 短語搜尋（"exact phrase"）
- 模糊搜尋
- 相關性排序

#### 法律專業搜尋
- 案件編號精確搜尋
- 法官姓名搜尋
- 法律主題分類
- 引用案例搜尋

### 4.2 API 端點設計

```
GET  /api/news/search          - 搜尋港聞
GET  /api/news/recent          - 最近港聞
GET  /api/hearings/today       - 今日聆訊
GET  /api/hearings/search      - 搜尋聆訊
GET  /api/judgments/search     - 搜尋判案書
GET  /api/judgments/case/{num} - 按案件編號查詢
GET  /api/reforms/recent       - 最近法律改革文件
```

---

## 5. 法律合規注意事項

### 5.1 版權問題

#### 允許使用

✅ **個人/機構內部使用**
- 律師行內部研究
- 案件準備工作
- 法律研究

✅ **非商業研究用途**
- 學術研究
- 法律分析
- 政策研究

✅ **合理引用**
- 註明出處
- 適當引用範圍
- 保留原始連結

#### 禁止行為

❌ **大量轉載全文**
- 不得完整複製新聞內容
- 不得大規模轉載判案書

❌ **商業化再發布**
- 不得用於商業出版
- 不得收費提供內容

❌ **移除來源標示**
- 必須保留原始來源
- 必須保留作者資訊

### 5.2 個人資料保護

#### 《個人資料(私隱)條例》考量

**六項資料保障原則：**

1. **收集目的及方式** - 只收集必要資料，以合法公平方式收集
2. **資料準確性** - 確保資料準確完整，定期更新資料
3. **使用資料** - 限於收集目的，不得作其他用途
4. **資料保安** - 適當保安措施，防止未經授權存取
5. **資訊透明** - 告知收集目的，提供查閱途徑
6. **資料存取** - 允許查閱個人資料，允許更正錯誤資料

#### 敏感案件處理

需匿名處理的案件類型：
- 家事案件
- 性罪行案件
- 青少年案件
- 精神健康案件

### 5.3 網站爬蟲合規

#### 爬蟲禮儀

- 設定合理的請求間隔（建議 1-3 秒）
- 設定 User-Agent 識別
- 遵守 robots.txt 規則
- 避免高峰時段大量請求

#### 請求限制建議

| 時段 | 請求間隔 | 並發數 |
|------|----------|--------|
| 繁忙時段 (09:00-18:00) | 3-5 秒 | 1 |
| 非繁忙時段 (18:00-09:00) | 1-3 秒 | 2 |
| 深夜時段 (00:00-06:00) | 1-2 秒 | 3 |

---

## 6. 系統維護與優化

### 6.1 每日維護任務

**每日凌晨 2:00 執行：**

1. 獲取最新 RSS 新聞
2. 獲取今日聆訊表
3. 檢查新判案書
4. 資料品質檢查
5. 清理暫存檔案
6. 備份資料庫

### 6.2 效能優化

#### 資料庫優化

```sql
-- 定期清理舊資料
DELETE FROM news_articles 
WHERE published_date < NOW() - INTERVAL '3 years';

-- 重建索引
REINDEX TABLE news_articles;

-- 更新統計資訊
ANALYZE news_articles;

-- 清理死行
VACUUM FULL news_articles;
```

#### 快取策略

- Redis 快取熱門搜尋結果（30分鐘）
- 今日聆訊表快取（6小時）
- 最新判案書列表快取（1小時）

### 6.3 監控指標

**系統健康監控：**
- RSS 獲取成功率
- 爬蟲執行時間
- 資料庫大小
- 搜尋延遲

**資料品質監控：**
- 重複文章數量
- 缺失欄位比例
- 過時資料數量

---

## 7. 快速開始指南

### 7.1 環境設置

#### 系統需求
```
Python 3.8+
PostgreSQL 13+
Redis 6+
Chrome/ChromeDriver
```

#### 安裝依賴
```bash
pip install feedparser requests beautifulsoup4
pip install selenium psycopg2-binary redis
pip install fastapi uvicorn schedule
```

### 7.2 資料庫初始化

```bash
# 創建資料庫
createdb legal_research

# 執行 schema
psql legal_research < database_schema.sql
```

### 7.3 啟動系統

```bash
# 啟動 RSS 獲取服務
python rss_fetcher.py &

# 啟動聆訊表爬蟲（每日執行）
python court_scraper.py &

# 啟動判案書爬蟲（每週執行）
python judgment_scraper.py &

# 啟動 API 服務
uvicorn search_api:app --host 0.0.0.0 --port 8000
```

### 7.4 測試 API

```bash
# 搜尋港聞
curl "http://localhost:8000/api/news/search?q=法律改革"

# 獲取今日聆訊
curl "http://localhost:8000/api/hearings/today"

# 搜尋判案書
curl "http://localhost:8000/api/judgments/search?keywords=合約"
```

---

## 附錄 A：案件編號對照表

| 代碼 | 法院 | 案件類型 |
|------|------|----------|
| FACV | 終審法院 | 民事上訴 |
| FACC | 終審法院 | 刑事上訴 |
| CACV | 上訴法庭 | 民事上訴 |
| CACC | 上訴法庭 | 刑事上訴 |
| HCAL | 高等法院 | 民事上訴 |
| HCA | 高等法院 | 民事訴訟 |
| HCAJ | 高等法院 | 司法覆核 |
| HCMP | 高等法院 | 雜項案件 |
| DCCC | 區域法院 | 刑事案件 |
| DCCJ | 區域法院 | 民事案件 |

---

## 附錄 B：常見問題

**Q1: RSS feed 無法獲取怎麼辦？**  
A: 檢查網絡連接、URL 是否正確、是否被封鎖。實作重試機制。

**Q2: 如何處理中文編碼問題？**  
A: 統一使用 UTF-8 編碼，設定 `response.encoding = 'utf-8'`。

**Q3: 資料庫太大怎麼辦？**  
A: 定期歸檔舊資料（超過2-3年），使用分區表。

**Q4: 搜尋速度慢怎麼辦？**  
A: 建立全文索引、使用 Elasticsearch、實作快取機制。

**Q5: 如何確保資料準確性？**  
A: 多來源交叉驗證、定期人工抽查、實作資料品質監控。

---

## 附錄 C：參考資源

**官方網站：**
- 司法機構：https://www.judiciary.hk/
- HKLII：https://www.hklii.hk/
- 法律改革委員會：https://www.hkreform.gov.hk/
- 律政司：https://www.doj.gov.hk/
- 立法會：https://www.legco.gov.hk/

**技術文檔：**
- Python feedparser：https://pythonhosted.org/feedparser/
- Selenium：https://www.selenium.dev/documentation/
- PostgreSQL 全文搜尋：https://www.postgresql.org/docs/current/textsearch.html
- FastAPI：https://fastapi.tiangolo.com/

---

## 結語

本指南提供了完整的港聞新聞源到法律資訊搜尋系統的實作方法。系統設計遵循以下原則：

✅ **積極主動**：自動化資料獲取和更新  
✅ **嚴謹專業**：完整的錯誤處理和資料驗證  
✅ **合規合法**：遵守版權和私隱法規  
✅ **高效實用**：優化搜尋效能和用戶體驗  

**重要提醒：**
- 定期檢查和更新 RSS 源
- 監控系統運行狀態
- 保持資料庫優化
- 遵守法律合規要求

---

**文件版本：** 1.0  
**最後更新：** 2026-01-30  
**作者：** 天賜  
**適用對象：** 香港律師行業 Paralegal 及法律資訊專業人員
