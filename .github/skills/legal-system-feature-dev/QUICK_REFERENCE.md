# Legal System Feature Dev - 快速參考卡

## 一鍵命令

```bash
# 🚀 啟動開發環境
pnpm dev && pnpm docker:up

# 🗄️ 數據庫操作
pnpm db:push              # 同步schema (開發)
pnpm db:migrate           # 創建migration (生產)
pnpm db:studio            # GUI工具
pnpm db:seed              # 測試數據

# ✅ 代碼檢查
pnpm lint && pnpm type-check && pnpm build

# 🔍 診斷工具
pnpm tsx .github/skills/hk-legal-case-system/scripts/diagnose.ts
```

## 標準開發流程

### 1. 新功能 (2-4小時)

```
1. Schema → prisma/schema.prisma
2. Generate → pnpm db:push
3. API → app/api/FEATURE/route.ts
4. Page → app/(dashboard)/FEATURE/page.tsx
5. i18n → messages/zh.json, en.json
6. Test → localhost:3005
7. Migration → prisma migrate dev
8. Deploy → git push origin main
```

### 2. AI調整 (30-60分鐘)

```
1. Diagnose → diagnose.ts
2. Edit → lib/ai/classifier.ts
3. Test → test-classifier.ts
4. Reclassify → reclassify-cases.ts
5. Verify → diagnose.ts (再次檢查)
6. Deploy → git push
```

### 3. 前端頁面 (1-2小時)

```
1. Page → app/(dashboard)/FEATURE/page.tsx
2. Component → components/FEATURE/Component.tsx
3. Styles → Tailwind + Premier Design
4. i18n → messages/zh.json, en.json
5. Nav → components/layout/DashboardNav.tsx
6. Test → localhost:3005
7. Deploy → git push
```

### 4. DB變更 (30分鐘)

```
1. Schema → schema.prisma
2. Generate → prisma generate
3. Push → pnpm db:push
4. Validation → lib/validations/schemas.ts
5. Migration → prisma migrate dev
6. Test → Prisma Studio
7. Deploy → git push
```

## 關鍵文件路徑

```
📦 packages/database/
  └─ prisma/schema.prisma           # 數據模型

📦 apps/web/
  ├─ app/
  │  ├─ api/                         # API routes
  │  └─ (dashboard)/                 # 頁面
  ├─ components/
  │  ├─ ui/                          # UI組件
  │  └─ FEATURE/                     # 功能組件
  ├─ lib/
  │  ├─ ai/classifier.ts             # AI分類
  │  ├─ db.ts                        # DB client
  │  └─ validations/schemas.ts       # Zod驗證
  └─ messages/
     ├─ zh.json                      # 中文文案
     └─ en.json                      # 英文文案

📦 scripts/
  └─ crawlers/                       # 爬蟲腳本
```

## API Route模板

```typescript
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response'
import { handleApiError } from '@/lib/api/errors'
import { requireAuth, requireRole } from '@/lib/api/auth'
import { yourSchema } from '@/lib/validations/schemas'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    
    const data = await prisma.yourModel.findMany({
      where: { firmId: session.user.firmId },
      include: { /* relations */ },
      orderBy: { createdAt: 'desc' }
    })
    
    return successResponse(data)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('ADMIN', 'LAWYER')
    const body = await request.json()
    
    const validation = yourSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error.format())
    }
    
    const result = await prisma.yourModel.create({
      data: {
        ...validation.data,
        userId: session.user.id,
        firmId: session.user.firmId
      }
    })
    
    return successResponse(result, undefined, 201)
  } catch (error) {
    const { message, statusCode, code, details } = handleApiError(error)
    return errorResponse(message, statusCode, code, details)
  }
}
```

## Page組件模板

```typescript
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import YourComponent from '@/components/your-feature/YourComponent'

export async function generateMetadata({ 
  params: { locale } 
}: { 
  params: { locale: string } 
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'yourFeature' })
  return {
    title: t('pageTitle'),
    description: t('pageDescription')
  }
}

export default function YourFeaturePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="premier-title-xl mb-6">
        {/* Title */}
      </h1>
      <YourComponent />
    </div>
  )
}
```

## Prisma Schema模板

