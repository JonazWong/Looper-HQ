---
name: legal-system-feature-dev
description: '香港法律案件管理系統完整開發生命週期。Use for: 完整功能開發（從需求到生產）、AI分類系統調整、前端頁面實施、數據庫schema變更、測試驗證、DO生產部署。涵蓋 Next.js全棧、Prisma ORM、OpenAI整合、Docker部署。Keywords: feature development, schema migration, AI classification, frontend pages, production deployment, full-stack workflow, 法律用詞標準化, 案情分析。'
argument-hint: '指定流程階段: plan|implement|test|deploy|ai-tuning|page-build|db-migrate'
---

# Looper HQ 法律系統全棧開發生命週期

## 系統架構概覽

**技術棧**:
- **前端**: Next.js 15 (App Router) + React 19 + TailwindCSS (Premier Design System)
- **後端**: Next.js API Routes + NextAuth.js v5
- **數據庫**: PostgreSQL 16 + Prisma ORM + pgvector
- **AI**: OpenAI/OpenRouter (GPT-4/Llama) 
- **部署**: Docker + Digital Ocean App Platform
- **監控**: GitHub Actions CI/CD

**核心領域**:
1. **爬蟲系統** - RSS, HKLII, 香港司法機構 DCL
2. **AI分類** - 自動分析案例類別、法院、關鍵詞
3. **雙語系統** - 繁體中文/英文並行
4. **案件管理** - 律所內部案件追蹤與時間計費

## 何時使用此技能

**完整功能開發** (從零到生產):
- 開發新的法律服務功能（如新案件類型、新報告）
- 添加新的公開案件搜尋面向
- 整合新的外部API或數據源

**AI分類系統調整**:
- 新增法律類別（如「環保訴訟」、「數據隱私」）
- 調整分類prompt以提升準確度
- 處理特定法院或案件類型的誤判

**前端頁面實施**:
- 建立新的儀表板頁面
- 實現複雜表單與驗證
- 整合Premier黑金設計系統

**數據庫變更**:
- 添加新模型或欄位
- 建立資料關聯
- 執行數據遷移

**生產部署**:
- 推送到GitHub並觸發DO部署
- 驗證生產環境功能
- 回滾錯誤部署

---

## 工作流程 1: 完整功能開發 (需求 → 生產)

**使用場景**: 從頭開始開發一個完整的新功能模組

### 階段 1: 需求分析與規劃

1. **明確需求與範圍**
   ```bash
   # 創建功能規格文件
   mkdir -p docs/features
   touch docs/features/FEATURE_NAME_spec.md
   ```

   **必須定義**:
   - 用戶角色與權限（ADMIN, LAWYER, CLIENT, STAFF）
   - 數據模型（Prisma schema）
   - API端點（GET/POST/PUT/DELETE）
   - UI頁面與導航
   - 雙語內容需求（`_zh`, `_en`欄位）

2. **檢查依賴與衝突**
   ```bash
   # 檢查現有schema
   code packages/database/prisma/schema.prisma
   
   # 檢查現有API routes
   ls apps/web/app/api/
   
   # 檢查現有頁面
   ls apps/web/app/\(dashboard\)/
   ```

3. **建立開發分支**
   ```bash
   git checkout -b feature/FEATURE_NAME
   ```

### 階段 2: 數據庫Schema設計

1. **修改Prisma Schema**
   ```prisma
   // packages/database/prisma/schema.prisma
   
   model NewFeature {
     id        String   @id @default(cuid())
     title_zh  String   // 雙語欄位必備
     title_en  String
     content   Json?    // 複雜資料用JSON
     firmId    String   // 多租戶隔離
     userId    String   // 建立者
     
     firm      Firm     @relation(fields: [firmId], references: [id])
     user      User     @relation(fields: [userId], references: [id])
     
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
     
     @@index([firmId])
     @@index([userId])
   }
   ```

2. **生成並測試Schema**
   ```bash
   # 生成Prisma Client
   pnpm --filter=@looper-hq/database prisma generate
   
   # 同步到本地數據庫（開發環境）
   pnpm db:push
   
   # 檢查結果
   pnpm db:studio
   ```

