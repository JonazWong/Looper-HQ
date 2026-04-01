---
name: deployment-diagnostics
description: "Looper HQ 部署診斷與修復工作流程。Use for: 診斷 DigitalOcean App Platform 部署失敗、構建錯誤 (BUILDING/PRE_DEPLOY phase)、健康檢查失敗、Prisma Client 生成問題、環境變數配置錯誤、Docker 構建問題、GitHub Actions CI/CD 故障、查看部署日誌、回滾部署。Keywords: deployment failed, build error, health check, doctl, DigitalOcean, Prisma client, DATABASE_URL, NEXTAUTH, Docker, CI/CD, standalone, heap out of memory, PRE_DEPLOY, migration, 部署失敗, 構建失敗, 健康檢查."
argument-hint: "可選：指定錯誤訊息或失敗階段（例如：BUILDING, PRE_DEPLOY, healthcheck）"
---

# 部署診斷代理 — Looper HQ

本技能指導對 DigitalOcean App Platform 部署問題進行系統性診斷和修復。

---

## 診斷流程

### 第一步：收集錯誤資訊

執行以下命令收集當前部署狀態：

```powershell
# 列出所有應用及狀態
doctl apps list

# 查看最新部署記錄（替換 APP_ID）
doctl apps list-deployments $APP_ID --format ID,Phase,Progress,CreatedAt

# 查看構建日誌（最常用）
doctl apps logs $APP_ID --type=BUILD --follow

# 查看運行時日誌
doctl apps logs $APP_ID --type=RUN --follow

# 查看詳細應用規格
doctl apps get $APP_ID
```

> **APP_ID** 在本專案為 `0f0a2a52-9e63-479f-98ed-3bd0a69e0973`（見 GitHub Secrets `DIGITALOCEAN_APP_ID`）

---

## 按失敗階段診斷

### BUILDING 階段失敗

