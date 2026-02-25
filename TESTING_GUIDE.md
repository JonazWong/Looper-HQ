# Looper HQ 測試指南
## PR #199 功能測試清單

**測試日期**: 2026年2月25日  
**測試範圍**: Landing Page 重設計、會員面板、管理員面板、爬蟲配置整合

---

## 🚀 快速啟動

### **一鍵啟動** (推薦)
```powershell
./start-dev.ps1
```

### **手動啟動**
```bash
# 1. 啟動 Docker
pnpm docker:up

# 2. 等待 PostgreSQL 啟動
sleep 15

# 3. 安裝依賴並生成 Prisma Client
pnpm install --frozen-lockfile
pnpm --filter=@looper-hq/database prisma generate

# 4. 同步數據庫
pnpm db:push

# 5. 填充測試數據
pnpm db:seed

# 6. 啟動開發服務器
pnpm dev  # 主應用 port 3005
```

---

## 🧪 測試賬號

| 角色 | 郵箱 | 密碼 | 權限 |
|------|------|------|------|
| **管理員** | admin@looperhq.com | 任意 | 全部功能 |
| **律師** | lawyer@looperhq.com | 任意 | 案件、客戶管理 |
| **客戶** | wong.client@example.com | 任意 | 僅自己的案件 |

> **注意**: 開發模式下，Credentials Provider 不驗證密碼，任意密碼均可登入

---

## ✅ 測試清單

### **1. Landing Page 重設計** ✨

