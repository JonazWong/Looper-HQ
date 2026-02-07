# Looper HQ - 系統接管與優化計劃

**接管日期**: 2026-02-06  
**管理者**: AI Development Assistant  
**系統版本**: v1.0.0 (待優化)

---

## 🎯 系統演化歷程

```
HK-Legal-Case-Agency (v1.0)
│
├─ 公開案件搜尋器
├─ 智能案件編號連結
├─ RSS 新聞追蹤
└─ 多租戶隔離
      │
      ▼
    合併 + 擴展
      │
      ▼
Looper HQ (v1.0)
│
├─ 完整案件管理系統
├─ 客戶管理 (CRM)
├─ 時間記錄與帳單
├─ 文件管理
└─ 多公司支援 (Monorepo)
```

---

## 📊 功能對比分析

### ✅ HK-Legal-Case-Agency 優勢功能

| 功能 | AGENCY | Looper HQ | 狀態 | 優先級 |
|------|---------|-----------|------|--------|
| **智能案件編號連結** | ✅ 自動識別 50+ 格式 | ❌ 未實作 | 🔴 缺失 | 🔥 P0 |
| **HKLII 自動連結** | ✅ 自動生成判決連結 | ❌ 未實作 | 🔴 缺失 | 🔥 P0 |
| **案件號碼解析器** | ✅ Regex + 元數據提取 | ❌ 未實作 | 🔴 缺失 | 🔥 P0 |
| **React 自動連結組件** | ✅ CaseNumberLink, AutoLinkText | ❌ 未實作 | 🔴 缺失 | 🔥 P0 |
| **擴展式案件詳情** | ✅ 可展開查看完整內容 | ⚠️ 基礎功能 | 🟡 待強化 | P1 |
| **案件交叉引用** | ✅ 自動發現相關案件 | ❌ 未實作 | 🔴 缺失 | P2 |
| **RSS 狀態監控** | ✅ 詳細錯誤追蹤 | ⚠️ 基礎功能 | 🟡 待強化 | P1 |
| **清晰的文檔系統** | ✅ 完整指南 + 測試 | ⚠️ 基礎文檔 | 🟡 待補充 | P2 |

### ✅ Looper HQ 優勢功能

| 功能 | AGENCY | Looper HQ | 狀態 | 備註 |
|------|---------|-----------|------|------|
| **Monorepo 架構** | ❌ 單體應用 | ✅ Turborepo | ✅ 優勢 | 更好的擴展性 |
| **完整案件管理** | ⚠️ 僅公開案件 | ✅ 完整 CRUD | ✅ 優勢 | 包含時間記錄、文件 |
| **客戶管理 (CRM)** | ❌ 未實作 | ✅ 完整功能 | ✅ 優勢 | 聯絡人、歷史記錄 |
| **帳單系統** | ❌ 未實作 | ✅ Invoice 管理 | ✅ 優勢 | 自動計費 |
| **時間追蹤** | ❌ 未實作 | ✅ TimeLog + Entry | ✅ 優勢 | 精確計費 |
| **文件管理** | ⚠️ 基礎功能 | ✅ 完整 DMS | ✅ 優勢 | 版本控制、權限 |
| **多公司支援** | ✅ firmId 隔離 | ✅ Membership 模型 | ✅ 平手 | 兩者都優秀 |
| **Premier UI 設計** | ❌ 基礎 UI | ✅ 黑金主題 | ✅ 優勢 | 專業視覺效果 |

### 🔴 共同弱點（需要優化）

| 問題 | AGENCY | Looper HQ | 解決方案 |
|------|---------|-----------|---------|
| **RSS 來源不穩定** | 2/11 可用 | 1/4 可用 | 實作 Judiciary 爬蟲 |
| **缺乏 AI 分類** | ❌ 簡單關鍵字 | ❌ 簡單關鍵字 | 整合 GPT-4o-mini |
| **全文搜尋效能** | ⚠️ LIKE 查詢 | ⚠️ LIKE 查詢 | PostgreSQL tsvector |
| **數據去重機制** | ⚠️ 基於時間戳 | ⚠️ 基於 ID | 內容雜湊 + 相似度 |
| **沒有公開搜尋頁** | ✅ 有 | ❌ **缺失** | 從 AGENCY 遷移 |

