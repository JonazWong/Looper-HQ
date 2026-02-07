# Keycloak 註冊與登錄配置修復完成

## 問題診斷

用戶無法註冊測試號進入  dashboard，因為：
1. Keycloak 禁用了自助註冊 (`registrationAllowed: false`)
2. Register 頁面嘗試本地註冊，未整合 Keycloak
3. 沒有導引用戶使用現有測試帳號

## 實施的修復

### 1. 啟用 Keycloak 自助註冊
```bash
# 更新 realm 配置
docker exec -it looper-hq-keycloak /opt/keycloak/bin/kcadm.sh update realms/looper-hq -s registrationAllowed=true
```

### 2. 重建 Register 頁面
完全重寫 `/register` 頁面，整合 Keycloak：

**核心功能：**
- ✅ 主要按鈕：重定向到 Keycloak 註冊頁面
- ✅ 備用選項：顯示 Demo 測試帳號
- ✅ 快速登錄：一鍵跳轉到登錄頁面（含 demo 提示）

**Keycloak 註冊 URL：**
```
http://localhost:8080/realms/looper-hq/protocol/openid-connect/registrations
├─ client_id=looper-hq-web
├─ response_type=code
├─ scope=openid email profile
└─ redirect_uri=http://localhost:3000/api/auth/callback/keycloak
```

### 3. 增強 Login 頁面
新增 demo 模式，顯示測試帳號：

**URL 參數：**
```
/login?demo=true  → 顯示所有測試帳號資訊
```

**測試帳號：**
```
admin@looper-hq.local   / admin123   (ADMIN 角色)
lawyer@looper-hq.local  / lawyer123  (LAWYER 角色)
client@looper-hq.local  / client123  (CLIENT 角色)
```

## 使用方式

### 方式 A：使用現有測試帳號 (最快)
1. 訪問 http://localhost:3000/register
2. 點擊 "Login with Demo Account"
3. 使用顯示的任一組測試帳號登錄

### 方式 B：註冊新帳號
1. 訪問 http://localhost:3000/register
2. 點擊 "Register with Keycloak SSO"
3. 在 Keycloak 註冊頁面填寫資料
4. 註冊成功後自動導回應用程式
5. 使用新帳號登錄

### 方式 C：直接在 Keycloak 管理
1. 訪問 http://localhost:8080/admin
2. 登錄：admin / admin
3. 進入 looper-hq realm
4. Users → Add user

## 檔案變更

### 修改的檔案
1. `apps/web/app/(auth)/register/page.tsx` - 完全重寫
2. `apps/web/app/(auth)/login/page.tsx` - 新增 demo 模式
3. `infrastructure/keycloak/realms/looper-hq-realm.json` - 啟用註冊

### 移除的功能
- ❌ 本地註冊 API (`/api/auth/register`) - 不再使用
- ❌ 表單驗證邏輯 - Keycloak 處理
- ❌ 密碼管理 - Keycloak 處理

## 驗證步驟

**測試 Keycloak 註冊：**
```bash
# 1. 確認 Keycloak 運行
docker ps --filter "name=keycloak"

# 2. 檢查註冊功能啟用
curl http://localhost:8080/realms/looper-hq | jq '.registrationAllowed'

# 3. 訪問註冊頁面
open http://localhost:3000/register
```

**測試登錄流程：**
1. 使用 admin@looper-hq.local / admin123
2. 應該成功進入 /dashboard
3. 檢查 session 包含正確的 role 和 keycloakId

## 架構改進

**Before:**
```
User → Register Page → Local API → Database
                     ↓
                   ❌ 沒有密碼驗證
                   ❌ Keycloak 未整合
```

**After:**
```
User → Register Page → Keycloak Registration Portal
                     ↓
                  OAuth Callback → NextAuth
                     ↓
                  User 同步到 Database
                     ↓
                  Redirect to Dashboard
```

## 安全性提升

1. ✅ 所有認證由 Keycloak 管理
2. ✅ 支援 OAuth 2.0 / OpenID Connect
3. ✅ 密碼策略由 Keycloak 執行
4. ✅ 支援 MFA / SSO (可擴展)
5. ✅ 暴力破解保護 (Keycloak 內建)

## 下一步建議

### P0 - 立即完成
- [x] 啟用 Keycloak 註冊
- [x] 修復 Register 頁面
- [x] 提供測試帳號

### P1 - 短期優化
- [ ] 自定義 Keycloak 主題 (Premier Design)
- [ ] 配置 Email 服務 (驗證信、重設密碼)
- [ ] 角色映射自動化 (realm_access → UserRole)

### P2 - 長期增強
- [ ] 啟用 Google / Microsoft OAuth
- [ ] 實施 MFA (TOTP / SMS)
- [ ] 整合 Keycloak Events 到審計日誌