```prisma
model YourModel {
  id          String   @id @default(cuid())
  title_zh    String   // 雙語必備
  title_en    String
  description String?
  
  // 多租戶
  firmId      String
  firm        Firm     @relation(fields: [firmId], references: [id])
  
  // 建立者
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([firmId])
  @@index([userId])
  @@map("your_table_name")
}
```

## Premier設計組件

### 顏色方案

```tsx
// 黑金主題
className="bg-premier-black text-premier-gold"
className="bg-premier-gold text-premier-black"

// Glass卡片
className="glass-card p-6"

// 漸變背景
className="bg-gradient-to-r from-premier-gold to-premier-gold-rose"

// 神秘紫調
className="bg-premier-mystery-violet"
className="text-premier-mystery-purple"
```

### 排版樣式

```tsx
// 標題
className="premier-title-xl"      // 大標題
className="premier-title-lg"      // 次標題
className="premier-title-md"      // 段落標題

// 文字
className="premier-text-base"     // 正文
className="premier-text-sm"       // 小字
className="text-premier-pearl"    // 珍珠白文字
```

### 按鈕樣式

```tsx
<Button variant="primary">主要操作</Button>
<Button variant="secondary">次要操作</Button>
<Button variant="mystery">神秘主題</Button>
<Button variant="outline">外框按鈕</Button>
<Button variant="ghost">透明按鈕</Button>
```

## 常見問題速查

### Prisma

```bash
# ❌ Module '@prisma/client' not found
pnpm --filter=@looper-hq/database prisma generate

# ❌ Migration conflict
npx prisma migrate resolve --applied "migration_name"

# ❌ Database connection refused
pnpm docker:up && sleep 10
```

### AI分類

```typescript
// ❌ Timeout
signal: AbortSignal.timeout(60000)

// ❌ Low quality
// 改進prompt, 添加few-shot examples

// ❌ High cost
OPENAI_MODEL=gpt-4o-mini  // 或免費model
```

### 部署

```bash
# ❌ Build failed
pnpm build  # 本地檢查錯誤

# ❌ Migration failed
# 檢查DO logs, 手動執行migration

# ❌ 500 errors
# 檢查環境變數, NEXTAUTH_SECRET etc.
```

## Zod驗證模式

```typescript
// 基本字串
z.string().min(1).max(200)

// 可選字串
z.string().optional()

// Email
z.string().email()

// 數字範圍
z.number().int().min(0).max(100)

// 日期
z.date()
z.string().datetime()  // ISO string

// 枚舉
z.enum(['CRIMINAL', 'CIVIL', 'FAMILY'])

// 陣列
z.array(z.string())

// 物件
z.object({
  name: z.string(),
  age: z.number()
})

// 雙語對
z.object({
  title_zh: z.string().min(1),
  title_en: z.string().min(1)
})
```

## Git Commit規範

```bash
# 格式
<type>(<scope>): <subject>

# 類型
feat:     新功能
fix:      Bug修復
docs:     文檔
style:    格式
refactor: 重構
test:     測試
chore:    雜項

# 範例
feat(api): Add case statistics endpoint
fix(ai): Improve classification accuracy
docs: Update deployment guide
```

## 環境變數

```env
# 必須
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3005

# 可選
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
KEYCLOAK_CLIENT_ID=...
```

## 測試檢查清單

```
功能開發完成檢查:
□ Schema生成成功
□ API返回正確數據
□ 前端顯示正常
□ 雙語切換有效
□ 權限檢查通過
□ 多租戶隔離正確
□ 錯誤處理完善
□ TypeScript無錯誤
□ ESLint無警告
□ 本地測試通過
□ Migration已創建
□ PR描述完整
□ 生產驗證通過
```

## 緊急修復流程

```bash
# 1. Hotfix分支
git checkout -b hotfix/ISSUE

# 2. 最小化修復
# 只改必要文件

# 3. 快速驗證
pnpm dev  # 測試修復

# 4. 立即部署
git commit -m "fix: Critical ISSUE"
git push origin hotfix/ISSUE
gh pr create --title "Hotfix: ISSUE"
gh pr merge --squash

# 5. 監控
# 檢查DO logs確認修復
```

## 聯絡資源

- **爬蟲問題**: `/hk-legal-case-system diagnose`
- **架構問題**: `@workspace 查看 copilot-instructions.md`
- **部署問題**: 查看 `docs/deployment-guide.md`
- **設計系統**: 查看 `apps/web/tailwind.config.ts`
