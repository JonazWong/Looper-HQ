# 🚀 快速部署指南

## 最簡單的部署流程（5 步驟）

### 1️⃣ 推送到 GitHub
```bash
cd "d:\Looper HQ Platform\Looper-HQ"
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### 2️⃣ 修改配置文件
編輯 `.do/app.yaml`，替換以下內容：
- `your-domain.com` → 您的實際域名
- `JonazWong/HK-Legal-Case-Agency` → 您的 GitHub repo 路徑

### 3️⃣ 在 DigitalOcean 創建 App
1. 登入 https://cloud.digitalocean.com/apps
2. 點擊 "Create App"
3. 選擇 GitHub，連接您的 repo
4. 選擇 `main` 分支
5. App Platform 會自動讀取 `.do/app.yaml`

### 4️⃣ 設置環境變數
在 App Platform 的 Environment Variables 設置：

**必需變數：**
```
NEXTAUTH_SECRET=<使用 openssl rand -base64 32 生成>
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

其他變數會自動注入（DATABASE_URL）或可選（GOOGLE_CLIENT_ID）。

### 5️⃣ 部署並設置域名
1. 點擊 "Create Resources"
2. 等待建置完成（約 5-10 分鐘）
3. 在 Settings → Domains 添加您的域名
4. 更新域名的 DNS 記錄（CNAME 到 App Platform 提供的地址）
5. 等待 DNS 傳播（5-30 分鐘）

## ✅ 完成！

訪問您的域名，系統應該正常運行。

**詳細說明請參考：** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📝 部署後首次設置

### 創建管理員帳號
1. 訪問 `/register` 註冊第一個帳號
2. 或在資料庫中手動創建

### 測試功能
- [ ] 公開頁面可訪問
- [ ] 登入功能正常
- [ ] Dashboard 正常運作
- [ ] 資料庫讀寫正常

---

## 🔄 更新部署

只需推送代碼到 GitHub，App Platform 會自動部署：

```bash
git add .
git commit -m "Update feature"
git push origin main
```

DigitalOcean 會自動：
- 建置新版本
- 執行健康檢查
- 零停機時間部署

---

**估計成本：** ~$27/月（Web + Database）
**部署時間：** ~15 分鐘
**維護難度：** 低（自動化部署 + 自動備份）