3. **建立Zod驗證Schema**
   ```typescript
   // apps/web/lib/validations/schemas.ts
   
   export const newFeatureSchema = z.object({
     title_zh: z.string().min(1).max(200),
     title_en: z.string().min(1).max(200),
     content: z.any().optional(),
     firmId: z.string().cuid(),
   })
   
   export type NewFeatureInput = z.infer<typeof newFeatureSchema>
   ```

### 階段 3: API Routes實現

1. **建立API路由**
   ```typescript
   // apps/web/app/api/new-features/route.ts
   
   import { NextRequest } from 'next/server'
   import { prisma } from '@/lib/db'
   import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response'
   import { handleApiError } from '@/lib/api/errors'
   import { requireAuth, requireRole } from '@/lib/api/auth'
   import { newFeatureSchema } from '@/lib/validations/schemas'
   
   export async function GET(request: NextRequest) {
     try {
       const session = await requireAuth()
       const { searchParams } = request.nextUrl
       
       const features = await prisma.newFeature.findMany({
         where: { firmId: session.user.firmId },
         include: {
           user: { select: { name: true, email: true } }
         },
         orderBy: { createdAt: 'desc' }
       })
       
       return successResponse(features)
     } catch (error) {
       const { message, statusCode, code, details } = handleApiError(error)
       return errorResponse(message, statusCode, code, details)
     }
   }
   
   export async function POST(request: NextRequest) {
     try {
       const session = await requireRole('ADMIN', 'LAWYER')
       const body = await request.json()
       
       const validation = newFeatureSchema.safeParse(body)
       if (!validation.success) {
         return validationErrorResponse(validation.error.format())
       }
       
       const feature = await prisma.newFeature.create({
         data: {
           ...validation.data,
           userId: session.user.id,
           firmId: session.user.firmId
         }
       })
       
       // 記錄活動日誌
       await prisma.activity.create({
         data: {
           action: 'CREATE_NEW_FEATURE',
           userId: session.user.id,
           firmId: session.user.firmId,
           entityType: 'NewFeature',
           entityId: feature.id,
           metadata: { title: feature.title_zh }
         }
       })
       
       return successResponse(feature, undefined, 201)
     } catch (error) {
       const { message, statusCode, code, details } = handleApiError(error)
       return errorResponse(message, statusCode, code, details)
     }
   }
   ```

2. **測試API端點**
   ```bash
   # 啟動開發服務器
   pnpm dev
   
   # 使用Thunder Client or curl測試
   curl -X GET http://localhost:3005/api/new-features \
     -H "Cookie: next-auth.session-token=YOUR_TOKEN"
   ```

### 階段 4: 前端頁面實現

1. **建立頁面路由**
   ```typescript
   // apps/web/app/(dashboard)/new-features/page.tsx
   
   import { Metadata } from 'next'
   import { getTranslations } from 'next-intl/server'
   import NewFeaturesList from '@/components/new-features/NewFeaturesList'
   
   export async function generateMetadata({ 
     params: { locale } 
   }: { 
     params: { locale: string } 
   }): Promise<Metadata> {
     const t = await getTranslations({ locale, namespace: 'newFeatures' })
     return {
       title: t('pageTitle'),
       description: t('pageDescription')
     }
   }
   
   export default function NewFeaturesPage() {
     return (
       <div className="container mx-auto py-8">
         <NewFeaturesList />
       </div>
     )
   }
   ```

2. **建立UI組件**
   ```typescript
   // components/new-features/NewFeaturesList.tsx
   
   'use client'
   
   import { useState, useEffect } from 'react'
   import { useTranslations } from 'next-intl'
   import { Button } from '@/components/ui/button'
   import { Card } from '@/components/ui/card'
   
   export default function NewFeaturesList() {
     const t = useTranslations('newFeatures')
     const [features, setFeatures] = useState([])
     const [loading, setLoading] = useState(true)
     
     useEffect(() => {
       fetchFeatures()
     }, [])
     
     async function fetchFeatures() {
       const res = await fetch('/api/new-features')
       const data = await res.json()
       if (data.success) {
         setFeatures(data.data)
       }
       setLoading(false)
     }
     
     return (
       <div className="space-y-4">
         <div className="flex justify-between items-center">
           <h1 className="premier-title-xl">{t('title')}</h1>
           <Button variant="primary">{t('create')}</Button>
         </div>
         
         {loading ? (
           <div>Loading...</div>
         ) : (
           <div className="grid gap-4">
             {features.map((feature: any) => (
               <Card key={feature.id} className="glass-card p-6">
                 <h3>{feature.title_zh}</h3>
                 <p>{feature.title_en}</p>
               </Card>
             ))}
           </div>
         )}
       </div>
     )
   }
   ```

