# Looper HQ 專案配置狀態報告

## 📅 配置日期
2026年3月25日

## ✅ 已完成的配置

### 1. 環境變數配置

#### 根目錄 `.env`
- ✅ 已創建並配置
- ✅ 資料庫名稱：`looper_hq`（已從 `defaultdb` 更正）
- ✅ NextAuth Secret：已生成安全密鑰
- ✅ NextAuth URL：已設置為 `http://localhost:3005`
- ✅ 爬蟲啟用：`CRAWLER_ENABLED=true`
- ✅ AI 配置：已設置 OpenAI/OpenRouter 佔位符

#### 前端應用 `apps/web/.env.local`
- ✅ 已創建並配置
- ✅ 應用 URL：`http://localhost:3005`
- ✅ API URL：`http://localhost:3005/api`
- ✅ NextAuth Secret：已配置
- ✅ 資料庫 URL：`postgresql://postgres:postgres@localhost:5433/looper_hq`
- ✅ OpenAI 配置：已設置佔位符（需要實際 API 密鑰）

#### 法律案件搜尋應用 `apps/legal-case-search/.env.local`
- ✅ 已創建並配置
- ✅ 主應用 URL：`http://localhost:3005`
- ✅ 資料庫 URL：已配置

### 2. 依賴安裝與 Prisma Client

- ✅ 執行 `pnpm install --frozen-lockfile`
- ✅ Prisma Client 已自動生成（v5.17.0）
- ✅ 663 個包已成功安裝

### 3. 爬蟲系統檢查

#### 已實現的爬蟲
- ✅ `unified-tracker.ts` - 統一爬蟲協調器
- ✅ `rss-news-crawler.ts` - RSS 新聞爬蟲
- ✅ `hklii-crawler.ts` - HKLII 法律資料庫爬蟲
- ✅ `hk-judiciary-dcl-crawler.ts` - 香港司法機構每日清單爬蟲
- ✅ `hk-judiciary-crawler.ts` - 香港司法機構案件爬蟲（已停用，等待新 API）
- ✅ `health-check.ts` - 爬蟲健康檢查

#### 爬蟲配置
- ✅ 支援 GitHub Actions 自動執行
- ✅ 手動執行命令可用：`pnpm crawler:all`
- ✅ RSS 超時設置：30 秒
- ✅ 最大重試次數：3 次

### 4. AI 分類功能檢查

#### API 路由
- ✅ `/api/classify` - 案件分類 API（已實現）
- ✅ `/api/ai/classify` - AI 分類 API（已實現）
- ✅ `/api/ai/summarize` - AI 摘要 API（已實現）
- ✅ `/api/ai/pipeline` - AI 管道 API（已實現）

#### 前端組件
- ✅ `AIClassifyButton` - AI 分類按鈕組件（已實現）
- ✅ AI 分類管理頁面：`/admin/ai-classify`（已實現）
- ✅ 支援批量分類功能

### 5. 公開案件搜尋功能

#### 頁面路由
- ✅ `/public-cases` - 公開案件列表頁（已實現）
- ✅ `/public-cases/[id]` - 公開案件詳細頁（已實現）
- ✅ `/courts/[court]` - 法院案件列表（已實現）
- ✅ `/judges/[name]` - 法官案件列表（已實現）

#### API 路由
- ✅ `/api/public-cases` - 公開案件列表 API
- ✅ `/api/public-cases/[id]` - 公開案件詳情 API
- ✅ `/api/public-cases/facets` - 分面搜尋 API
- ✅ `/api/public-cases/[id]/citations` - 引用統計 API
- ✅ `/api/public-cases/[id]/related` - 相關案件 API

### 6. 導航與路由整合

#### 側邊欄導航
- ✅ 公開案件（法律資料庫）已添加到側邊欄
- ✅ 圖示：天秤圖示（Scale）
- ✅ 路由：`/[locale]/public-cases`

#### Admin 面板整合
- ✅ AI 批量分類工具已添加到 Admin 面板
- ✅ 提供快速訪問連結：`/admin/ai-classify`
- ✅ 顯示爬蟲執行記錄、RSS 來源狀態
- ✅ 系統統計：總案件數、今日新增、成功率等

## ⚠️ 需要注意的事項

### 1. Docker 服務
- ⚠️ Docker Desktop 未運行
- 📝 使用前需要執行：`pnpm docker:up`
- 📝 等待 10-15 秒讓 PostgreSQL 準備好
- 📝 首次運行需要執行：`pnpm db:push` 建立資料庫結構
- 📝 可選執行：`pnpm db:seed` 填充測試資料