---

## 🚀 整合優化計劃

### Phase 1: 核心功能遷移（本週）

#### 🔥 P0 - 智能案件連結系統

**目標**: 將 AGENCY 的案件編號自動連結功能整合到 Looper HQ

**步驟**:

1. **遷移核心解析器**
   ```bash
   # 複製並適配
   AGENCY/lib/case-linking/case-number-parser.ts
     → Looper-HQ/apps/web/lib/case-linking/case-number-parser.ts
   
   # 包含:
   - extractCaseNumbers() - 50+ 格式支援
   - generateHKLIILink() - 自動生成判決連結
   - generateJudiciaryLink() - 司法機構搜尋
   - COURT_CODE_MAP - 完整法院代碼映射
   ```

2. **遷移 React 組件**
   ```bash
   AGENCY/lib/case-linking/use-case-linking.tsx
     → Looper-HQ/apps/web/lib/case-linking/use-case-linking.tsx
   
   # 組件:
   - CaseNumberLink - 單個案件連結
   - AutoLinkText - 自動識別並連結文本中所有案件號碼
   - CaseLinksList - 顯示所有相關案件清單
   ```

3. **整合到 PublicCase 顯示**
   ```typescript
   // apps/web/components/public-cases/case-card.tsx (新建)
   import { AutoLinkText, CaseLinksList } from '@/lib/case-linking/use-case-linking';
   
   export function PublicCaseCard({ publicCase }: Props) {
     return (
       <Card>
         <h3><AutoLinkText text={publicCase.title} /></h3>
         <p><AutoLinkText text={publicCase.description} /></p>
         
         {/* 顯示所有引用的案件 */}
         <CaseLinksList text={`${publicCase.title} ${publicCase.description}`} />
       </Card>
     );
   }
   ```

4. **TrackingEngine 自動提取**
   ```typescript
   // scripts/crawlers/rss-news-crawler.ts 中已有基礎架構
   // 需要整合 AGENCY 的 enhancePublicCaseWithCaseNumber()
   
   import { extractCaseNumbers, generateCaseLinks } from '@/lib/case-linking/case-number-parser';
   
   // 在存儲前自動提取
   const caseNumbers = extractCaseNumbers(`${title} ${content}`);
   if (caseNumbers.length > 0) {
     caseData.caseNumber = caseNumbers[0].fullNumber;
     caseData.sourceUrl = caseNumbers[0].links.hklii || sourceUrl;
   }
   ```

**預期成果**:
- ✅ 所有 PublicCase 標題/內容中的案件編號自動變成可點擊連結
- ✅ 點擊直接跳轉 HKLII 判決書或司法機構搜尋
- ✅ 自動顯示所有相關案件清單
- ✅ RSS 抓取時自動提取案件編號

---

#### 🔥 P0 - 公開案件搜尋頁面

**目標**: 為 Looper HQ 添加公開案件搜尋功能（類似 AGENCY）

**步驟**:

1. **建立路由與頁面**
   ```bash
   mkdir -p apps/web/app/(public)/search
   touch apps/web/app/(public)/search/page.tsx
   ```

2. **API 端點**
   ```typescript
   // apps/web/app/api/public-cases/route.ts
   // 已存在基礎架構，需加強:
   
   - 全文搜尋 (title + description)
   - 日期範圍篩選
   - 來源篩選 (SCMP, Judiciary...)
   - 案件編號搜尋
   - 分頁 (page, limit)
   ```

3. **搜尋 UI 組件**
   ```typescript
   // 參考 AGENCY 的設計
   apps/web/components/search/
   ├── search-bar.tsx - 搜尋輸入框
   ├── filter-panel.tsx - 篩選器（日期、來源、分類）
   ├── case-results.tsx - 搜尋結果列表
   └── expandable-case-row.tsx - 可展開的案件詳情
   ```

