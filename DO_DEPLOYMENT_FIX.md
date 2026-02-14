# DigitalOcean 部署修復指南

## 🔴 問題診斷

根據構建日誌分析：

### 問題 1: 使用 Buildpack 而非 Dockerfile
- **現象**: 日誌顯示 `using libpnp 22.04 stack` 和 `heroku/nodejs` buildpack
- **原因**: DigitalOcean App Platform 忽略了 `.do/app.yaml` 中的 `dockerfile_path` 配置
- **影響**: 使用 Buildpack 構建可能遇到環境不一致問題

### 問題 2: Webpack 編譯失敗
```
@looper-hq/web:build: > Build failed because of webpack errors
ELIFECYCLE Command failed with exit code 1.
```

## ✅ 已修復的配置

### 1. `.do/app.yaml` 修改
```yaml
services:
  - name: web
    source_dir: /              # 新增: 明確指定根目錄
    dockerfile_path: Dockerfile # 強制使用 Docker 構建
```

### 2. DATABASE_URL 範圍調整
```yaml
- key: DATABASE_URL
  scope: RUN_TIME           # 修改: 從 RUN_AND_BUILD_TIME 改為 RUN_TIME
  type: SECRET
  value: ${db.DATABASE_URL}
```

**原因**: 構建階段不需要實際的數據庫連接，只有運行時需要。

## 📋 必須手動執行的步驟

### 步驟 1: 提交並推送更改
```bash
cd "d:\Looper HQ WS\Looper-HQ"
git add .do/app.yaml
git commit -m "fix: force Docker build and adjust DATABASE_URL scope"
git push origin main
```

### 步驟 2: 在 DigitalOcean Console 中強制使用 App Spec

**方法 A: 同步 App Spec (推薦)**
1. 登入 DigitalOcean Console: https://cloud.digitalocean.com/apps
2. 選擇 `looper-hq` 應用
3. 點擊 **Settings** → **App Spec**
4. 確認看到 `dockerfile_path: Dockerfile` 和 `source_dir: /`
5. 如果沒有，點擊 **Sync with Repo** 按鈕
6. 點擊 **Save** 保存配置

**方法 B: 手動編輯 (如果同步失敗)**
1. 在 App Spec 編輯器中，確保 `services[0]` 包含：
   ```yaml
   source_dir: /
   dockerfile_path: Dockerfile
   ```
2. **刪除任何** `build_command` 或 `buildpack` 配置
3. 保存並重新部署

### 步驟 3: 設置環境變數 (首次部署必須)

在 DigitalOcean Console → Apps → looper-hq → Settings → Environment Variables:

#### 必需的秘密變數
1. **NEXTAUTH_SECRET**
   - 生成方式: 
     ```bash
     openssl rand -base64 32
     ```
   - 在 DO Console 中設置為加密變數

2. **OPENAI_API_KEY**
   - 使用您的 OpenRouter 或 OpenAI API Key
   - 在 DO Console 中設置為加密變數

### 步驟 4: 觸發重新部署
```bash
# 選項 1: 推送修改後自動觸發 (deploy_on_push: true)
git push origin main

# 選項 2: 手動在 DO Console 觸發
# Go to: Apps → looper-hq → Actions → Force Rebuild and Deploy
```

### 步驟 5: 監控構建日誌

1. 前往 **Activity** 標籤
2. 檢查最新部署的 **Build Logs**
3. **確認看到以下內容**:
   ```
   =====> Building with Dockerfile...
   Step 1/XX : FROM node:20-alpine AS deps
   ```
   **不應該看到**: `using libpnp stack` 或 `Detected the following buildpacks`

4. 如果仍然使用 Buildpack，返回步驟 2 重新同步 App Spec

## 🔍 驗證構建成功

成功的 Docker 構建日誌應該顯示：
```
=====> Building with Dockerfile...
Step 1/14 : FROM node:20-alpine AS deps
 ---> [hash...]
Step 2/14 : RUN apk add --no-cache libc6-compat
 ---> Running in [container-id...]
Step 3/14 : WORKDIR /app
...
Step 14/14 : CMD ["node", "apps/web/server.js"]
 ---> Running in [container-id...]
Successfully built [image-hash]
```

## 🚨 常見錯誤排查

### 錯誤 1: 仍然使用 Buildpack
**解決**: 刪除應用並從 `.do/app.yaml` 重新創建：
```bash
# 警告: 這會刪除現有應用 (數據庫會保留如果分開創建)
doctl apps create --spec .do/app.yaml
```

### 錯誤 2: Docker 構建失敗
檢查日誌中的具體錯誤：
- **pnpm install 失敗**: 確認 `pnpm-lock.yaml` 已推送到 GitHub
- **Prisma generate 失敗**: 確認 `packages/database/prisma/schema.prisma` 存在
- **Next.js build 失敗**: 檢查 TypeScript 錯誤

### 錯誤 3: Health Check 失敗
確認：
1. 環境變數 `NEXTAUTH_SECRET` 和 `OPENAI_API_KEY` 已設置
2. 數據庫已創建並連接 (`DATABASE_URL` 自動注入)
3. 應用監聽 port 3000

## 📦 部署後初始化

成功部署後，運行以下命令初始化數據庫：

```bash
# 在 DO Console → Apps → looper-hq → Console 中執行:
cd /app
pnpm bootstrap:data
```

這會創建：
- ✅ 默認 Firm (香港律師事務所)
- ✅ Admin 用戶 (admin@looper-hq.app / admin123)
- ✅ 範例案件和客戶數據
- ✅ 公開案件測試數據

## 🎯 驗證部署

1. **Health Check**: 
   ```
   curl https://looper-hq-xxxxx.ondigitalocean.app/api/health
   ```
   應返回: `{"status":"ok"}`

2. **登入測試**:
   - 訪問: https://looper-hq-xxxxx.ondigitalocean.app
   - 使用: admin@looper-hq.app / admin123

3. **AI 翻譯測試**:
   ```bash
   curl -X POST https://looper-hq-xxxxx.ondigitalocean.app/api/translate \
     -H "Content-Type: application/json" \
     -d '{"text":"測試翻譯","direction":"auto"}'
   ```

---

**最後更新**: 2026-02-15  
**狀態**: 待部署驗證