3. **添加國際化文案**
   ```json
   // apps/web/messages/zh.json
   {
     "newFeatures": {
       "title": "新功能管理",
       "pageTitle": "新功能 | Looper HQ",
       "create": "建立新功能"
     }
   }
   
   // apps/web/messages/en.json
   {
     "newFeatures": {
       "title": "New Features",
       "pageTitle": "New Features | Looper HQ",
       "create": "Create Feature"
     }
   }
   ```

4. **整合導航**
   ```typescript
   // components/layout/DashboardNav.tsx
   
   const navItems = [
     // ...existing items
     {
       name: t('nav.newFeatures'),
       href: '/new-features',
       icon: <SparklesIcon className="w-5 h-5" />
     }
   ]
   ```

### 階段 5: 本地測試與驗證

1. **功能測試清單**
   ```bash
   # ✅ 數據庫operations
   # ✅ API權限檢查（未登入應返回401）
   # ✅ 多租戶隔離（不能看到其他firm的數據）
   # ✅ 雙語顯示正確切換
   # ✅ 表單驗證錯誤提示
   # ✅ Premier設計系統一致性
   ```

2. **類型檢查與Lint**
   ```bash
   pnpm lint
   pnpm --filter=@looper-hq/web type-check
   ```

3. **檢查錯誤日誌**
   ```bash
   # 檢查Chrome DevTools Console
   # 檢查Terminal輸出
   # 檢查Next.js Error Overlay
   ```

### 階段 6: 提交與部署

1. **準備Migration（生產環境用）**
   ```bash
   # 在開發環境建立migration
   cd packages/database
   npx prisma migrate dev --name add_new_feature_model
   
   # 檢查生成的migration文件
   ls prisma/migrations/
   ```

2. **提交代碼**
   ```bash
   git add .
   git commit -m "feat: Add new feature module
   
   - Add NewFeature model to Prisma schema
   - Implement /api/new-features endpoints (GET, POST)
   - Create new-features dashboard page
   - Add bilingual UI components
   - Include activity logging"
   
   git push origin feature/FEATURE_NAME
   ```

3. **創建Pull Request**
   ```bash
   # 在GitHub上創建PR
   # 標題: feat: Add new feature module
   # 描述包含:
   # - 功能說明
   # - 截圖/GIF演示
   # - 測試checklist
   # - Migration notes
   ```

4. **合併到main並部署**
   ```bash
   # PR被批准後
   git checkout main
   git pull origin main
   git merge feature/FEATURE_NAME
   git push origin main
   
   # GitHub Actions自動觸發DO部署
   # 監控: https://github.com/JonazWong/Looper-HQ/actions
   ```

5. **驗證生產環境**
   ```bash
   # 等待5-10分鐘部署完成
   # 檢查DO App Platform日誌
   # 訪問 https://your-domain.com/new-features
   # 測試核心功能
   # 檢查數據庫migration是否成功
   ```

---

## 工作流程 2: AI分類系統調整

**使用場景**: 優化OpenAI/OpenRouter的案件自動分類邏輯

### 問題診斷

1. **檢查分類統計**
   ```typescript
   // 執行診斷腳本
   pnpm tsx .github/skills/hk-legal-case-system/scripts/diagnose.ts
   
   // 查看特定來源的分類分布
   pnpm tsx .github/skills/hk-legal-case-system/scripts/diagnose.ts --source=HKLII
   ```

2. **常見問題類型**
   - **類別錯誤**: 案件被分配到錯誤類別（如刑事案件誤判為民事）
   - **信心度低**: `confidence < 0.6`，AI不確定分類
   - **遺漏類別**: 新興案件類型未被識別（如「加密貨幣糾紛」）
   - **法院錯誤**: 無法正確識別法院名稱