訪問: [http://localhost:3005](http://localhost:3005) 或 `/zh` / `/en`

- [ ] **ParticleBackground 粒子效果** (40 個粒子，金色/紫色)
- [ ] **雙語切換** (中英文)
  - [ ] 語言切換器正常工作
  - [ ] 所有文字正確翻譯
- [ ] **Hero Section**
  - [ ] 標題動畫正常
  - [ ] CTA 按鈕跳轉正確 (`/zh/case-search`, `/zh/register`)
- [ ] **統計數據網格**
  - [ ] 四個統計卡片正常顯示
  - [ ] 數字和圖標正確渲染
- [ ] **功能特點 Section**
  - [ ] 6 個功能卡片完整顯示
  - [ ] 圖標正確渲染
- [ ] **數據源 Section**
  - [ ] 3 個數據源卡片（HKLII, RSS, HK Judiciary）
- [ ] **4-Tier 定價方案**
  - [ ] Basic, Pro, Business, Enterprise 四個方案
  - [ ] 價格正確顯示
  - [ ] CTA 按鈕樣式正確（金色/次要）
- [ ] **Footer**
  - [ ] 版權信息正確
  - [ ] Looper HQ 標題顯示

---

### **2. 會員資料庫 (Member Portal)** 🔍

訪問: [http://localhost:3005/zh/services](http://localhost:3005/zh/services)

#### **頁面佈局**
- [ ] 標題顯示「會員資料庫」(中) / "Member Portal" (英)
- [ ] 歡迎訊息顯示當前用戶名稱

#### **個人統計卡片** (2x4 網格)
- [ ] 今日搜尋次數
- [ ] 已儲存文件數 (placeholder: 0)
- [ ] 已下載 PDF 數 (placeholder: 0)
- [ ] 會員等級 (顯示「公眾版」)

#### **快速搜索區塊**
- [ ] 搜索輸入框正常
- [ ] Enter 鍵觸發搜索
- [ ] 搜索按鈕跳轉到 `/case-search?q=keyword`
- [ ] 熱門標籤顯示（6 個標籤）
  - 中文: 商業訴訟、刑事案件、家庭法、物業糾紛、勞工法、公司法
  - 英文: Commercial Litigation, Criminal, Family Law, Property, Employment, Corporate
- [ ] 點擊標籤正確跳轉

#### **最近搜尋記錄**
- [ ] API 調用成功 (`/api/search-history`)
- [ ] 顯示模擬數據（3 條記錄）
- [ ] 顯示關鍵字、結果數量、時間戳
- [ ] 點擊放大鏡圖標跳轉到搜索

#### **資料庫更新區塊**
- [ ] API 調用成功 (`/api/stats/database`)
- [ ] 今日新增案件數正確
- [ ] 總法案數量正確
- [ ] 爬蟲最後運行時間顯示
- [ ] 系統健康狀態顯示（綠色=正常，黃色=警告，紅色=錯誤）

#### **快速連結**
- [ ] 3 個連結正確（Case Database, Forms Repository, AI Smart Search）
- [ ] Hover 效果正常
- [ ] 跳轉正確

---

### **3. 管理員面板 (Admin Panel)** 🔒

訪問: [http://localhost:3005/zh/admin](http://localhost:3005/zh/admin)

> **重要**: 必須使用 **admin@looperhq.com** 登入才能訪問

#### **權限控制**
- [ ] 非管理員訪問時被拒絕（403 或重定向）
- [ ] 管理員成功訪問

#### **爬蟲監控概覽**
- [ ] 顯示活躍源數量、錯誤源數量
- [ ] 成功率進度條正確計算
- [ ] 顏色根據成功率變化（綠色 >80%, 黃色 50-80%, 紅色 <50%）

#### **RSS 源表格**
- [ ] 表格正確顯示所有 RSS 源
- [ ] 列: 名稱、URL、狀態徽章、最後抓取時間、錯誤信息
- [ ] 狀態徽章顏色正確
  - ACTIVE: 綠色
  - IDLE: 灰色
  - ERROR: 紅色
- [ ] 最後抓取時間格式化為本地時間
- [ ] 錯誤信息顯示（如果有）

#### **系統設置區塊** (placeholder)
- [ ] 全局開關顯示（目前為靜態）
- [ ] 成功率閾值顯示

---

### **4. Sidebar 導航增強** 📍

登入後訪問任意 Dashboard 頁面

#### **基本導航**
- [ ] Dashboard
- [ ] Cases
- [ ] Clients
- [ ] Search
- [ ] **Services** (會員資料庫) - **新增** ✨
- [ ] Documents
- [ ] Calendar
- [ ] Settings

#### **管理員專屬導航** (僅 ADMIN 角色)
- [ ] **Admin** (管理員面板) 鏈接顯示 🔒
- [ ] 使用 ShieldCheck 圖標
- [ ] 非管理員登入時隱藏

#### **圖標測試**
- [ ] Services 使用 Database 圖標
- [ ] Admin 使用 ShieldCheck 圖標
- [ ] 所有圖標正確渲染

#### **翻譯測試**
- [ ] 中文: "會員資料庫", "管理員面板"
- [ ] 英文: "Member Portal", "Admin Panel"

---

### **5. 爬蟲配置整合** 🤖

#### **配置文件檢查**
```bash
# 檢查爬蟲配置模組
cat scripts/crawlers/crawler-config.ts

# 檢查黑名單模組
cat scripts/crawlers/source-blacklist.ts
```

- [ ] `crawler-config.ts` 存在並包含:
  - [ ] `defaultCrawlerConfig` 配置對象
  - [ ] `USER_AGENTS` 數組 (7 個瀏覽器)
  - [ ] `getRandomUserAgent()` 函數
  - [ ] `isKnownError()` 函數
  - [ ] `knownErrorPatterns` 包含 XML 錯誤

- [ ] `source-blacklist.ts` 存在並包含:
  - [ ] Ming Pao PNS (`news.mingpao.com/rss/pns`)
  - [ ] Ming Pao INS (`news.mingpao.com/rss/ins`)
  - [ ] RTHK (`rthk.hk`)

#### **RSS 爬蟲整合測試**
```powershell
./test-crawler-local.ps1
```

- [ ] 爬蟲啟動成功
- [ ] 黑名單源被跳過（Ming Pao INS）
- [ ] 顯示 "🚫 [X/X] Ming Pao Instant News...: Skipped (blacklisted)"
- [ ] 顯示黑名單原因
- [ ] 沒有錯誤日誌（或僅 WARNING 級別）

#### **司法機構爬蟲整合測試**
```powershell
./test-judiciary-crawler.ps1
```

- [ ] 爬蟲啟動成功
- [ ] 使用配置文件的超時時間 (15 秒)
- [ ] User-Agent 輪換工作
- [ ] 智能錯誤分類（已知錯誤為 ⚠️，未知錯誤為 ❌）
- [ ] 統計輸出正確

#### **配置值驗證**
在爬蟲運行日誌中檢查:
- [ ] 請求間隔: 2 秒 (rateLimitDelayMs)
- [ ] 重試次數: 最多 3 次 (maxRetries)
- [ ] 超時時間: 15 秒 (timeoutMs)
- [ ] 成功率閾值: 60% (successRateThreshold)

---

### **6. API 端點測試** 🔌

#### **Database Stats API**
```bash
curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  http://localhost:3005/api/stats/database
```

期望回應:
```json
{
  "success": true,
  "data": {
    "totalCases": 0,
    "todayNew": 0,
    "courtsCovered": 8,
    "formsCount": 0,
    "crawlerLastRun": "2026-02-25T...",
    "systemStatus": "healthy"
  }
}
```

- [ ] HTTP 200 狀態碼
- [ ] 返回正確的 JSON 結構
- [ ] `systemStatus` 根據爬蟲時間正確計算

#### **Search History API**
```bash
curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  "http://localhost:3005/api/search-history?limit=5"
```

期望回應:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "keyword": "商業訴訟",
      "resultCount": 156,
      "searchedAt": "2026-02-25T..."
    }
  ]
}
```

- [ ] HTTP 200 狀態碼
- [ ] 返回模擬數據（3 條記錄）
- [ ] `limit` 參數正常工作

---

### **7. 數據庫檢查** 💾

#### **Prisma Studio**
```bash
pnpm --filter=@looper-hq/database prisma studio
```

訪問: [http://localhost:5555](http://localhost:5555)

- [ ] 成功啟動
- [ ] 檢查 `public_cases` 表
  - [ ] 確認 `source` 枚舉包含 `HKGOVNEWS_RSS`
  - [ ] 確認 `source` 枚舉包含 `HK_JUDICIARY`
- [ ] 檢查 `rss_sources` 表
  - [ ] 確認有 HK Gov News 記錄 (isActive: false)
  - [ ] 確認有其他 RSS 源記錄

#### **SQL 驗證**
```sql
-- 檢查枚舉值
SELECT DISTINCT source FROM public_cases;