| 症狀 | 原因 | 修復方法 |
|------|------|---------|
| `JavaScript heap out of memory` | 記憶體不足 | 升級 instance size 或加 `NODE_OPTIONS='--max-old-space-size=4096'` |
| `Cannot find module` | Prisma Client 未生成 | 見 [Prisma 問題](#prisma-client-問題) |
| `COPY failed: file not found` | Dockerfile 路徑錯誤 | 確認 `.do/app.yaml` 的 `source_dir: /` |
| exits with code 1（無詳情） | 環境變數缺失 | 將 `DATABASE_URL` scope 設為 `RUN_AND_BUILD_TIME` |

**檢查 Next.js standalone 輸出**（缺少會導致容器無法啟動）：
```bash
grep -n "standalone" apps/web/next.config.js
```
若缺少，在 `apps/web/next.config.js` 加入：
```javascript
output: 'standalone',
outputFileTracingRoot: require('path').join(__dirname, '../../'),
```

**確認 `.do/app.yaml` 路徑配置**：
```yaml
services:
  - name: web
    dockerfile_path: Dockerfile   # 根目錄 Dockerfile
    source_dir: /                 # monorepo 必須是根目錄
```

---

### PRE_DEPLOY 階段失敗

**現象**：`Pre-deploy job failed` 或 `Database migration failed`

1. 確認資料庫服務已啟動（DO Console > Databases）
2. 確認 `DATABASE_URL` 在 `.do/app.yaml` 中正確注入：
   ```yaml
   envs:
     - key: DATABASE_URL
       scope: RUN_AND_BUILD_TIME   # 必須！
       type: SECRET
       value: ${db.DATABASE_URL}
   ```
3. 本地測試 migration：
   ```bash
   pnpm --filter=@looper-hq/database prisma migrate deploy
   ```
   > 注意：本專案開發環境用 `db:push`，生產用 `prisma migrate deploy`

---

### 健康檢查失敗

**現象**：`Health check failed: /api/health returned 503`

**診斷步驟**：
```bash
# 1. 確認健康檢查端點存在
Get-Item apps/web/app/api/health/route.ts

# 2. 本地測試
curl http://localhost:3005/api/health

# 3. 查看運行時日誌找啟動錯誤
doctl apps logs $APP_ID --type=RUN --follow
```

**常見啟動錯誤及解法**：
- `Prisma Client not found` → 見 [Prisma 問題](#prisma-client-問題)
- `Database connection failed` → 檢查 `DATABASE_URL` 環境變數
- `Port binding failed` → `EXPOSE 3000` 和 `http_port: 3000` 必須一致

**調整健康檢查時間** (`.do/app.yaml`)：
```yaml
health_check:
  http_path: /api/health
  initial_delay_seconds: 90   # 應用啟動慢時增加到 90-120
  period_seconds: 30
  timeout_seconds: 15
  failure_threshold: 3
```

---

### Prisma Client 問題

**現象**：`@prisma/client did not initialize yet` 或 `Cannot find module '.prisma/client'`

**檢查 Dockerfile 必備步驟**：
```dockerfile
# deps stage - 生成 Prisma Client
RUN pnpm --filter=@looper-hq/database prisma generate

# runner stage - 複製生成的客戶端（缺少此步驟是常見錯誤）
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
```

**本地 Docker 驗證**：
```bash
# 清除快取重新構建
docker build --no-cache -t looper-hq-test .

# 確認 Prisma Client 存在於容器中
docker run --rm looper-hq-test ls -la /app/node_modules/.prisma/client
```

---

## 環境變數必備清單

在 DO Console > App Settings > Environment Variables 確認這些已設定：

| 變數 | scope | 說明 |
|------|-------|------|
| `DATABASE_URL` | `RUN_AND_BUILD_TIME` | 自動注入：`${db.DATABASE_URL}` |
| `NEXTAUTH_SECRET` | `RUN_AND_BUILD_TIME` | `openssl rand -base64 32` 生成 |
| `NEXTAUTH_URL` | `RUN_AND_BUILD_TIME` | `${APP_URL}` |
| `OPENAI_API_KEY` | `RUN_TIME` | AI 功能需要 |
| `OPENAI_BASE_URL` | `RUN_TIME` | OpenRouter: `https://openrouter.ai/api/v1` |
| `OPENAI_MODEL` | `RUN_TIME` | 預設 `gpt-5.1` |

**GitHub Secrets**（CI/CD 需要）：
- `DIGITALOCEAN_ACCESS_TOKEN`
- `DIGITALOCEAN_APP_ID` = `0f0a2a52-9e63-479f-98ed-3bd0a69e0973`

---

## 常用修復操作

```powershell
# 手動觸發重新部署
doctl apps create-deployment $APP_ID

# 更新應用規格（修改 .do/app.yaml 後）
doctl apps update $APP_ID --spec .do/app.yaml

# 查看最新部署詳情
doctl apps list-deployments $APP_ID --format ID,Phase,Progress --no-header | Select-Object -First 1

# 回滾到上一個成功部署
doctl apps list-deployments $APP_ID
doctl apps create-deployment $APP_ID --force-rebuild
```

---

## 本地 Docker 快速驗證

在推送前本地驗證 Docker 構建：

```powershell
# 1. 本地構建（確認無錯誤）
docker build -t looper-hq-test .

# 2. 本地運行
docker run -p 3000:3000 `
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5433/looper_hq" `
  -e NEXTAUTH_SECRET="test-secret-32-chars-minimum-here" `
  -e NEXTAUTH_URL="http://localhost:3000" `
  looper-hq-test

# 3. 測試健康端點
Invoke-RestMethod http://localhost:3000/api/health
```

---

## 完整診斷腳本

執行內建診斷腳本進行全面檢查：

```bash
# Linux/macOS
./scripts/diagnose-deployment.sh --full

# 單項檢查
./scripts/diagnose-deployment.sh --check-do      # 只檢查 DO 狀態
./scripts/diagnose-deployment.sh --check-build   # 只驗證 Dockerfile
./scripts/diagnose-deployment.sh --check-secrets # 只檢查 GitHub Secrets
```

詳細故障排查文檔：[docs/DO_DEPLOYMENT_TROUBLESHOOTING.md](../../docs/DO_DEPLOYMENT_TROUBLESHOOTING.md)  
完整部署指南：[docs/deployment-guide.md](../../docs/deployment-guide.md)
