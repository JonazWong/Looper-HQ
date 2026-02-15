# Digital Ocean App Platform 部署故障排查指南

本文檔提供了在 Digital Ocean App Platform 部署 Looper HQ 時的常見問題排查方法。

## 📋 目錄

1. [部署前檢查清單](#部署前檢查清單)
2. [常見錯誤及解決方法](#常見錯誤及解決方法)
3. [調試工具和命令](#調試工具和命令)
4. [環境變數配置](#環境變數配置)
5. [聯繫支援](#聯繫支援)

---

## 部署前檢查清單

在開始部署之前，請確保完成以下檢查：

### ✅ 本地驗證

```bash
# 1. 運行驗證腳本
./scripts/validate-deployment.sh

# 2. 本地構建 Docker 映像
docker build -t looper-hq-test .

# 3. 本地運行測試
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="test-secret" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  looper-hq-test

# 4. 測試健康檢查
curl http://localhost:3000/api/health
```

### ✅ Digital Ocean 配置

- [ ] DATABASE_URL 已配置（自動從 DB 服務注入）
- [ ] NEXTAUTH_SECRET 已設置（使用 `openssl rand -base64 32` 生成）
- [ ] NEXTAUTH_URL 已配置為 `${APP_URL}`
- [ ] OPENAI_API_KEY 已設置（如需 AI 功能）
- [ ] GitHub 部署密鑰已配置：
  - `DIGITALOCEAN_ACCESS_TOKEN`
  - `DIGITALOCEAN_APP_ID`

---

## 常見錯誤及解決方法

### 1. BUILDING 階段失敗

**錯誤現象**：
```
Current status: ERROR during BUILDING phase
Build failed with exit code 1
```

#### 可能原因 A：Next.js 未配置 standalone 輸出

**檢查方法**：
```bash
grep -n "output.*standalone" apps/web/next.config.js
```

**解決方法**：
在 `apps/web/next.config.js` 中添加：
```javascript
const nextConfig = {
  // ... 其他配置
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
}
```

#### 可能原因 B：Dockerfile 路徑錯誤

**檢查方法**：
確認 `.do/app.yaml` 中的 `dockerfile_path` 設置：
```yaml
services:
  - name: web
    dockerfile_path: Dockerfile  # 必須指向根目錄的 Dockerfile
    source_dir: /                # 必須是根目錄（monorepo）
```

#### 可能原因 C：缺少必要的環境變數

**解決方法**：
確保以下環境變數的 scope 設置為 `RUN_AND_BUILD_TIME`：
- `DATABASE_URL` - Prisma 客戶端生成需要
- `NEXTAUTH_SECRET` - Next.js 構建時可能需要
- `NEXTAUTH_URL` - 構建時路由配置需要

#### 可能原因 D：記憶體不足

**錯誤信息**：
```
JavaScript heap out of memory
FATAL ERROR: Reached heap limit
```

**解決方法**：
1. 在 `.do/app.yaml` 中增加 instance size：
```yaml
services:
  - name: web
    instance_size_slug: basic-s  # 從 basic-xs 升級到 basic-s
```

2. 或在構建時設置 Node 選項（添加到 `package.json`）：
```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}
```

---

### 2. PRE_DEPLOY 階段失敗

**錯誤現象**：
```
Pre-deploy job failed
Database migration failed
```

#### 可能原因 A：資料庫未就緒

**解決方法**：
1. 檢查 Digital Ocean Console 中的資料庫狀態
2. 確認資料庫已完全啟動（可能需要等待 2-3 分鐘）
3. 檢查資料庫連接字串是否正確

#### 可能原因 B：Migration 檔案有問題

**解決方法**：
```bash
# 本地測試 migration
pnpm --filter=@looper-hq/database prisma migrate deploy

# 或使用 db:push（開發用）
pnpm db:push
```

**注意**：當前項目使用 `db:push` 而非 `migrate`，Pre-deploy job 已被禁用。

#### 可能原因 C：DATABASE_URL 未正確注入

**檢查方法**：
確認 `.do/app.yaml` 中的配置：
```yaml
envs:
  - key: DATABASE_URL
    scope: RUN_AND_BUILD_TIME  # 重要！
    type: SECRET
    value: ${db.DATABASE_URL}  # 自動從 db 服務注入
```

---

### 3. 健康檢查失敗

**錯誤現象**：
```
Health check failed: /api/health returned 503
Application not responding
```

#### 可能原因 A：健康檢查端點不存在

**檢查方法**：
```bash
ls -la apps/web/app/api/health/route.ts
```

**解決方法**：
確保 `apps/web/app/api/health/route.ts` 存在且內容正確：
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', database: 'disconnected' },
      { status: 503 }
    );
  }
}
```

#### 可能原因 B：應用啟動失敗

**檢查方法**：
查看 Digital Ocean Runtime Logs：
```bash
# 使用 doctl CLI
doctl apps logs YOUR_APP_ID --type=RUN --follow

# 或在 DO Console 查看
# https://cloud.digitalocean.com/apps/YOUR_APP_ID/logs
```

**常見啟動錯誤**：
- Prisma Client not found → 檢查 Dockerfile 中的 Prisma 客戶端複製步驟
- Database connection failed → 檢查 DATABASE_URL
- Port binding failed → 檢查 PORT 環境變數（應為 3000）

#### 可能原因 C：健康檢查配置錯誤

**檢查方法**：
確認 `.do/app.yaml` 中的配置：
```yaml
health_check:
  http_path: /api/health
  initial_delay_seconds: 60      # 首次檢查前等待時間
  period_seconds: 30             # 檢查間隔
  timeout_seconds: 10            # 單次檢查超時
  success_threshold: 1           # 成功閾值
  failure_threshold: 3           # 失敗閾值
```

**調整建議**：
- 如果應用啟動慢，增加 `initial_delay_seconds` 到 90 或 120
- 資料庫連接慢時，增加 `timeout_seconds` 到 15

---

### 4. 端口配置錯誤

**錯誤現象**：
```
Port mismatch
Application not accessible
```

**解決方法**：
確保 Dockerfile 和 app.yaml 中的端口一致：

**Dockerfile**：
```dockerfile
EXPOSE 3000
ENV PORT=3000
```

**app.yaml**：
```yaml
http_port: 3000  # 必須與 Dockerfile 一致
```

---

### 5. Prisma Client 生成失敗

**錯誤現象**：
```
Error: @prisma/client did not initialize yet
Cannot find module '.prisma/client'
```

**解決方法**：

#### 方法 1：檢查 Dockerfile 的 Prisma 生成步驟

確保以下步驟存在：
```dockerfile
# Stage 1: deps - 生成 Prisma Client
RUN pnpm --filter=@looper-hq/database prisma generate

# Stage 2: builder - 再次生成確保最新
RUN pnpm --filter=@looper-hq/database prisma generate

# Stage 3: runner - 複製生成的客戶端
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
```

#### 方法 2：本地測試 Docker 構建

```bash
# 清除緩存重新構建
docker build --no-cache -t looper-hq-test .

# 檢查生成的 Prisma Client
docker run --rm looper-hq-test ls -la /app/node_modules/.prisma/client
```

---

## 調試工具和命令

### Digital Ocean CLI (doctl)

安裝：
```bash
# macOS
brew install doctl

# Linux
snap install doctl

# Windows
scoop install doctl
```

認證：
```bash
doctl auth init
# 輸入你的 API token
```

常用命令：
```bash
# 列出所有應用
doctl apps list

# 查看應用詳情
doctl apps get YOUR_APP_ID

# 查看部署列表
doctl apps list-deployments YOUR_APP_ID

# 查看構建日誌
doctl apps logs YOUR_APP_ID --type=BUILD --follow

# 查看運行日誌
doctl apps logs YOUR_APP_ID --type=RUN --follow

# 觸發新部署
doctl apps create-deployment YOUR_APP_ID

# 更新應用配置
doctl apps update YOUR_APP_ID --spec .do/app.yaml
```

### Docker 本地調試

```bash
# 構建映像
docker build -t looper-hq-test .

# 運行容器（使用測試環境變數）
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e NEXTAUTH_SECRET="test-secret-at-least-32-chars-long" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e NODE_ENV="production" \
  looper-hq-test

# 進入容器檢查
docker run -it --rm looper-hq-test sh

# 檢查容器日誌
docker logs CONTAINER_ID --follow

# 檢查容器內文件結構
docker run --rm looper-hq-test ls -la /app
docker run --rm looper-hq-test ls -la /app/apps/web/.next
```

### 健康檢查測試

```bash
# 本地測試
curl http://localhost:3000/api/health

# 生產環境測試
curl https://your-app.ondigitalocean.app/api/health

# 詳細健康資訊（需要內部 header）
curl -H "X-Internal-Health-Check: YOUR_SECRET" \
     https://your-app.ondigitalocean.app/api/health?detailed=true
```

---

## 環境變數配置

### 必需環境變數

| 變數名 | Scope | 說明 | 示例 |
|--------|-------|------|------|
| `DATABASE_URL` | `RUN_AND_BUILD_TIME` | PostgreSQL 連接字串 | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | `RUN_AND_BUILD_TIME` | NextAuth 加密密鑰 | 使用 `openssl rand -base64 32` 生成 |
| `NEXTAUTH_URL` | `RUN_AND_BUILD_TIME` | 應用 URL | `${APP_URL}` 或 `https://your-app.com` |

### 可選環境變數

| 變數名 | Scope | 說明 | 默認值 |
|--------|-------|------|--------|
| `OPENAI_API_KEY` | `RUN_AND_BUILD_TIME` | OpenAI/OpenRouter API 密鑰 | - |
| `OPENAI_MODEL` | `RUN_AND_BUILD_TIME` | AI 模型名稱 | `gpt-4o-mini` |
| `OPENAI_BASE_URL` | `RUN_AND_BUILD_TIME` | API 基礎 URL | `https://openrouter.ai/api/v1` |
| `KEYCLOAK_CLIENT_ID` | `RUN_AND_BUILD_TIME` | Keycloak OAuth 客戶端 ID | - |
| `KEYCLOAK_ISSUER` | `RUN_AND_BUILD_TIME` | Keycloak Issuer URL | - |

### Scope 說明

- **`RUN_TIME`**：僅在運行時可用（應用啟動後）
- **`BUILD_TIME`**：僅在構建時可用（npm build 期間）
- **`RUN_AND_BUILD_TIME`**：構建和運行時都可用（推薦用於大多數配置）

**⚠️ 重要**：對於 Prisma 和 Next.js 等需要在構建時訪問資料庫或生成代碼的工具，必須使用 `RUN_AND_BUILD_TIME`。

---

## 部署檢查清單

### 首次部署

- [ ] 創建 Digital Ocean App
- [ ] 連接 GitHub 倉庫
- [ ] 創建 PostgreSQL 資料庫
- [ ] 設置所有必需的環境變數
- [ ] 上傳 `.do/app.yaml` 配置
- [ ] 觸發首次部署
- [ ] 等待部署完成（5-10 分鐘）
- [ ] 訪問健康檢查端點驗證
- [ ] 手動運行 `pnpm bootstrap:data`（如需種子數據）

### 後續部署

- [ ] 本地運行 `./scripts/validate-deployment.sh`
- [ ] 本地測試 Docker 構建
- [ ] Push 到 `main` 分支觸發自動部署
- [ ] 監控 GitHub Actions 工作流
- [ ] 檢查 Digital Ocean 部署狀態
- [ ] 驗證健康檢查通過
- [ ] 測試關鍵功能

---

## 性能優化建議

### 構建時間優化

1. **使用 Docker 層緩存**：
   - 先複製 `package.json`，再複製源代碼
   - 依賴不變時可重用緩存層

2. **減少構建產物大小**：
   - 使用 `output: 'standalone'` 僅包含必要文件
   - 啟用 Next.js 圖片優化

3. **並行構建**（Turborepo）：
   ```bash
   pnpm build  # 自動使用 Turborepo 並行構建
   ```

### 運行時優化

1. **升級實例大小**：
   - 生產環境建議使用至少 `basic-s` (512MB)
   - 高流量時使用 `professional-xs` (1GB+)

2. **啟用 CDN**：
   - Digital Ocean Spaces + CDN
   - Cloudflare 前端代理

3. **資料庫連接池**：
   ```javascript
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     connectionLimit = 10
   }
   ```

---

## 回滾部署

如果部署出現嚴重問題，可以快速回滾：

### 方法 1：通過 Digital Ocean Console

1. 進入 App → Deployments
2. 找到上一個成功的部署
3. 點擊 "Redeploy"

### 方法 2：通過 doctl CLI

```bash
# 列出部署歷史
doctl apps list-deployments YOUR_APP_ID

# 獲取上一個成功的部署 ID
LAST_GOOD_DEPLOYMENT_ID="..."

# 重新部署
doctl apps create-deployment YOUR_APP_ID --from-deployment $LAST_GOOD_DEPLOYMENT_ID
```

### 方法 3：Git Revert + 重新部署

```bash
# 回滾 commit
git revert HEAD
git push origin main

# GitHub Actions 會自動觸發新部署
```

---

## 聯繫支援

### Digital Ocean 支援

- 文檔：https://docs.digitalocean.com/products/app-platform/
- 社群論壇：https://www.digitalocean.com/community/
- Ticket 支援（需要付費方案）

### Looper HQ 專案

- GitHub Issues：https://github.com/JonazWong/Looper-HQ/issues
- 部署指南：`docs/deployment-guide.md`
- 快速部署：`QUICK_DEPLOY.md`

---

## 附錄：完整部署流程圖

```
┌─────────────────────────────────────────────┐
│  1. Push to main branch                     │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  2. GitHub Actions: Test & Build            │
│     - pnpm install                           │
│     - prisma generate                        │
│     - pnpm build                             │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  3. Trigger DO App Platform Deployment      │
│     - doctl apps update (app.yaml)           │
│     - doctl apps create-deployment           │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  4. Digital Ocean: Build Docker Image        │
│     ┌──────────────────────────────────┐    │
│     │ Stage 1: deps                     │    │
│     │  - Install dependencies           │    │
│     │  - Generate Prisma Client         │    │
│     └──────────┬───────────────────────┘    │
│                ▼                              │
│     ┌──────────────────────────────────┐    │
│     │ Stage 2: builder                  │    │
│     │  - Build Next.js app              │    │
│     │  - Generate standalone output     │    │
│     └──────────┬───────────────────────┘    │
│                ▼                              │
│     ┌──────────────────────────────────┐    │
│     │ Stage 3: runner                   │    │
│     │  - Copy standalone files          │    │
│     │  - Setup production environment   │    │
│     └──────────────────────────────────┘    │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  5. Digital Ocean: Deploy & Health Check    │
│     - Start container on port 3000           │
│     - Wait 60s (initial_delay_seconds)       │
│     - Check /api/health every 30s            │
│     - 3 consecutive successes → ACTIVE       │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  6. GitHub Actions: Verify Deployment        │
│     - Check deployment status                │
│     - Verify health endpoint (200 OK)        │
│     - Display deployment summary             │
└─────────────────────────────────────────────┘
```

---

## 更新歷史

- **2026-02-15**：初始版本，涵蓋常見部署問題和解決方案
