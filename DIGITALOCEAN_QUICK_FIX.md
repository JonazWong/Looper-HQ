# DigitalOcean 部署快速修復

## 🔴 錯誤: "missing project.yml" 或目錄結構問題

### ✅ 已修復: `.do/app.yaml` 配置

關鍵修改：添加 `source_dir: /` 配置

```yaml
services:
  - name: web
    source_dir: /              # ← 新增！指定monorepo根目錄
    github:
      repo: JonazWong/Looper-HQ
      branch: main
      deploy_on_push: true
    dockerfile_path: Dockerfile
```

## 📋 立即執行步驟

### 步驟 1: 提交並推送修復

```bash
git add .do/app.yaml
git commit -m "fix: add source_dir to force Docker build from root"
git push origin main
```

### 步驟 2: 在 DigitalOcean Console 同步配置

**必須手動操作，否則不會生效！**

1. 登入 DigitalOcean: https://cloud.digitalocean.com/apps
2. 選擇 `looper-hq` 應用
3. 點擊 **Settings** → **App Spec**
4. 找到 **"Sync with Git Repository"** 按鈕
5. 點擊同步，確認看到 `source_dir: /`
6. 點擊 **Save**

或者手動編輯 App Spec：
```yaml
# 確保 services[0] 包含:
services:
  - name: web
    source_dir: /
    dockerfile_path: Dockerfile
```

### 步驟 3: 設置必需的環境變數

在 **Settings** → **Environment Variables** 中設置：

#### 1. NEXTAUTH_SECRET (加密)
```bash
# 生成密鑰
openssl rand -base64 32
```
然後在 DO Console 設置為 **Encrypted** 變數

#### 2. OPENAI_API_KEY (加密)
使用您的 OpenRouter 或 OpenAI API Key，設置為 **Encrypted** 變數

### 步驟 4: 觸發重新部署

推送代碼後會自動部署，或手動觸發：
- 前往 **Actions** → **Force Rebuild and Deploy**

### 步驟 5: 驗證構建

檢查 **Activity** → **Build Logs**，應該看到：
```
=====> Building with Dockerfile...
Step 1/XX : FROM node:20-alpine AS deps
```

**✅ 成功標誌**: 日誌顯示 "Building with Dockerfile"
**❌ 錯誤標誌**: 日誌顯示 "using buildpack" 或 "heroku/nodejs"

## 🔍 故障排查

### 問題 1: 仍然使用 Buildpack

**解決方案**:
1. 確認 `.do/app.yaml` 已推送到 GitHub
2. 在 DO Console **手動同步** App Spec
3. 確認 **沒有** `build_command` 配置
4. 刪除任何 `buildpack` 相關配置

### 問題 2: Dockerfile not found

**解決方案**:
```yaml
# 確保配置正確
source_dir: /              # 必須是根目錄
dockerfile_path: Dockerfile # 必須在根目錄
```

### 問題 3: 數據庫連接失敗

**確認**:
- `DATABASE_URL` 設置為 `${db.DATABASE_URL}` (自動注入)
- Scope 設置為 `RUN_TIME`
- 數據庫已在 App 中創建

### 問題 4: 環境變數未生效

**確認**:
- `NEXTAUTH_SECRET` 和 `OPENAI_API_KEY` 已在 DO Console 設置
- 類型為 **SECRET** (加密)
- Scope 正確 (`RUN_TIME` 或 `RUN_AND_BUILD_TIME`)

## 📊 部署後檢查

```bash
# 1. 健康檢查
curl https://your-app.ondigitalocean.app/api/health

# 應返回:
# {"status":"ok","database":"connected","timestamp":"..."}

# 2. 初始化數據
# 在 DO Console → Console tab 執行:
pnpm bootstrap:data
```

## 🎯 完整部署檢查清單

- [ ] `.do/app.yaml` 包含 `source_dir: /`
- [ ] 代碼已推送到 GitHub main 分支
- [ ] DO Console 中 App Spec 已同步
- [ ] `NEXTAUTH_SECRET` 已設置 (Encrypted)
- [ ] `OPENAI_API_KEY` 已設置 (Encrypted)
- [ ] 數據庫已創建並連接
- [ ] 構建日誌顯示 "Building with Dockerfile"
- [ ] 健康檢查通過 (`/api/health` 返回 200)
- [ ] 已執行 `pnpm bootstrap:data` 初始化

## 📚 相關文檔

- [完整部署指南](./docs/deployment/DIGITALOCEAN_DEPLOYMENT.md)
- [Dockerfile 說明](./Dockerfile)
- [環境變數配置](./docs/AI_CONFIGURATION.md)

---

**最後更新**: 2026-02-15  
**狀態**: ✅ 修復完成 - 添加 `source_dir: /` 配置
