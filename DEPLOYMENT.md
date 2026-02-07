# 🚀 Looper HQ Nexus-L - 部署指南

## DigitalOcean App Platform 部署

---

## 📋 部署前檢查清單

### ✅ 必要準備項目

- [ ] GitHub 帳號並推送代碼到 repository
- [ ] DigitalOcean 帳號
- [ ] 域名（已購買並可管理 DNS）
- [ ] 生產環境變數準備完成
- [ ] 資料庫遷移腳本測試完成

---

## 🔧 步驟 1：準備環境變數

### 生成 NextAuth Secret
```bash
# 在本地終端執行
openssl rand -base64 32
```
保存此密鑰，稍後在 App Platform 設置。

### 必需的環境變數清單

創建 `.env.production` 文件（**不要提交到 Git**）：

```bash
# === 應用程式設定 ===
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://your-domain.com

# === 資料庫（App Platform 自動注入）===
DATABASE_URL=${db.DATABASE_URL}

# === NextAuth.js 認證 ===
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<從 openssl 生成的密鑰>

# === Google OAuth（可選）===
GOOGLE_CLIENT_ID=<您的 Google Client ID>
GOOGLE_CLIENT_SECRET=<您的 Google Client Secret>

# === 其他設定 ===
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

---

## 🐙 步驟 2：推送代碼到 GitHub

### 2.1 初始化 Git（如果還沒有）

```bash
cd "d:\Looper HQ Platform\Looper-HQ"
git init
git add .
git commit -m "Initial commit - Looper HQ Nexus-L"
```

### 2.2 連接到 GitHub Repository

```bash
# 替換為您的 GitHub username 和 repo 名稱
git remote add origin https://github.com/JonazWong/HK-Legal-Case-Agency.git
git branch -M main
git push -u origin main
```

### 2.3 設置 .gitignore

確保以下文件已在 `.gitignore` 中：

```gitignore
# 環境變數（重要！）
.env
.env.local
.env.production
.env*.local

# 依賴
node_modules/
.pnp
.pnp.js

# 編譯輸出
.next/
out/
dist/
build/

# 日誌
*.log
npm-debug.log*
pnpm-debug.log*

# 資料庫
*.db
*.db-journal

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

---

## 🌊 步驟 3：在 DigitalOcean 創建 App

### 3.1 登入 DigitalOcean App Platform

1. 前往 https://cloud.digitalocean.com/apps
2. 點擊 **Create App**

### 3.2 連接 GitHub Repository

1. 選擇 **GitHub** 作為源
2. 授權 DigitalOcean 訪問您的 GitHub
3. 選擇 `JonazWong/HK-Legal-Case-Agency` repository
4. 選擇 `main` 分支
5. 勾選 **Autodeploy** (代碼推送時自動部署)

### 3.3 配置應用程式

App Platform 會自動檢測到 `.do/app.yaml` 配置文件。

**如果沒有自動檢測，手動配置：**

#### 資源類型：Web Service
- **Name**: `web`
- **Source Directory**: `/apps/web`
- **Build Command**: 
  ```bash
  pnpm install
  pnpm build
  ```
- **Run Command**: 
  ```bash
  pnpm start
  ```
- **HTTP Port**: `3000`
- **HTTP Routes**: `/`

#### 添加 PostgreSQL 資料庫
1. 點擊 **Add Resource** → **Database**
2. 選擇 **PostgreSQL 16**
3. **Cluster Name**: `looper-hq-production`
4. **Database Name**: `looper_hq`
5. **Database User**: `looper_hq_user`
6. 選擇 Region: **Singapore (sgp1)** （最接近香港）

### 3.4 設置環境變數

在 **Environment Variables** 部分：

```bash
# 自動注入（由 Database 資源提供）
DATABASE_URL=${db.DATABASE_URL}

# 手動添加
NODE_ENV=production
PORT=3000
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<您的密鑰>
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api

# Google OAuth（可選）
GOOGLE_CLIENT_ID=<您的 Client ID>
GOOGLE_CLIENT_SECRET=<您的 Secret>
```

⚠️ **重要**: 勾選 **Encrypt** 對敏感資料加密

---

## 🌐 步驟 4：設置自定義域名

### 4.1 在 App Platform 添加域名

1. 進入 **Settings** → **Domains**
2. 點擊 **Add Domain**
3. 輸入您的域名（例如：`nexus-legal.com`）
4. 選擇 **Manage Domain**

### 4.2 更新 DNS 記錄

App Platform 會提供 CNAME 記錄，例如：

```
Type: CNAME
Host: @（或 www）
Value: your-app.ondigitalocean.app
TTL: 3600
```

**在您的域名提供商（如 GoDaddy、Namecheap）設置：**

| Type  | Host | Value                           | TTL  |
|-------|------|---------------------------------|------|
| CNAME | @    | your-app.ondigitalocean.app     | 3600 |
| CNAME | www  | your-app.ondigitalocean.app     | 3600 |

### 4.3 啟用 HTTPS

App Platform 會自動提供免費的 Let's Encrypt SSL 證書。
等待 DNS 傳播（通常 5-30 分鐘）後，HTTPS 會自動啟用。

---

