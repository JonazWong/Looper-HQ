# 🔄 Digital Ocean 遷移指南 - Agency → Looper HQ

## 📋 遷移概述

**遷移類型**: 直接替換（In-place Upgrade）  
**預計時間**: 30 分鐘  
**預計停機**: 5-10 分鐘  
**難度等級**: ⭐⭐☆☆☆ (簡單)

---

## ✅ 遷移前檢查清單

### 必要條件

- [ ] 所有 Looper HQ PR 已合併到 main 分支
- [ ] 本地測試通過（`pnpm dev` 可正常運行）
- [ ] 已準備 OpenRouter API Key
- [ ] 已備份 Digital Ocean 數據庫（以防萬一）
- [ ] 已截圖保存當前環境變數配置

### 可選條件

- [ ] 通知團隊成員（如有）
- [ ] 準備回滾計劃（保留 Agency repo）

---

## 📦 第 1 步：備份現有系統（5 分鐘）

### 1.1 備份數據庫

```bash
# 在 Digital Ocean Console
1. 進入 Databases → [你的數據庫名稱]
2. 點擊 "Backups & Restore"
3. 點擊 "Create Backup"
4. 命名: "pre-looper-hq-migration-YYYY-MM-DD"
5. 等待完成（約 1-2 分鐘）
```

### 1.2 導出環境變數

```bash
# 在 Digital Ocean Console
1. 進入 Apps → [你的 App 名稱]
2. 點擊 Settings → 向下滾動到 "Environment Variables"
3. 點擊 "..." → 全選 → 複製
4. 保存到本地文件: agency-env-backup.txt
```

### 1.3 記錄當前配置

截圖保存：
- App 名稱
- 域名設置
- 數據庫連接
- 資源配置（RAM/CPU）

---

## 🔧 第 2 步：準備新環境變數（5 分鐘）

### 2.1 創建環境變數列表

**檔案**: `.env.production` (本地參考，不要提交)

```bash
# ============================================
# Looper HQ - Production Environment Variables
# ============================================

# === App Configuration ===
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# === Database (自動注入，無需修改) ===
DATABASE_URL=${db.DATABASE_URL}

# === Authentication ===
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<使用 openssl rand -base64 32 生成>

# === Google OAuth (可選) ===
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# === OpenRouter AI (新增 - 必需) ===
OPENAI_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=anthropic/claude-3.5-sonnet

# === Optional Features ===
# SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
# SENTRY_DSN=https://xxx@sentry.io/xxx
```

### 2.2 生成必需的密鑰

```bash
# 在本地終端執行
openssl rand -base64 32
# 複製輸出，用作 NEXTAUTH_SECRET
```

### 2.3 獲取 OpenRouter API Key

```bash
1. 訪問: https://openrouter.ai/keys
2. 登入或註冊帳號
3. 點擊 "Create Key"
4. 命名: "Looper HQ Production"
5. 複製 API Key (sk-or-v1-xxx...)
6. 保存到安全位置
```

---

## 🚀 第 3 步：執行遷移（15 分鐘）

### 3.1 修改 App Source

```bash
# 在 Digital Ocean Console
1. Apps → [你的 App 名稱]
2. Settings → 找到 "Source" 區域
3. 點擊 "Edit"

修改為：
- Repository: JonazWong/Looper-HQ
- Branch: main
- Autodeploy: ✅ 啟用

4. 點擊 "Save"
```

### 3.2 更新 Build 配置

```bash
# 仍在 Settings 頁面
1. 向下滾動到 "Build Command"

修改為：
Build Command: pnpm install && pnpm build --filter=@looper-hq/web

Run Command: cd apps/web && pnpm start

2. 點擊 "Save"
```

### 3.3 更新環境變數

```bash
# 在 Settings → Environment Variables
1. 點擊 "Edit"
2. 點擊 "Bulk Editor"

3. 添加新變數（保留舊的，添加這些）:

OPENAI_API_KEY=sk-or-v1-xxx...
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=anthropic/claude-3.5-sonnet
NEXTAUTH_SECRET=<你生成的密鑰>
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com

4. 點擊 "Save"
```

### 3.4 觸發部署

```bash
# 在 App 頁面
1. 點擊右上角 "Actions"
2. 選擇 "Force Rebuild and Deploy"
3. 確認 "Deploy"

⏰ 部署時間: 5-10 分鐘
```

---

## ✅ 第 4 步：驗證部署（5 分鐘）

### 4.1 監控部署日誌

```bash
# 在 Digital Ocean Console
1. Apps → [你的 App] → "Runtime Logs"
2. 查看實時日誌

✅ 成功標誌:
- "Build successful"
- "Starting server..."
- "Server running on port 3000"

❌ 錯誤標誌:
- "Build failed"
- "Module not found"
- "Error: ..."
```

### 4.2 測試網站訪問

```bash
# 在瀏覽器訪問
https://your-domain.com

✅ 檢查項目:
- [ ] 首頁正常載入
- [ ] 看到新的 Looper HQ Logo
- [ ] 沒有 404 或 500 錯誤
- [ ] 頁面載入速度正常
```

### 4.3 測試核心功能

```bash
# 1. 健康檢查 API
https://your-domain.com/api/health

預期返回:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-02-09T..."
}

# 2. 測試語言切換
訪問: https://your-domain.com/zh
訪問: https://your-domain.com/en
✅ 兩個都應該正常顯示

# 3. 測試登入/註冊
訪問: https://your-domain.com/auth/login
✅ 頁面正常載入

# 4. 測試搜索功能
訪問: https://your-domain.com/search
✅ 搜索框正常顯示

# 5. 測試 AI 分類（如果有測試數據）
# 訪問儀表板，嘗試 AI 分類功能
```

