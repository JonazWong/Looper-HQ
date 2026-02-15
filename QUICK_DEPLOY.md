# 🚀 Looper HQ - Quick Deployment Guide

> **快速部署指南** - Digital Ocean App Platform 部署的簡化步驟

## 📋 部署前準備清單

### 1️⃣ GitHub Secrets 設置

在 GitHub Repository Settings → Secrets and variables → Actions 中設置：

```
✅ DIGITALOCEAN_ACCESS_TOKEN  # Digital Ocean API Token
✅ DIGITALOCEAN_APP_ID        # DO App Platform App ID
```

**如何獲取：**
- **ACCESS_TOKEN**: https://cloud.digitalocean.com/account/api/tokens → Generate New Token
- **APP_ID**: 在 DO Console 創建 App 後，從 URL 獲取或運行 `doctl apps list`

---

### 2️⃣ Digital Ocean Console 環境變數

在 DO App Platform → Settings → App-Level Environment Variables 中設置：

#### 🔴 必須設置 (Required)

```bash
# NextAuth Secret - 生成命令：openssl rand -base64 32
NEXTAUTH_SECRET=<生成的32位隨機字串>

# OpenAI API Key - 從 OpenRouter 或 OpenAI 獲取
OPENAI_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx
```

#### 🟡 可選設置 (Optional - 僅在使用 Keycloak 時需要)

```bash
KEYCLOAK_CLIENT_ID=looper-hq-web
KEYCLOAK_ISSUER=https://your-keycloak-domain.com/realms/looper-hq
```

#### ✅ 自動注入 (Auto-configured by DO)

以下環境變數由 `.do/app.yaml` 或 DO 自動配置，無需手動設置：
- `DATABASE_URL` (由 DO Managed Database 自動注入)
- `NEXTAUTH_URL` (使用 `${APP_URL}`)
- `NODE_ENV=production`
- `TZ=Asia/Hong_Kong`
- AI 配置 (OPENAI_MODEL, OPENAI_BASE_URL 等)
- Crawler 配置

---

## 🚀 首次部署步驟

### Step 1: 創建 Digital Ocean App

```bash
# 安裝 doctl (如果還沒有)
brew install doctl  # macOS
# 或
snap install doctl  # Linux

# 認證
doctl auth init

# 從 app.yaml 創建 App
doctl apps create --spec .do/app.yaml
```

這將自動：
- ✅ 創建 PostgreSQL 16 資料庫
- ✅ 配置 Web Service
- ✅ 設置健康檢查 (/api/health)
- ✅ 注入 DATABASE_URL

**記下輸出的 App ID，稍後需要設置到 GitHub Secrets！**

---

### Step 2: 在 DO Console 設置必需的 Secrets

1. 訪問：https://cloud.digitalocean.com/apps
2. 選擇剛創建的 App
3. 進入 **Settings** → **App-Level Environment Variables**
4. 添加以下 Encrypted 變數：
   - `NEXTAUTH_SECRET` (生成命令：`openssl rand -base64 32`)
   - `OPENAI_API_KEY` (從 https://openrouter.ai/keys 獲取)

---

### Step 3: 設置 GitHub Secrets

在 GitHub Repository → Settings → Secrets and variables → Actions：

1. **DIGITALOCEAN_ACCESS_TOKEN**
   - 從 https://cloud.digitalocean.com/account/api/tokens 生成
   - Scopes: Read & Write

2. **DIGITALOCEAN_APP_ID**
   - 從 Step 1 的輸出獲取
   - 或從 DO Console URL: `https://cloud.digitalocean.com/apps/<這裡是ID>`

---

### Step 4: 推送到 main 分支觸發部署

```bash
git add .
git commit -m "chore: trigger deployment"
git push origin main
```

GitHub Actions 將自動：
1. ✅ 安裝依賴並構建
2. ✅ 觸發 DO App Platform 部署
3. ✅ 等待部署完成 (約 5-10 分鐘)
4. ✅ 驗證健康檢查
5. ✅ 輸出部署摘要

監控部署進度：
- GitHub Actions: https://github.com/JonazWong/Looper-HQ/actions
- Digital Ocean: https://cloud.digitalocean.com/apps

---

### Step 5: 初始化資料庫 (首次部署後)

部署完成後，需要初始化資料庫數據：

1. 進入 DO Console → 你的 App → Console Tab
2. 運行以下命令：

```bash
# 同步資料庫結構
pnpm --filter=@looper-hq/database prisma db push

# 初始化種子數據 (可選)
pnpm bootstrap:data
```

**註：** 目前 pre-deploy migration job 已禁用，改用手動執行 `db:push`

---

## ✅ 驗證部署成功

### 1. 檢查健康端點

```bash
# 替換為你的 App URL
curl https://your-app.ondigitalocean.app/api/health
```

**預期輸出：**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-15T09:50:00.000Z",
  "database": "connected",
  "uptime": 123.45,
  "version": "2.0.0",
  "checks": {
    "database": { "status": "ok", "responseTime": 45 },
    "openai": { "status": "ok", "configured": true },
    "memory": { "status": "ok", "used": 256, "total": 512, "percentage": 50 }
  }
}
```

### 2. 訪問應用

打開瀏覽器訪問：`https://your-app.ondigitalocean.app`