### 調整Prompt

1. **定位分類代碼**
   ```typescript
   // apps/web/lib/ai/classifier.ts
   
   export async function classifyLegalCase(caseData: {
     title: string
     summary?: string
     source: string
   }) {
     const prompt = `你是一位香港法律案例分類專家...`
   }
   ```

2. **Prompt優化策略**

   **A. 添加新類別**
   ```typescript
   const CASE_CATEGORIES = [
     // ...existing categories
     {
       code: 'CRYPTO',
       name_zh: '加密貨幣糾紛',
       name_en: 'Cryptocurrency Disputes',
       keywords: ['bitcoin', 'cryptocurrency', 'NFT', 'blockchain', '虛擬資產', '比特幣']
     }
   ]
   ```

   **B. 改進Few-shot Examples**
   ```typescript
   const prompt = `
   # 分類範例
   
   ## 範例1: 民事 - 合約糾紛
   標題: "HCCT 123/2023 ABC Co. v. XYZ Ltd."
   摘要: "原告指被告違反供應合約，拖欠貨款$500,000"
   分類: CIVIL - CONTRACT
   信心度: 0.95
   
   ## 範例2: 刑事 - 詐騙
   標題: "HKSAR v. Chan Tai Man"
   摘要: "被告涉嫌以虛假投資計劃詐騙八名受害者共$2,000,000"
   分類: CRIMINAL - FRAUD
   信心度: 0.98
   
   現在分類以下案件:
   標題: ${caseData.title}
   摘要: ${caseData.summary}
   `
   ```

   **C. 添加領域特定規則**
   ```typescript
   // 前置規則檢查（減少API調用成本）
   function preClassify(title: string): string | null {
     if (title.includes('HKSAR v') || title.includes('香港特別行政區 訴')) {
       return 'CRIMINAL'
     }
     if (title.includes('婚姻訴訟') || title.includes('Matrimonial')) {
       return 'FAMILY'
     }
     if (title.includes('遺囑') || title.includes('Estate')) {
       return 'PROBATE'
     }
     return null // 需要AI判斷
   }
   ```

3. **測試新Prompt**
   ```bash
   # 建立測試案例文件
   cat > test-cases.json << EOF
   [
     {
       "title": "HCCT 456/2024 Crypto Exchange Ltd v. Customer A",
       "summary": "原告指被告在加密貨幣交易中違約",
       "expected": "CIVIL"
     }
   ]
   EOF
   
   # 運行分類測試
   pnpm tsx scripts/test-classifier.ts test-cases.json
   ```

### 批量重新分類

1. **識別需要重分類的案件**
   ```sql
   -- 信心度低的案件
   SELECT id, title_zh, category, confidence 
   FROM "PublicCase" 
   WHERE confidence < 0.6 
   LIMIT 100;
   
   -- 未分類的新案件
   SELECT id, title_zh 
   FROM "PublicCase" 
   WHERE category IS NULL OR category = 'UNKNOWN'
   LIMIT 100;
   ```

2. **執行批量重分類**
   ```typescript
   // scripts/reclassify-cases.ts
   
   import { prisma } from '@looper-hq/database'
   import { classifyLegalCase } from '../apps/web/lib/ai/classifier'
   
   async function reclassifyLowConfidence() {
     const cases = await prisma.publicCase.findMany({
       where: { confidence: { lt: 0.6 } },
       take: 100
     })
     
     for (const case of cases) {
       const result = await classifyLegalCase({
         title: case.title_zh || case.title_en,
         summary: case.description_zh,
         source: case.source
       })
       
       await prisma.publicCase.update({
         where: { id: case.id },
         data: {
           category: result.category,
           subcategory: result.subcategory,
           court: result.court,
           confidence: result.confidence
         }
       })
       
       console.log(`✅ Reclassified: ${case.title_zh} -> ${result.category}`)
     }
   }
   
   reclassifyLowConfidence()
   ```

3. **驗證結果**
   ```bash
   pnpm tsx scripts/reclassify-cases.ts
   
   # 再次運行診斷檢查改善
   pnpm tsx .github/skills/hk-legal-case-system/scripts/diagnose.ts
   ```

