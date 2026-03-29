# Legal System Feature Development - 使用指南

## 快速啟動

### 觸發技能

在GitHub Copilot Chat中輸入：

```
/legal-system-feature-dev plan
```

或描述你的需求：

```
我需要添加一個新的案件報告功能，包括數據庫模型、API和前端頁面
```

### 常見使用場景

| 場景 | 指令範例 |
|------|---------|
| 開發新功能 | `/legal-system-feature-dev implement` |
| 調整AI分類 | `/legal-system-feature-dev ai-tuning` |
| 建立新頁面 | `/legal-system-feature-dev page-build` |
| 數據庫變更 | `/legal-system-feature-dev db-migrate` |
| 生產部署 | `/legal-system-feature-dev deploy` |
| 診斷問題 | `/legal-system-feature-dev diagnose` |

## 工作流程摘要

### 1. 完整功能開發 (約2-4小時)

```mermaid
graph LR
    A[需求分析] --> B[Schema設計]
    B --> C[API實現]
    C --> D[前端頁面]
    D --> E[本地測試]
    E --> F[提交部署]
```

**步驟**:
1. 明確需求與數據模型
2. 修改Prisma schema
3. 建立API routes
4. 實現前端組件
5. 添加雙語文案
6. 本地測試驗證
7. 創建migration
8. 推送並部署

**關鍵文件**:
- `packages/database/prisma/schema.prisma`
- `apps/web/app/api/YOUR_FEATURE/route.ts`
- `apps/web/app/(dashboard)/YOUR_FEATURE/page.tsx`
- `apps/web/messages/zh.json`, `en.json`

### 2. AI分類調整 (約30-60分鐘)

```mermaid
graph LR
    A[診斷問題] --> B[調整Prompt]
    B --> C[測試分類]
    C --> D[批量重分類]
    D --> E[驗證改善]
```

**步驟**:
1. 運行診斷腳本檢查分類質量
2. 修改AI prompt或添加規則
3. 測試少量案例
4. 批量重分類低信心案例
5. 驗證準確度提升

**關鍵文件**:
- `apps/web/lib/ai/classifier.ts`
- `.github/skills/hk-legal-case-system/references/case-categories.md`

### 3. 前端頁面實施 (約1-2小時)

**步驟**:
1. 創建頁面路由 (`app/(dashboard)/YOUR_PAGE/page.tsx`)
2. 建立UI組件 (`components/YOUR_FEATURE/`)
3. 整合Premiere設計系統
4. 添加i18n文案
5. 更新導航

**設計系統**:
- 顏色: `premier-black`, `premier-gold`, `premier-mystery-*`
- 組件: `glass-card`, `premier-title-*`
- 按鈕: `variant="primary|secondary|mystery"`

### 4. 數據庫變更 (約30分鐘)

**步驟**:
1. 修改`schema.prisma`
2. 運行`pnpm db:push`（開發）
3. 創建migration（生產）
4. 更新Zod schemas
5. 測試並部署

**安全檢查**:
- [ ] 新欄位是否可選？
- [ ] 是否需要default值？
- [ ] 是否影響現有查詢？
- [ ] 是否需要數據遷移腳本？

## 命令速查

### 開發環境

```bash
# 啟動服務
pnpm dev                    # Web app (http://localhost:3005)
pnpm docker:up              # PostgreSQL, Redis, Keycloak

# 數據庫
pnpm db:push                # 同步schema (開發)
pnpm db:studio              # GUI管理工具
pnpm db:seed                # 測試數據

# 代碼檢查
pnpm lint                   # ESLint
pnpm type-check             # TypeScript
pnpm build                  # 構建驗證
```

### Prisma操作

```bash
# 生成client
pnpm --filter=@looper-hq/database prisma generate

# 創建migration (生產用)
cd packages/database
npx prisma migrate dev --name MIGRATION_NAME

# 應用migration (生產)
npx prisma migrate deploy

# 查看migration狀態
npx prisma migrate status
```

### 診斷工具

```bash
# 系統健康檢查
pnpm tsx .github/skills/hk-legal-case-system/scripts/diagnose.ts

# 數據完整性驗證
pnpm tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts

# 測試AI分類
pnpm tsx scripts/test-classifier.ts
```

## 常見任務範例

### 範例1: 添加「專家證人」欄位