4. **整合智能連結**
   ```typescript
   // 在搜尋結果中使用 AutoLinkText
   {results.map(c => (
     <ExpandableCaseRow key={c.id}>
       <h3><AutoLinkText text={c.title} /></h3>
       <p><AutoLinkText text={c.description} /></p>
       {expanded && <CaseLinksList text={c.description} />}
     </ExpandableCaseRow>
   ))}
   ```

**預期成果**:
- ✅ 公開搜尋頁面 `/search` 可訪問
- ✅ 實時搜尋與篩選
- ✅ 案件編號自動連結
- ✅ 可展開查看完整內容

---

### Phase 2: RSS 追蹤系統優化（2 週內）

#### 🟡 P1 - Judiciary 真實爬蟲

**目標**: 替換 mock 資料，抓取真實法院案件

**技術方案**:
```bash
# 使用 Puppeteer 處理動態網站
pnpm add puppeteer

# 新建 Judiciary 爬蟲
scripts/crawlers/hk-judiciary-crawler.ts
```

**實作重點**:
- 使用無頭瀏覽器訪問 judiciary.hk
- 抓取每日案件列表
- 解析案件詳情（編號、日期、法官、裁決）
- 整合案件編號解析器自動連結

---

#### 🟡 P1 - AI 智能分類

**目標**: 使用 GPT-4o-mini 提升案件分類準確度

**實作**:
```typescript
// apps/web/lib/services/ai-classifier.ts
import OpenAI from 'openai';

export async function classifyCase(title: string, content: string) {
  const prompt = `
    分析以下香港法律新聞，分類為:
    CIVIL, CRIMINAL, CORPORATE, FAMILY, PROPERTY, LABOUR, OTHER
    
    標題: ${title}
    內容: ${content.slice(0, 500)}
    
    只回答類別名稱。
  `;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }]
  });
  
  return parseCategory(response.choices[0].message.content);
}
```

**整合點**:
- RSS 爬蟲存儲前自動分類
- 公開搜尋頁面可按分類篩選
- 儀表板統計各分類案件數量

---

### Phase 3: 數據品質提升（1 個月）

#### 🟢 P2 - 案件去重與相似度檢測

**目標**: 避免重複案件，識別相關案件

**方案 A: 內容雜湊**
```typescript
import crypto from 'crypto';

function generateContentHash(title: string, url: string) {
  return crypto
    .createHash('sha256')
    .update(`${title.trim()}|${url.trim()}`)
    .digest('hex');
}

// 使用雜湊作為 externalId
externalId: `${source}-${generateContentHash(title, link)}`
```

**方案 B: 相似度檢測**
```typescript
// 參考 AGENCY 的 assessTextSimilarity
function findSimilarCases(newCase: PublicCase) {
  // TF-IDF 或 Levenshtein Distance
  // threshold > 0.8 視為重複
}
```

---

#### 🟢 P2 - 全文搜尋優化

**目標**: PostgreSQL tsvector 加速搜尋

**實作**:
```sql
-- 添加搜尋向量欄位
ALTER TABLE public_cases 
ADD COLUMN search_vector tsvector;

-- 自動更新觸發器
CREATE TRIGGER update_search_vector 
BEFORE INSERT OR UPDATE ON public_cases
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', title, description);

-- GIN 索引
CREATE INDEX idx_search_vector 
ON public_cases USING GIN(search_vector);
```

**Prisma 整合**:
```typescript
const results = await prisma.$queryRaw`
  SELECT * FROM public_cases
  WHERE search_vector @@ to_tsquery('english', ${searchTerm})
  ORDER BY ts_rank(search_vector, to_tsquery('english', ${searchTerm})) DESC
  LIMIT 20
`;
```

---

## 📋 實施時間表