### 成本優化

1. **使用更便宜的模型**
   ```env
   # .env
   OPENAI_MODEL=meta-llama/llama-3.1-8b-instruct:free  # OpenRouter免費模型
   # or
   OPENAI_MODEL=gpt-4o-mini  # OpenAI便宜快速模型
   ```

2. **實施緩存策略**
   ```typescript
   // 相同標題不重複分類
   const cached = await prisma.publicCase.findFirst({
     where: { 
       title_zh: caseData.title,
       confidence: { gte: 0.8 }
     },
     select: { category, subcategory, court, confidence }
   })
   
   if (cached) return cached
   ```

---

## 工作流程 3: 數據庫Schema遷移

**使用場景**: 修改Prisma schema並安全部署到生產環境

### Schema變更檢查清單

**修改前必須確認**:
- [ ] 新欄位是否必填？（`String` vs `String?`）
- [ ] 是否需要default值？
- [ ] 是否影響現有API？
- [ ] 是否需要數據遷移腳本？
- [ ] 雙語欄位是否成對添加？（`title_zh`, `title_en`）

### 開發環境Schema修改

1. **修改schema.prisma**
   ```prisma
   model PublicCase {
     // ...existing fields
     
     // 新增欄位
     caseYear      Int?           // 案件年份
     判決結果_zh    String?        // 中文判決結果  
     judgmentResult_en String?    // 英文判決結果
     relatedCases  String[]       // 相關案件ID陣列
     
     @@index([caseYear])
   }
   ```

2. **生成並測試**
   ```bash
   pnpm --filter=@looper-hq/database prisma generate
   pnpm db:push  # 開發環境用，不生成migration
   ```

3. **更新Zod Schema**
   ```typescript
   // apps/web/lib/validations/schemas.ts
   
   export const publicCaseSchema = publicCaseSchema.extend({
     caseYear: z.number().int().min(1900).max(2100).optional(),
     判決結果_zh: z.string().max(500).optional(),
     judgmentResult_en: z.string().max(500).optional(),
     relatedCases: z.array(z.string()).optional()
   })
   ```

4. **更新TypeScript類型**
   ```typescript
   // packages/types/src/index.ts
   
   export interface PublicCaseWithJudgment extends PublicCase {
     判決結果_zh?: string
     judgmentResult_en?: string
     relatedCases: string[]
   }
   ```

### 生產環境Migration

1. **創建Migration**
   ```bash
   cd packages/database
   npx prisma migrate dev --name add_judgment_fields
   
   # 檢查生成的SQL
   cat prisma/migrations/20240329120000_add_judgment_fields/migration.sql
   ```

2. **Migration文件範例**
   ```sql
   -- AlterTable
   ALTER TABLE "PublicCase" ADD COLUMN "caseYear" INTEGER;
   ALTER TABLE "PublicCase" ADD COLUMN "判決結果_zh" TEXT;
   ALTER TABLE "PublicCase" ADD COLUMN "judgmentResult_en" TEXT;
   ALTER TABLE "PublicCase" ADD COLUMN "relatedCases" TEXT[];
   
   -- CreateIndex
   CREATE INDEX "PublicCase_caseYear_idx" ON "PublicCase"("caseYear");
   ```

3. **測試Migration回滾**
   ```bash
   # 應用migration
   npx prisma migrate deploy
   
   # 如需回滾（謹慎！）
   # 手動編寫down migration
   psql -h localhost -p 5433 -U postgres -d looper_hq -c "
   ALTER TABLE \"PublicCase\" DROP COLUMN \"caseYear\";
   ALTER TABLE \"PublicCase\" DROP COLUMN \"判決結果_zh\";
   ALTER TABLE \"PublicCase\" DROP COLUMN \"judgmentResult_en\";
   ALTER TABLE \"PublicCase\" DROP COLUMN \"relatedCases\";
   "
   ```

### 數據遷移腳本

**場景**: 需要填充新欄位的歷史數據