```bash
# 1. 修改schema
code packages/database/prisma/schema.prisma
# 添加: expertWitness_zh String?, expertWitness_en String?

# 2. 生成client並同步
pnpm --filter=@looper-hq/database prisma generate
pnpm db:push

# 3. 更新Zod schema
code apps/web/lib/validations/schemas.ts
# 添加驗證規則

# 4. 更新API返回
# 在API route的include中添加新欄位

# 5. 更新UI顯示
# 在組件中添加顯示邏輯

# 6. 創建migration
cd packages/database
npx prisma migrate dev --name add_expert_witness_fields

# 7. 提交並部署
git add .
git commit -m "feat: Add expert witness fields"
git push origin main
```

### 範例2: 新增「環保訴訟」類別

```typescript
// 1. 更新分類器
// apps/web/lib/ai/classifier.ts

const CASE_CATEGORIES = [
  // ...existing
  {
    code: 'ENVIRONMENTAL',
    name_zh: '環保訴訟',
    name_en: 'Environmental Litigation',
    keywords: ['environment', 'pollution', '污染', '環保', 'waste', 'emission']
  }
]

// 2. 更新prompt
const prompt = `...新增環保訴訟類別說明...`

// 3. 測試分類
pnpm tsx scripts/test-classifier.ts test-cases.json

// 4. 批量重分類環保相關案件
pnpm tsx scripts/reclassify-environmental.ts

// 5. 提交
git commit -m "feat(ai): Add ENVIRONMENTAL case category"
```

### 範例3: 建立「案件統計」頁面

```bash
# 1. 創建API route
mkdir -p apps/web/app/api/case-statistics
touch apps/web/app/api/case-statistics/route.ts
# 實現統計邏輯

# 2. 創建頁面
mkdir -p apps/web/app/\(dashboard\)/case-statistics
touch apps/web/app/\(dashboard\)/case-statistics/page.tsx
# 實現頁面組件

# 3. 創建UI組件
mkdir -p apps/web/components/case-statistics
touch apps/web/components/case-statistics/StatisticsChart.tsx
# 實現圖表組件

# 4. 添加i18n
# 編輯 apps/web/messages/zh.json, en.json

# 5. 更新導航
code apps/web/components/layout/DashboardNav.tsx
# 添加菜單項

# 6. 測試
pnpm dev
# 訪問 http://localhost:3005/case-statistics

# 7. 提交
git add .
git commit -m "feat: Add case statistics dashboard page"
git push origin main
```

## 故障排除

### Prisma Client錯誤

```bash
# 症狀: Cannot find module '@prisma/client'
# 解決:
pnpm install --frozen-lockfile
pnpm --filter=@looper-hq/database prisma generate
```

### Docker端口衝突

```bash
# 症狀: port already in use
# 解決:
docker stop $(docker ps -q)
pnpm docker:up
```

### AI分類超時

```typescript
// 症狀: OpenAI timeout
// 解決: 增加timeout或換模型
const response = await fetch(url, {
  signal: AbortSignal.timeout(60000) // 60秒
})

// 或在.env中:
OPENAI_MODEL=gpt-4o-mini
```

### 生產部署失敗

```bash
# 檢查GitHub Actions日誌
# https://github.com/JonazWong/Looper-HQ/actions

# 檢查DO App Platform日誌
# https://cloud.digitalocean.com/apps

# 常見原因:
# - Migration失敗
# - 環境變數缺失
# - Build timeout
```

## 進階技巧

### 並行開發多個功能

```bash
# 使用feature branches
git checkout -b feature/case-reports
git checkout -b feature/billing-integration

# 獨立開發和測試
# 按優先級合併
```

### 優化AI成本

```typescript
// 1. 使用免費模型
OPENAI_MODEL=meta-llama/llama-3.1-8b-instruct:free

// 2. 前置規則檢查
if (title.includes('HKSAR v')) return 'CRIMINAL'

// 3. 緩存相同標題
const cached = await getCachedClassification(title)
if (cached) return cached
```

### 快速原型驗證

```bash
# 使用db:push跳過migration
pnpm db:push

# 快速迭代UI
pnpm dev

# 驗證可行後再創建正式migration
npx prisma migrate dev
```

## 相關資源

- [完整工作流程](./SKILL.md)
- [爬蟲維護技能](../hk-legal-case-system/SKILL.md)
- [專案架構](../../copilot-instructions.md)
- [快速參考](./QUICK_REFERENCE.md)

## 獲取幫助

在Copilot Chat中：

```
@workspace 我在開發案件報告功能時遇到問題，API返回500錯誤
```

或查看相關技能：

```
/hk-legal-case-system diagnose
```