---

## 🔧 常見問題和解決方案

### ❌ 問題 1: Build 失敗 - "Prisma Client not found"

**原因**: Prisma Client 未在構建時生成

**解決方案**: 已在 Dockerfile 中配置，確保沒有修改以下行：
```dockerfile
RUN pnpm --filter=@looper-hq/database prisma generate
```

---

### ❌ 問題 2: Health Check 失敗 - 503 Error

**原因**: 資料庫連接失敗

**檢查步驟**:
1. 確認 DATABASE_URL 在 DO Console 中正確配置
2. 檢查資料庫是否已創建並運行
3. 查看 App Logs: DO Console → Runtime Logs

---

### ❌ 問題 3: 部署成功但無法登入

**原因**: NEXTAUTH_SECRET 未設置或錯誤

**解決方案**:
```bash
# 生成新的 secret
openssl rand -base64 32

# 在 DO Console → Settings → Environment Variables 中更新
# 然後重新部署
```

---

### ❌ 問題 4: AI 功能不工作

**原因**: OPENAI_API_KEY 未設置

**解決方案**:
1. 在 https://openrouter.ai/keys 獲取 API key
2. 在 DO Console 設置 `OPENAI_API_KEY` (Encrypted)
3. 重新部署

---

### ❌ 問題 5: 構建時間過長或超時

**原因**: 依賴安裝或 Prisma 生成耗時

**解決方案**:
- DO App Platform 默認 timeout 是 10 分鐘，通常足夠
- 如果持續超時，檢查 `.dockerignore` 確保沒有包含 `node_modules`
- 查看 Build Logs 確認卡在哪一步

---

## 📊 部署監控

### GitHub Actions

訪問：https://github.com/JonazWong/Looper-HQ/actions

查看：
- ✅ Test & Build 階段狀態
- ✅ Deploy to Production 狀態
- ✅ Health Check 驗證結果
- ✅ 部署摘要 (App URL, Deployment ID)

### Digital Ocean Console

訪問：https://cloud.digitalocean.com/apps

查看：
- 📊 Deployments 歷史
- 📝 Build Logs
- 📝 Runtime Logs
- 💰 Resource Usage & Billing
- ⚙️ Settings & Environment Variables

---

## 🔄 更新部署

日常更新只需推送到 main 分支：

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

GitHub Actions 會自動處理：
1. 運行測試和構建
2. 觸發 DO 部署
3. 等待完成並驗證
4. 輸出結果

---

## 📚 進階配置

### 自定義域名

1. DO Console → 你的 App → Settings → Domains
2. Add Domain → 輸入你的域名
3. 按照提示配置 DNS (CNAME 記錄)
4. 等待 SSL 證書自動配置 (約 5-10 分鐘)

### 擴展資源

1. DO Console → 你的 App → Settings
2. 在 **web** service 中調整：
   - Instance Size: `basic-xs` → `basic-s` (更多記憶體)
   - Instance Count: 1 → 2+ (水平擴展)

### 環境變數管理

建議將所有 Secrets 在 DO Console 中設置為 **Encrypted**：
- ✅ NEXTAUTH_SECRET
- ✅ OPENAI_API_KEY
- ✅ KEYCLOAK_CLIENT_SECRET (如果使用)

---

## 🆘 獲取幫助

### 文檔
- **完整部署指南**: `docs/deployment-guide.md`
- **DO App Platform**: https://docs.digitalocean.com/products/app-platform/

### 故障排查工具
```bash
# 本地驗證部署配置
./scripts/validate-deployment.sh

# 診斷部署問題
./scripts/diagnose-deployment.sh
```

### 日誌查看
```bash
# 查看最近的部署日誌
doctl apps logs <APP_ID> --type DEPLOY

# 查看運行時日誌
doctl apps logs <APP_ID> --type RUN --follow
```

---

## 📝 部署檢查清單

使用此清單確保每個步驟都已完成：

### 首次部署
- [ ] GitHub Secrets 已設置 (DIGITALOCEAN_ACCESS_TOKEN, DIGITALOCEAN_APP_ID)
- [ ] DO Console Secrets 已設置 (NEXTAUTH_SECRET, OPENAI_API_KEY)
- [ ] PostgreSQL 資料庫已創建
- [ ] 推送到 main 分支
- [ ] GitHub Actions 部署成功
- [ ] Health check 返回 200
- [ ] 執行 `pnpm bootstrap:data` 初始化數據
- [ ] 可以訪問應用並登入

### 日常更新
- [ ] 代碼已提交到 main 分支
- [ ] GitHub Actions 測試通過
- [ ] 部署成功完成
- [ ] Health check 驗證通過
- [ ] 應用功能正常

---

## 🎉 成功！

部署完成後，你的 Looper HQ 應用將在：
- **App URL**: `https://your-app.ondigitalocean.app`
- **Health Check**: `https://your-app.ondigitalocean.app/api/health`

享受你的生產環境！🚀