```typescript
// scripts/migrations/populate-case-year.ts

import { prisma } from '@looper-hq/database'

async function populateCaseYear() {
  const cases = await prisma.publicCase.findMany({
    where: { caseYear: null },
    select: { id: true, title_zh: true, title_en: true, publishedDate: true }
  })
  
  for (const c of cases) {
    // 從標題提取年份: "HCCT 123/2024"
    const yearMatch = (c.title_zh || c.title_en).match(/\/(\d{4})/)
    const year = yearMatch 
      ? parseInt(yearMatch[1]) 
      : c.publishedDate?.getFullYear()
    
    if (year) {
      await prisma.publicCase.update({
        where: { id: c.id },
        data: { caseYear: year }
      })
      console.log(`Updated ${c.id}: year=${year}`)
    }
  }
}

populateCaseYear().then(() => console.log('✅ Done'))
```

### 部署到生產

1. **提交Migration**
   ```bash
   git add packages/database/prisma/
   git commit -m "feat(db): Add judgment result and case year fields"
   git push origin main
   ```

2. **DO部署流程**
   ```yaml
   # .do/app.yaml 已配置自動migration
   
   jobs:
   - name: db-migrate
     kind: PRE_DEPLOY
     run_command: |
       cd packages/database
       npx prisma migrate deploy
   ```

3. **監控部署**
   ```bash
   # GitHub Actions日誌
   # DO App Platform "Activity" tab
   # 檢查migration是否成功
   ```

4. **驗證生產**
   ```bash
   # 通過DO Console連接資料庫
   # 或使用API測試新欄位
   curl https://your-domain.com/api/public-cases/CASE_ID
   ```

---

## 工作流程 4: 生產問題快速修復

**使用場景**: 生產環境發現Bug，需要緊急修復並部署

### Hotfix流程

1. **創建Hotfix分支**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/ISSUE_DESCRIPTION
   ```

2. **定位問題**
   ```bash
   # 檢查DO日誌
   # 檢查Prisma Studio production DB
   # 檢查Sentry error tracking (如已配置)
   ```

3. **最小化修復**
   ```typescript
   // 只修改必要的檔案
   // 避免大規模重構
   // 添加防禦性檢查
   
   // 範例: API null check
   if (!user || !user.firmId) {
     return errorResponse('Invalid user session', 401)
   }
   ```

4. **本地驗證**
   ```bash
   pnpm dev
   # 測試修復的路徑
   # 確保未破壞其他功能
   ```

5. **快速部署**
   ```bash
   git add .
   git commit -m "fix: Critical bug in FEATURE_NAME
   
   - Add null check for user.firmId
   - Prevent 500 error on /api/endpoint
   
   Fixes #ISSUE_NUMBER"
   
   git push origin hotfix/ISSUE_DESCRIPTION
   
   # 創建PR並立即合併（跳過長時間review）
   gh pr create --title "Hotfix: ISSUE_DESCRIPTION" --body "Critical production fix"
   gh pr merge --squash --delete-branch
   ```

6. **監控修復**
   ```bash
   # 等待部署完成
   # 驗證修復有效
   # 通知團隊
   ```

---

## 參考資源

### 代碼庫關鍵路徑

**API Routes**: `apps/web/app/api/`
**頁面組件**: `apps/web/app/(dashboard)/`
**UI組件**: `apps/web/components/ui/`
**Prisma Schema**: `packages/database/prisma/schema.prisma`
**Schema驗證**: `apps/web/lib/validations/schemas.ts`
**AI分類器**: `apps/web/lib/ai/classifier.ts`
**爬蟲腳本**: `scripts/crawlers/`

### 常用命令

```bash
# 開發
pnpm dev                  # 啟動web app (port 3005)
pnpm dev:all             # 啟動所有apps
pnpm docker:up           # 啟動Docker服務

# 數據庫
pnpm db:push             # 同步schema (dev)
pnpm db:migrate          # 創建migration (prod)
pnpm db:studio           # 打開Prisma Studio
pnpm db:seed             # 填充測試數據

# Prisma
pnpm --filter=@looper-hq/database prisma generate
pnpm --filter=@looper-hq/database prisma db push

# 檢查
pnpm lint                # ESLint
pnpm type-check          # TypeScript檢查
pnpm build               # 構建檢查

