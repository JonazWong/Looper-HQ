# Digital Ocean Prisma 部署修復指南

## 🔍 問題診斷

您遇到的錯誤：
```
Prisma client generation failed
Missing prisma script
Environment configuration issue (DATABASE_URL not available at build time)
```

## ✅ 已修復的問題 (5 個)

### 1. 重複的 Prisma Schema 檔案
**問題：** 存在兩個 Prisma schema 造成衝突
- ❌ `apps/web/prisma/schema.prisma` (重複，錯誤)
- ✅ `packages/database/prisma/schema.prisma` (正確)

**修復：** 
- 已更新 `.gitignore` 忽略 `apps/*/prisma/` 目錄
- 重複檔案不存在或已被忽略

### 2. DATABASE_URL 環境變數 Scope 錯誤
**問題：** `DATABASE_URL` 只在 `RUN_TIME` 可用，但 Prisma generate 在 `BUILD_TIME` 執行

**修復：** 
- 已更改 scope 為 `RUN_AND_BUILD_TIME` (在 app.yaml)
- Prisma generate 現在可以在構建階段訪問 DATABASE_URL

### 3. Dockerfile 構建階段缺少 DATABASE_URL
**問題：** Digital Ocean 在 Docker 構建階段沒有注入環境變數，導致 Prisma generate 失敗

**修復：**
- 在 Dockerfile 的 `deps` 和 `builder` 階段設置佔位符 DATABASE_URL
- Prisma generate 只需要環境變數存在，不需要真實連接
- 運行時會使用真實的 DATABASE_URL (從 app.yaml 注入)

### 4. 缺少 'prisma' script
**問題：** Digital Ocean 自動檢測期望在 database package 中找到名為 'prisma' 的 script

**修復：**
- 在 `packages/database/package.json` 添加 `"prisma": "prisma generate"` script
- 保留原有的 `"generate"` script 以保持向後兼容

### 5. DATABASE_URL 重複定義 (已移除)
**問題：** `app.yaml` 中 `DATABASE_URL` 定義了兩次

**修復：** 
- 已移除加密的重複定義
- 保留正確的數據庫連接引用：`${db-postgresql-sgp1-75753.DATABASE_URL}`

## 🛠️ 手動執行步驟

### 步驟 1：驗證本地構建（可選）

```bash
# 安裝依賴（會自動執行 prisma generate）
pnpm install --frozen-lockfile

# 驗證 Prisma Client 是否生成成功
ls node_modules/.prisma/client

# 測試構建
pnpm build
```

### 步驟 3：提交並推送變更

```bash
git status
git add .
git commit -m "fix(deployment): remove duplicate Prisma schema and fix DO config"
git push origin main
```

### 步驟 4：監控 Digital Ocean 部署

1. 前往 Digital Ocean App Platform 控制台
2. 查看新的2：提交並推送變更

```bash
git status
git add .
git commit -m "fix(deployment): resolve all Prisma generation issues

- Add placeholder DATABASE_URL in Dockerfile build stages
- Fix DATABASE_URL scope to RUN_AND_BUILD_TIME in app.yaml
- Remove duplicate DATABASE_URL definition
- Update .gitignore to prevent duplicate Prisma schemas"
git push origin main
```

### 步驟 3Q/
├── packages/
│   └── database/
│       ├── prisma/
│       │   └── schema.prisma          ✅ 唯一的 schema 檔案
│       └── package.json
│           └── scripts.generate: "prisma generate"
├── apps/
│   └── web/
│       ├── lib/db.ts                  ✅ 從 @prisma/client 導入
│       └── (無 prisma/ 目錄)          ✅ 正確
└── package.json
    └── postinstall: "pnpm --filter=@looper-hq/database generate"
```

## 🔧 Dockerfile 驗證清單設置佔位符 DATABASE_URL
- [x] **deps stage**: 執行 `prisma generate`
- [x] **deps stage**: 驗證 `.prisma/client` 存在
- [x] **builder stage**: 設置佔位符 DATABASE_URL
- [x] **builder stage**: 再次執行 `prisma generate`（確保最新）
- [x] **runner stage**: 複製生成的 `.prisma` 目錄
- [x] **runner stage**: 使用真實的 DATABASE_URL（從 app.yaml 注入）

- [x] **deps stage**: 複製 `packages/database/prisma` schema
- [x] **deps stage**: 執行 `prisma generate`
- [x] **builder stage**: 再次執行 `prisma generate`（確保最新）
- [x] **runner stage**: 複製生成的 `.prisma` 目錄
- [x] **runner stage**: Fallback 機制（若客戶端缺失則重新生成）

## 🧪 本地測試 Docker 構建

```bash
# 測試完整的 Docker 構建流程
docker build -t looper-hq-test .

# 驗證 Prisma Client 是否存在
docker run --rm looper-hq-test ls -la /app/node_modules/.prisma/client
```

## ⚠️ 常見錯誤預防

### 不要創建 apps/*/prisma/ 目錄

**在 app.yaml 中（運行時）：**
```yaml
- key: DATABASE_URL
  scope: RUN_AND_BUILD_TIME    # ⭐ 構建和運行時都可用
  value: ${db-postgresql-sgp1-75753.DATABASE_URL}
```

**在 Dockerfile 中（構建階段）：**
```dockerfile
# 設置標準格式的 DATABASE_URL（Prisma 驗證需要）
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/looper_hq"

# 直接在 schema 目錄執行生成（避免 workspace 路徑問題）
RUN cd packages/database && npx prisma generate && cd /app
```

**關鍵改進：**
- ✅ 使用 `npx prisma generate` 而非 `pnpm --filter`（避免 workspace 解析問題）
- ✅ 在 schema 所在目錄執行（確保路徑正確）
- ✅ 所有驗證都是非致命的（不會中斷構建）
- ✅ 詳細日誌幫助診斷問題
**為什麼需要 BUILD_TIME：**
- ✅ Prisma generate 在構建階段執行
- ✅ 雖然不會實際連接數據庫，但需要環境變數存在
- ✅ 確保 schema validation 通過

### 構建環境變數
確保 `NODE_ENV=production` 在 `RUN_AND_BUILD_TIME` scope

## 📞 如果仍有問題

1. **檢查 Digital Ocean 構建日誌**
   - 搜尋 "prisma generate" 相關輸出
   - 確認 schema 路徑是否正確

2. **驗證 pnpm workspace 配置**
   ```bash
   pnpm list @prisma/client
   # 應該只顯示一個來源：packages/database
   ```

3. **手動觸發重新部署**
   - 在 Digital Ocean 控制台點擊 "Force Rebuild"

## ✅ 成功指標

部署成功後，您應該看到：
- ✅ Health check 通過 `/api/health`
- ✅ 應用程式啟動於 port 3005
- ✅ 數據庫連接成功
- ✅ 無 Prisma 相關錯誤

---

**修復完成時間：** 2026-02-16  
**最後更新：** 2026-02-16 21:00 (修復 COPY 命令語法錯誤，簡化為始終在 runner 生成)

**修復內容：**
1. 修復 COPY 命令語法錯誤（移除不支持的 `|| true`）
2. 確保所有 COPY 多文件時目標路徑以 `/` 結尾  
3. 簡化策略：在 runner 階段始終重新生成 Prisma client（最可靠）
4. 使用 `npx prisma generate` 直接在 schema 目錄執行
5. 添加詳細日誌和驗證步驟
6. 在所有階段設置標準格式的 DATABASE_URL
7. 修正 app.yaml 中 DATABASE_URL scope 為 `RUN_AND_BUILD_TIME`
8. 在 packages/database/package.json 添加 'prisma' script