### Week 1 (2026-02-06 ~ 02-13)
- [x] ✅ RSS 系統修復與優化（已完成）
- [ ] 🔥 遷移智能案件連結系統
- [ ] 🔥 建立公開搜尋頁面
- [ ] 📝 更新 Copilot Instructions

### Week 2 (2026-02-13 ~ 02-20)
- [ ] 🟡 Judiciary 真實爬蟲
- [ ] 🟡 AI 智能分類整合
- [ ] 🟡 RSS 健康監控儀表板
- [ ] 📝 系統整合測試

### Week 3-4 (2026-02-20 ~ 03-06)
- [ ] 🟢 案件去重與相似度
- [ ] 🟢 全文搜尋優化
- [ ] 🟢 案件交叉引用功能
- [ ] 📝 完整文檔系統

---

## 🎯 成功指標

### 短期目標 (2 週)
- ✅ 智能案件連結覆蓋率 > 80%
- ✅ 公開搜尋頁面上線
- ✅ Judiciary 真實數據 > 50 筆/天
- ✅ AI 分類準確率 > 85%

### 中期目標 (1 個月)
- ✅ RSS 來源成功率 > 60%
- ✅ 案件重複率 < 5%
- ✅ 搜尋響應時間 < 500ms
- ✅ 每日新增案件 50-100 筆

### 長期目標 (3 個月)
- ✅ 完整案件網絡圖譜
- ✅ 判例引用分析
- ✅ 法官裁決趨勢分析
- ✅ 用戶訂閱通知系統

---

## 🛡️ 品質保證

### 代碼標準
- **TypeScript 嚴格模式**: 所有新代碼必須通過 type check
- **Zod 驗證**: 所有 API 輸入驗證
- **Prisma 類型安全**: 避免原始 SQL（除全文搜尋）
- **React Hook Form**: 表單處理統一標準

### 測試策略
- **單元測試**: 案件編號解析器 100% 覆蓋
- **整合測試**: API 端點 E2E 測試
- **手動測試**: UI/UX 逐頁驗證

### 文檔要求
- **代碼註釋**: 複雜邏輯必須有說明
- **API 文檔**: Swagger/OpenAPI 規格
- **用戶指南**: 每個新功能附使用說明
- **開發文檔**: 架構決策記錄 (ADR)

---

## 🔗 參考資源

### HK-Legal-Case-Agency 核心功能
- 📄 `lib/case-linking/case-number-parser.ts` - 案件編號解析器
- 📄 `lib/case-linking/use-case-linking.tsx` - React 自動連結組件
- 📄 `lib/case-linking/case-indexer.ts` - 案件索引與交叉引用
- 📄 `app/(dashboard)/public-search/page.tsx` - 公開搜尋頁面
- 📄 `lib/tracking/engine.ts` - TrackingEngine 自動提取

### Looper HQ 現有架構
- 📄 `packages/database/prisma/schema.prisma` - 資料模型
- 📄 `apps/web/lib/services/data-sources/` - 數據源適配器
- 📄 `scripts/crawlers/` - 爬蟲腳本
- 📄 `.github/copilot-instructions.md` - 開發指南

---

## 💬 管理承諾

作為 Looper HQ 的管理者，我承諾:

✅ **嚴格遵守 Pre-Change Analysis 原則**
- 每次修改前完整影響評估
- 保護現有功能完整性
- 追求卓越而非速度

✅ **持續優化與改進**
- 整合 AGENCY 的優勢功能
- 保持 Looper HQ 的專業設計
- 建立統一的開發標準

✅ **完整的文檔與追蹤**
- 每個功能都有清晰文檔
- 所有變更記錄在案
- 定期狀態報告

✅ **用戶價值優先**
- 功能必須解決實際問題
- 性能與體驗並重
- 安全與隱私保護

---

**管理開始日期**: 2026-02-06  
**第一個里程碑**: 智能案件連結系統上線 (2026-02-13)  
**下次檢討**: 2026-02-20

**讓我們打造香港最專業的法律案件管理平台！** 🚀