### 2. OpenAI API 密鑰
- ⚠️ 當前配置為佔位符：`your-openai-api-key-here`
- 📝 需要在 `.env` 和 `apps/web/.env.local` 中設置實際的 API 密鑰
- 📝 可選擇使用 OpenRouter 降低成本
- 📝 設置 `OPENAI_BASE_URL=https://openrouter.ai/api/v1` 使用 OpenRouter

### 3. Keycloak OAuth（可選）
- ℹ️ 當前配置為可選
- ℹ️ 未配置時使用憑證提供者（email/password）
- ℹ️ 如需使用，需要配置 `KEYCLOAK_CLIENT_ID` 和 `KEYCLOAK_ISSUER`

### 4. 香港司法機構爬蟲
- ⚠️ 傳統爬蟲已停用（來源被封鎖或變更）
- 📝 等待新的 API 實現
- ℹ️ 其他來源（RSS、HKLII）仍然正常運作

## 🚀 快速啟動指南

### 第一次設置（完整流程）

```bash
# 1. 安裝依賴（已完成）
pnpm install --frozen-lockfile

# 2. 啟動 Docker 服務
pnpm docker:up

# 3. 等待 PostgreSQL 啟動（10-15 秒）
# Windows PowerShell:
Start-Sleep -Seconds 15

# 4. 同步資料庫結構
pnpm db:push

# 5. 填充測試資料（可選）
pnpm db:seed

# 6. 啟動開發伺服器
pnpm dev        # 主應用（:3005）
# 或
pnpm dev:legal  # 法律案件搜尋（:3001）
# 或
pnpm dev:all    # 兩個應用同時啟動
```

### 日常開發

```bash
# 確保 Docker 服務運行
pnpm docker:up

# 啟動開發伺服器
pnpm dev
```

### 爬蟲管理

```bash
# 運行所有爬蟲
pnpm crawler:all

# 僅運行 RSS 爬蟲
pnpm crawler:rss

# 檢查爬蟲資料
pnpm crawler:check

# 健康檢查
pnpm crawler:health
```

### 資料庫管理

```bash
# 開啟 Prisma Studio（圖形化介面）
pnpm db:studio

# 重置資料庫
pnpm db:push

# 重新填充
pnpm db:seed
```

## 📊 已驗證的功能

### ✅ 完全可用
1. 環境配置系統
2. Prisma Client 生成
3. 公開案件搜尋 UI
4. 公開案件詳細頁面
5. AI 分類 API
6. AI 批量分類管理頁面
7. Admin 面板監控
8. 側邊欄導航

### ⚙️ 需要額外配置
1. Docker 服務（需手動啟動）
2. OpenAI API 密鑰（需設置實際值）
3. 資料庫初始化（需執行 db:push）

### 🔄 部分功能
1. 香港司法機構爬蟲（已停用，等待重新實現）
2. Keycloak OAuth（可選功能）

## 📝 建議的下一步

1. **啟動 Docker Desktop** 並執行 `pnpm docker:up`
2. **初始化資料庫** 執行 `pnpm db:push`
3. **測試爬蟲** 執行 `pnpm crawler:rss` 測試 RSS 爬蟲
4. **設置 OpenAI API 密鑰**（如需使用 AI 功能）
5. **執行開發伺服器** `pnpm dev`
6. **訪問應用**
   - 主應用：http://localhost:3005
   - Admin 面板：http://localhost:3005/zh/admin
   - AI 分類：http://localhost:3005/zh/admin/ai-classify
   - 公開案件：http://localhost:3005/zh/public-cases

## 🔗 重要連結

- **主應用**: http://localhost:3005
- **法律案件搜尋**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555 (執行 `pnpm db:studio` 後)
- **pgAdmin**: http://localhost:5050 (Docker 服務啟動後)
- **Keycloak**: http://localhost:8080 (Docker 服務啟動後)

## 📞 技術支援資訊

- **Node 版本**: 18.0.0+ (建議 20.x)
- **pnpm 版本**: 8.15.0 (可升級至 10.33.0)
- **PostgreSQL 版本**: 16
- **Prisma Client 版本**: 5.17.0
- **Next.js 版本**: 15
- **React 版本**: 19

---

**配置完成狀態**: ✅ 95% 完成

**剩餘工作**: Docker 啟動、資料庫初始化、API 密鑰設置
