# Looper-HQ DigitalOcean 自動部署指南

## 📋 概述

本指南說明如何將 Looper-HQ 自動部署到 DigitalOcean App Platform，取代現有的 HK-LEGAL-CASE-AGENCY 項目。

## 🎯 主要特點

- ✅ 統一的 AI 配置（支持 OpenAI / OpenRouter / Azure）
- ✅ 自動化部署（push to main = auto deploy）
- ✅ 完整的環境變數管理
- ✅ 健康檢查和告警配置
- ✅ PostgreSQL 16 數據庫
- ✅ 一鍵初始化數據

## 🚀 快速開始

### 1. 本地檢查配置

在部署前，先在本地檢查配置：

```bash
pnpm do:check
```

這會：
- 驗證 `.do/app.yaml` 存在
- 列出需要在 DO 設置的環境變數
- 提供 doctl 命令（如已安裝）

### 2. 在 DigitalOcean 創建 App

#### 方式 A：使用 Web 界面（推薦）

1. 登入 [DigitalOcean](https://cloud.digitalocean.com)
2. 前往 **Apps** → **Create App**
3. 選擇 **GitHub** 作為來源
4. 選擇 `JonazWong/Looper-HQ` 倉庫
5. 分支選擇 `main`
6. 在 **Resources** 頁面，點擊 **Edit** → **Import from Repo**
7. 系統會自動讀取 `.do/app.yaml`
8. 點擊 **Next** 繼續

#### 方式 B：使用 doctl CLI

```bash
# 1. 安裝 doctl
# macOS: brew install doctl
# Windows: choco install doctl
# Linux: snap install doctl

# 2. 登入
doctl auth init

# 3. 創建 App
doctl apps create --spec .do/app.yaml

# 4. 查看部署狀態
doctl apps list
```

### 3. 配置環境變數

在 DigitalOcean App 設置頁面，為 **web** 服務添加以下 **Secrets**：

#### 必填項

```bash
# Auth
NEXTAUTH_SECRET=<使用以下命令生成>
# 生成方法: openssl rand -base64 32

# AI Provider
OPENAI_API_KEY=<你的 OpenAI 或 OpenRouter API Key>
```

#### 可選項（如需 Google OAuth）

```bash
GOOGLE_CLIENT_ID=<Google OAuth Client ID>
GOOGLE_CLIENT_SECRET=<Google OAuth Client Secret>
```

### 4. 部署

點擊 **Deploy App** 或等待自動部署（當你推送到 main 分支時）。

初次部署大約需要 **5-10 分鐘**。

### 5. 初始化數據

部署完成後，使用 DigitalOcean Console 或 SSH 執行：

```bash
pnpm bootstrap:data
```

這會創建：
- 默認法律事務所
- 管理員賬戶（admin@looper-hq.app / admin123）
- AI 配置
- 系統活動日誌

**⚠️ 重要：首次登入後請立即更改密碼！**

### 6. 驗證部署

訪問以下端點確認服務正常：

```bash
# Health Check
https://你的域名.ondigitalocean.app/api/health

# 預期響應:
# {"status":"ok","timestamp":"...","database":"connected"}

# 測試 AI 翻譯功能
POST https://你的域名.ondigitalocean.app/api/translate
{
  "text": "Hello World",
  "direction": "en-to-zh"
}
```

## 🔧 AI 配置說明

### 環境變數

所有 AI 相關配置已統一在 `.env.example` 中：

```bash
# Provider 選擇
AI_PROVIDER=openai          # openai | openrouter | azure

# OpenAI / OpenRouter
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://openrouter.ai/api/v1

# AI 行為配置
AI_MAX_TOKENS=2048
AI_TEMPERATURE=0.3
AI_DEFAULT_LOCALE=zh-HK

# Azure OpenAI (選用)
# AZURE_OPENAI_ENDPOINT=...
# AZURE_OPENAI_API_KEY=...
# AZURE_OPENAI_DEPLOYMENT=...
```

### 統一 AI Client

所有 AI 功能現在使用統一的 client（`@looper-hq/utils/ai-client`）：

```typescript
import { generateCompletion } from '@looper-hq/utils/ai-client'

const result = await generateCompletion({
  systemPrompt: '你是專業的法律助手',
  userPrompt: '分析這個案例...',
  maxTokens: 1000,
})
```

### 切換 AI Provider

只需修改環境變數即可切換：

```bash
# 切換到 OpenRouter
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...

# 切換到 Azure
AI_PROVIDER=azure
AZURE_OPENAI_ENDPOINT=https://...
```

## 📊 監控和告警

DigitalOcean 會自動監控：

- ✅ 部署失敗
- ✅ 域名問題
- ✅ CPU 使用率 > 80%
- ✅ 內存使用率 > 80%
- ✅ 重啟次數 > 5

告警會通過 Email 發送。

## 🔄 持續部署

每次推送到 `main` 分支都會自動觸發部署：

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
# DigitalOcean 會自動開始部署
```

## 🗄️ 數據庫管理

### 連接數據庫

```bash
# 方式 1: 使用 DigitalOcean Console
# Apps → 你的 App → Database → Connection Details

# 方式 2: 使用 doctl
doctl databases connection <database-id> --app-id <app-id>
```

### 運行遷移

```bash
# 在本地連接生產數據庫
export DATABASE_URL="postgresql://..."
pnpm db:migrate
```

### 備份

DigitalOcean 會自動進行每日備份（保留 7 天）。

## 🆘 故障排除

### 部署失敗

1. 檢查構建日誌：Apps → Activity Tab → 點擊失敗的部署
2. 常見問題：
   - `OPENAI_API_KEY not found` → 檢查環境變數是否設置
   - `Prisma Client not found` → 確認 `postinstall` hook 正常運行
   - `Database connection failed` → 檢查 `DATABASE_URL` 是否正確注入

### AI 功能不工作

```bash
# 1. 檢查環境變數
doctl apps list
doctl apps get <app-id>

# 2. 查看運行時日誌
doctl apps logs <app-id> --type run

# 3. 測試 AI client
curl -X POST https://你的域名/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"測試","direction":"zh-to-en"}'
```

### 性能問題

1. 檢查 Metrics：Apps → Metrics Tab
2. 如需升級：
   - `basic-xs` → `professional-xs`（更多 CPU/RAM）
   - 修改 `.do/app.yaml` 中的 `instance_size_slug`
   - 推送更改自動升級

## 🔐 安全建議

1. ✅ 定期輪換 `NEXTAUTH_SECRET` 和 `OPENAI_API_KEY`
2. ✅ 使用 DO Secrets 管理敏感信息
3. ✅ 啟用 HTTPS（DO 自動提供）
4. ✅ 設置 Rate Limiting（已在代碼中實現）
5. ✅ 監控 API 使用量（OpenRouter Dashboard）

## 📚 相關文檔

- [DigitalOcean App Platform 文檔](https://docs.digitalocean.com/products/app-platform/)
- [doctl 安裝指南](https://docs.digitalocean.com/reference/doctl/how-to/install/)
- [Looper-HQ 主文檔](../README.md)
- [AI Client 使用指南](../packages/utils/src/ai-client.ts)

## 🎉 完成

現在你的 Looper-HQ 已成功部署到 DigitalOcean！

訪問：`https://你的域名.ondigitalocean.app`

默認管理員賬戶：
- Email: `admin@looper-hq.app`
- Password: `admin123`

**請立即更改密碼！** 🔒