-- 檢查 RSS 源
SELECT name, source, is_active, status FROM rss_sources;

-- 檢查用戶角色
SELECT email, role FROM users;
```

- [ ] `HKGOVNEWS_RSS` 和 `HK_JUDICIARY` 在枚舉中
- [ ] 至少有一個 RSS 源記錄
- [ ] admin@looperhq.com 的 role 是 `ADMIN`

---

## 🐛 常見問題排查

### **問題 1: 無法訪問管理員面板**
**症狀**: 訪問 `/zh/admin` 時被拒絕或顯示空白

**解決方案**:
1. 確認使用 `admin@looperhq.com` 登入
2. 檢查 Session: 開發者工具 → Application → Cookies → `next-auth.session-token`
3. 確認 `apps/web/app/[locale]/(dashboard)/admin/page.tsx` 中有 `requireRole('ADMIN')`

### **問題 2: Sidebar 沒有顯示 Admin 鏈接**
**症狀**: 管理員登入後，Sidebar 仍未顯示 Admin 鏈接

**解決方案**:
1. 檢查 `session?.user?.role` 是否為 `'ADMIN'`
2. 確認 `useSession` 正確導入自 `next-auth/react`
3. 清除瀏覽器緩存並重新登入

### **問題 3: API 返回 401 Unauthorized**
**症狀**: `/api/stats/database` 或 `/api/search-history` 返回 401

**解決方案**:
1. 確認已登入
2. 檢查 middleware.ts 的 `isPublicApi` 配置
3. 確認 API 路由中有 `await requireAuth()`

### **問題 4: 爬蟲配置未生效**
**症狀**: 爬蟲仍使用硬編碼值

**解決方案**:
1. 確認 `crawler-config.ts` 導入正確
2. 檢查 `hk-judiciary-crawler.ts` 和 `rss-news-crawler.ts` 的 import 語句
3. 重新運行 `pnpm --filter=@looper-hq/database prisma generate`

### **問題 5: Services 頁面顯示空白**
**症狀**: `/zh/services` 無內容

**解決方案**:
1. 確認文件位於 `apps/web/app/[locale]/(dashboard)/services/page.tsx`
2. 檢查 `services/page.tsx` 是否已標記為 DEPRECATED
3. 清除 `.next` 緩存: `rm -rf apps/web/.next`

---

## 📊 測試報告模板

```markdown
## PR #199 測試報告

**測試人員**: [Your Name]
**測試日期**: 2026年2月25日
**環境**: Windows/macOS/Linux | Node 20 | pnpm 8

### 測試結果總結
- ✅ 通過: X/Y
- ⚠️  警告: X/Y
- ❌ 失敗: X/Y

### 詳細結果

#### Landing Page
- [✅/❌] ParticleBackground
- [✅/❌] 雙語切換
- [✅/❌] 4-Tier 定價

#### 會員面板
- [✅/❌] 個人統計
- [✅/❌] 快速搜索
- [✅/❌] API 數據加載

#### 管理員面板
- [✅/❌] 權限控制
- [✅/❌] RSS 源表格
- [✅/❌] 爬蟲統計

#### Sidebar 導航
- [✅/❌] Services 鏈接
- [✅/❌] Admin 鏈接 (ADMIN 角色)
- [✅/❌] 翻譯正確

#### 爬蟲配置
- [✅/❌] RSS 爬蟲整合
- [✅/❌] 司法機構爬蟲整合
- [✅/❌] 黑名單機制

### 發現的問題
1. [問題描述]
   - 嚴重程度: Critical/High/Medium/Low
   - 重現步驟: ...
   - 期望行為: ...
   - 實際行為: ...

### 截圖
[附上相關截圖]

### 建議
[測試過程中的改進建議]
```

---

## ✅ 測試完成確認

- [ ] 所有測試項目已執行
- [ ] 測試報告已填寫
- [ ] 截圖已保存
- [ ] 發現的問題已記錄
- [ ] PR 評論已提交

---

**祝測試順利！** 🎉