## 🗄️ 步驟 5：執行資料庫遷移

### 5.1 連接到生產資料庫

在 App Platform Console:
1. 進入 **Database** 資源
2. 點擊 **Connection Details**
3. 複製 **Connection String**

### 5.2 本地執行遷移（使用生產資料庫）

```bash
# 設置生產資料庫 URL
export DATABASE_URL="<從 App Platform 複製的連接字符串>"

# 執行 Prisma 遷移
cd apps/web
pnpm prisma migrate deploy

# 執行種子數據（可選 - 僅開發測試用）
pnpm prisma db seed
```

⚠️ **注意**: 生產環境不要執行 `db seed`，應手動創建管理員帳號。

---

## 🔄 步驟 6：自動部署設置

### GitHub 推送自動部署

已在 `.do/app.yaml` 啟用 `deploy_on_push: true`

**工作流程：**
1. 本地修改代碼
2. Commit 並 push 到 GitHub
3. DigitalOcean 自動檢測變更
4. 自動建置並部署新版本

```bash
# 本地開發
git add .
git commit -m "Add new feature"
git push origin main

# App Platform 會自動：
# 1. 檢測到新 commit
# 2. 執行 build
# 3. 執行測試（如有）
# 4. 部署新版本
# 5. 健康檢查
# 6. 切換流量到新版本
```

---

## 📊 步驟 7：監控與維護

### 7.1 查看應用程式日誌

```bash
# 在 App Platform Console
Insights → Runtime Logs
```

### 7.2 設置告警

在 **Settings** → **Alerts** 配置：
- CPU 使用率 > 80%
- Memory 使用率 > 80%
- 部署失敗
- 健康檢查失敗

### 7.3 監控指標

- **Response Time**: 目標 < 500ms
- **Error Rate**: 目標 < 1%
- **Uptime**: 目標 > 99.9%

---

## 🔒 安全性檢查清單

### 生產環境安全設置

- [ ] **環境變數已加密** - 所有 secrets 已勾選 "Encrypt"
- [ ] **HTTPS 已啟用** - 強制 HTTPS 重定向
- [ ] **CORS 已配置** - 只允許您的域名
- [ ] **Rate Limiting** - API 速率限制（Next.js middleware）
- [ ] **SQL Injection 防護** - Prisma ORM 已內建
- [ ] **XSS 防護** - React 已內建
- [ ] **CSRF 防護** - NextAuth.js 已內建
- [ ] **密碼強度** - Bcrypt 加密
- [ ] **Session 安全** - HTTP-only cookies

---

## 💰 成本估算

### DigitalOcean App Platform 定價

**Professional-XS Plan** (推薦起步):
- **Web Service**: $12/月
- **PostgreSQL Database**: $15/月
- **總計**: ~$27/月

**擴展選項**:
- Professional-S (1GB RAM): $24/月
- Professional-M (2GB RAM): $48/月
- Database 備份: +$5/月

---

## 🔧 故障排除

### 常見問題

#### 1. 部署失敗：Build Error

```bash
# 檢查 package.json scripts
# 確保 build 命令正確
"build": "next build"

# 檢查 TypeScript 錯誤
pnpm type-check

# 檢查環境變數
確保 NEXTAUTH_SECRET 已設置
```

#### 2. 資料庫連接失敗

```bash
# 檢查 DATABASE_URL 格式
postgresql://username:password@host:port/database?sslmode=require

# 確保 SSL mode 已啟用
?sslmode=require
```

#### 3. 域名無法訪問

```bash
# 檢查 DNS 設置
nslookup your-domain.com

# 等待 DNS 傳播（5-30 分鐘）
# 檢查 App Platform 域名狀態
```

#### 4. 500 Internal Server Error

```bash
# 查看 Runtime Logs
# 檢查環境變數
# 確認資料庫遷移已執行
```

---

## 📚 相關資源

- [DigitalOcean App Platform 文檔](https://docs.digitalocean.com/products/app-platform/)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [Prisma 生產部署](https://www.prisma.io/docs/guides/deployment)
- [NextAuth.js 部署](https://next-auth.js.org/deployment)

---

## ✅ 部署完成檢查

部署成功後，測試以下功能：

- [ ] 首頁可以訪問 (https://your-domain.com)
- [ ] 公開搜尋功能正常 (/case-search)
- [ ] 登入功能正常
- [ ] Dashboard 功能正常
- [ ] 資料庫讀寫正常
- [ ] HTTPS 正常運作
- [ ] 自定義域名解析正常
- [ ] 自動部署已測試（推送代碼自動更新）

---

## 🚀 下一步

### 推薦優化項目

1. **效能優化**
   - 啟用 CDN
   - 圖片優化 (Next.js Image)
   - 資料庫查詢優化
   - Redis 快取 (可選)

2. **SEO 優化**
   - Meta tags
   - Sitemap
   - robots.txt
   - 結構化資料

3. **監控與分析**
   - Google Analytics
   - Error Tracking (Sentry)
   - Performance Monitoring

4. **備份策略**
   - 每日資料庫自動備份
   - 代碼版本控制（已有 Git）

---

**需要協助？** 請參考 DigitalOcean 支援或查看應用程式日誌。