# 診斷
pnpm tsx .github/skills/hk-legal-case-system/scripts/diagnose.ts
pnpm tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts
```

### 相關文件

- [專案架構](.github/copilot-instructions.md)
- [爬蟲維護技能](.github/skills/hk-legal-case-system/SKILL.md)
- [API設計規範](docs/ARCHITECTURE.md)
- [部署指南](docs/deployment-guide.md)
- [Premier設計系統](apps/web/tailwind.config.ts)

### 外部資源

- [Next.js 15 文檔](https://nextjs.org/docs)
- [Prisma 最佳實踐](https://www.prisma.io/docs/guides)
- [OpenAI API參考](https://platform.openai.com/docs)
- [Digital Ocean 部署](https://docs.digitalocean.com/products/app-platform/)

---

## 常見問題排查

### 問題: Prisma Client未生成

**症狀**: `Cannot find module '@prisma/client'`

**解決**:
```bash
pnpm install --frozen-lockfile
pnpm --filter=@looper-hq/database prisma generate
```

### 問題: Docker端口衝突

**症狀**: `port 5433 already in use`

**解決**:
```bash
# 檢查佔用端口的進程
docker ps | grep 5433
netstat -ano | findstr :5433

# 停止衝突容器
docker stop looper-hq-db
# 或修改.env中的POSTGRES_PORT
```

### 問題: Migration失敗

**症狀**: `Migration failed to apply`

**解決**:
```bash
# 檢查migration狀態
npx prisma migrate status

# 標記失敗的migration為已應用（謹慎！）
npx prisma migrate resolve --applied "20240329_migration_name"

# 或回滾數據庫後重試
```

### 問題: AI分類超時

**症狀**: `OpenAI API timeout`

**解決**:
```typescript
// 增加timeout時間
const response = await fetch(OPENAI_URL, {
  signal: AbortSignal.timeout(60000) // 60秒
})

// 或使用更快的模型
OPENAI_MODEL=gpt-4o-mini
```

### 問題: 生產環境白屏

**症狀**: 頁面加載後顯示空白

**解決**:
```bash
# 檢查DO日誌中的JavaScript錯誤
# 檢查環境變數是否正確設置
# 檢查build是否成功
# 檢查NEXTAUTH_URL是否正確

# 常見原因: 缺少NEXTAUTH_SECRET
```

---

## 最佳實踐

### 代碼品質
- ✅ 所有API route必須使用`requireAuth()`
- ✅ 所有用戶輸入必須經過Zod驗證
- ✅ 數據庫查詢必須include多租戶過濾(`firmId`)
- ✅ 錯誤處理使用統一的`handleApiError()`
- ✅ 雙語內容成對添加(`_zh`, `_en`)

### 性能優化
- ✅ 數據庫查詢使用`select`限制返回欄位
- ✅ 列表頁面實現分頁（page, perPage）
- ✅ 添加合適的索引(`@@index`)
- ✅ AI分類結果緩存，避免重複調用
- ✅ 使用Next.js `loading.tsx`提升用戶體驗

### 安全性
- ✅ API routes檢查用戶權限
- ✅ 敏感環境變數不提交到Git
- ✅ SQL注入防護（Prisma自動處理）
- ✅ XSS防護（React自動escape）
- ✅ CSRF保護（NextAuth自動處理）

### 部署安全
- ✅ 生產環境使用`prisma migrate deploy`，不要用`db:push`
- ✅ 部署前測試migration在staging環境
- ✅ 保持`.env`與`.env.example`同步
- ✅ 使用語義化版本號commit message
- ✅ 重要變更添加PR描述與截圖

---

## 完成檢查清單

**Feature開發完成標準**:
- [ ] Prisma schema已更新並生成
- [ ] Zod驗證schema已添加
- [ ] API routes實現GET/POST/PUT/DELETE
- [ ] 前端頁面與組件實現
- [ ] 雙語文案已添加（zh.json, en.json）
- [ ] 導航已更新
- [ ] 權限檢查已實施
- [ ] 本地測試通過
- [ ] TypeScript無錯誤
- [ ] ESLint無警告
- [ ] Migration已創建（如需）
- [ ] 代碼已提交並推送
- [ ] PR已創建並描述完整
- [ ] 生產環境驗證通過