### 4.4 檢查數據庫遷移

```bash
# 在 Digital Ocean Console
1. Apps → [你的 App] → Console
2. 執行:

cd packages/database
pnpm prisma migrate status

✅ 預期輸出:
"Database schema is up to date!"
```

---

## 🎉 第 5 步：遷移完成後續（5 分鐘）

### 5.1 更新文檔

```bash
# 在本地
1. 更新 README.md 的部署連結
2. 提交變更:

git add README.md
git commit -m "docs: update production URL to Looper HQ"
git push origin main
```

### 5.2 通知相關人員

```bash
✅ 遷移完成通知模板:

主題: Looper HQ 系統升級完成

內容:
- ✅ 系統已升級為 Looper HQ
- 🌐 訪問地址不變: https://your-domain.com
- 🆕 新功能:
  - AI 智能案例分類
  - 中英雙語切換
  - 增強全文搜索
  - 優化登入系統
- 📊 停機時間: 5 分鐘
- 🔒 數據已備份
```

### 5.3 刪除舊備份（可選，30 天後）

```bash
# 如果確認一切正常，30 天後可以刪除
# Digital Ocean → Databases → Backups
# 刪除 "pre-looper-hq-migration-XXX" 備份
```

---

## 🆘 故障排除

### 問題 1: 部署失敗 - "Build Error"

**症狀**: Build logs 顯示錯誤

**解決方案**:
```bash
1. 檢查 package.json 中的 build 命令
2. 確認 pnpm-lock.yaml 已提交
3. 查看錯誤日誌，搜尋 "Error:"
4. 常見原因:
   - 缺少環境變數
   - TypeScript 類型錯誤
   - 依賴安裝失敗

5. 修復後重新部署:
Apps → Actions → Force Rebuild
```

### 問題 2: 網站顯示 "Application Error"

**症狀**: 訪問網站顯示錯誤頁面

**解決方案**:
```bash
1. 檢查環境變數
   - NEXTAUTH_SECRET 是否設置？
   - DATABASE_URL 是否正確？
   - NEXTAUTH_URL 是否匹配域名？

2. 檢查數據庫連接
   Apps → Console → 執行:
   psql $DATABASE_URL -c "SELECT 1"

3. 查看 Runtime Logs
   Apps → Runtime Logs
   搜尋 "Error" 或 "Failed"

4. 重啟 App
   Apps → Actions → Restart
```

### 問題 3: AI 分類功能無法使用

**症狀**: 點擊 AI 分類按鈕沒反應或顯示錯誤

**解決方案**:
```bash
1. 檢查 OpenRouter API Key
   Settings → Environment Variables
   確認 OPENAI_API_KEY 已設置

2. 測試 API Key
   Apps → Console → 執行:
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://openrouter.ai/api/v1/models

3. 檢查 API 餘額
   訪問: https://openrouter.ai/credits
```

### 問題 4: 雙語切換不生效

**症狀**: 語言切換按鈕沒反應

**解決方案**:
```bash
1. 確認 i18n 配置已部署
   檢查是否有 messages/ 目錄

2. 清除瀏覽器緩存
   Ctrl + Shift + Delete

3. 檢查路由配置
   訪問: /zh 和 /en 應該都能訪問
```

---

## 🔙 回滾計劃（萬一需要）

如果遷移後發現重大問題，可以快速回滾：

### 回滾步驟（5 分鐘）

```bash
# 在 Digital Ocean Console

1. Apps → [你的 App] → Settings → Source
   修改 Repository: JonazWong/HK-Legal-Case-Agency
   修改 Branch: main
   點擊 Save

2. Apps → Actions → Force Rebuild and Deploy

3. 恢復舊的環境變數（使用之前保存的 agency-env-backup.txt）

4. 等待部署完成（5 分鐘）

✅ 系統回滾到遷移前狀態
```

---

## 📊 遷移檢查表

### 遷移前 (Pre-Migration)
- [ ] ✅ 備份數據庫
- [ ] ✅ 導出環境變數
- [ ] ✅ 截圖當前配置
- [ ] ✅ 生成新密鑰
- [ ] ✅ 獲取 OpenRouter API Key

### 遷移中 (Migration)
- [ ] ✅ 修改 App Source
- [ ] ✅ 更新 Build 配置
- [ ] ✅ 添加新環境變數
- [ ] ✅ 觸發部署

### 遷移後 (Post-Migration)
- [ ] ✅ 檢查部署日誌
- [ ] ✅ 測試網站訪問
- [ ] ✅ 測試健康檢查 API
- [ ] ✅ 測試語言切換
- [ ] ✅ 測試登入功能
- [ ] ✅ 測試搜索功能
- [ ] ✅ 測試 AI 分類
- [ ] ✅ 更新文檔
- [ ] ✅ 通知相關人員

---

## 🎯 預期結果

遷移成功後，您將擁有：

✅ **相同的域名和 URL**  
✅ **更強大的功能**（AI 分類、雙語、全文搜索）  
✅ **相同的成本**（$20/月）  
✅ **更好的架構**（Monorepo、TypeScript）  
✅ **完整的文檔**（部署、開發、測試）  
✅ **持續集成**（GitHub Actions CI/CD）

---

## 📞 需要幫助？

如果遇到任何問題：

1. 查看故障排除章節
2. 檢查 GitHub Issues: https://github.com/JonazWong/Looper-HQ/issues
3. 查看部署日誌
4. 聯繫技術支持

---

**遷移完成後，記得慶祝！🎉**
