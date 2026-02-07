# Keycloak OAuth Callback 錯誤修復

## 問題根因

**Client ID 不匹配**：
- `.env.local` 配置: `KEYCLOAK_CLIENT_ID=looper-hq` ❌
- Keycloak 實際 Client: `looper-hq-web` ✅

這導致 OAuth callback 時 Keycloak 無法識別 client，返回 `OAuthCallbackError`。

## 已修復

✅ 更新 `apps/web/.env.local`：
```env
KEYCLOAK_CLIENT_ID=looper-hq-web
KEYCLOAK_CLIENT_SECRET=HQ98fpJXuWZCtgGPfVhyZ0pPwkHyj3pP
KEYCLOAK_ISSUER=http://localhost:8080/realms/looper-hq
```

## ⚡ 立即執行

**重啟 dev server 使配置生效**：
```bash
# 停止當前 dev server (Ctrl+C)
# 然後重新啟動：
cd "d:\Looper HQ Platform\Looper-HQ"
pnpm --filter=@looper-hq/web dev
```

或使用 turbo 啟動所有服務：
```bash
pnpm dev
```

## 測試步驟

重啟後測試完整註冊流程：

### 1. 訪問註冊頁面
```
http://localhost:3000/register
```

### 2. 點擊 "Register with Keycloak SSO"
應該正確跳轉到：
```
http://localhost:8080/realms/looper-hq/protocol/openid-connect/registrations
```

### 3. 填寫註冊表單
- Username: 任意（例如 testuser）
- Email: 您的測試郵箱
- First Name: 您的名字
- Last Name: 您的姓氏
- Password: 至少 8 個字符
- Confirm Password: 相同密碼

### 4. 提交註冊
成功後應該：
1. Keycloak 創建用戶
2. OAuth callback 到 `/api/auth/callback/keycloak`
3. NextAuth 處理 token
4. 同步用戶到資料庫
5. **自動登錄並跳轉到 `/dashboard`** ✅

## 配置驗證

確認配置正確：
```bash
# 檢查 Keycloak client
docker exec -it looper-hq-keycloak /opt/keycloak/bin/kcadm.sh get clients -r looper-hq -q clientId=looper-hq-web

# 檢查 .env.local
cd "d:\Looper HQ Platform\Looper-HQ\apps\web"
Get-Content .env.local | Select-String "KEYCLOAK"
```

應該看到：
```json
{
  "clientId": "looper-hq-web",
  "enabled": true,
  "redirectUris": [
    "http://localhost:3000/api/auth/callback/keycloak",
    "http://localhost:3000/*"
  ]
}
```

## 故障排除

如果重啟後仍有錯誤：

### 錯誤 1: 仍然 OAuthCallbackError
**原因**: dev server 未重啟或環境變數未載入
**解決**: 完全停止所有 node 進程並重啟

### 錯誤 2: Invalid redirect_uri
**原因**: Keycloak redirect URI 配置不匹配
**解決**: 確認 Keycloak client 包含 `http://localhost:3000/api/auth/callback/keycloak`

### 錯誤 3: Unauthorized client
**原因**: Client secret 不正確
**解決**: 重新從 Keycloak 獲取 secret

## 成功標誌

註冊成功後，您應該看到：

1. **Dashboard 頁面載入** ✅
2. **用戶名顯示在右上角** ✅
3. **資料庫中創建新用戶**：
   ```sql
   SELECT id, email, name, role, "keycloakId" FROM users ORDER BY "createdAt" DESC LIMIT 1;
   ```
4. **Session 包含 Keycloak ID**

## 其他註冊方式（如果遇到問題）

### 方式 A：Keycloak Admin Console
```
1. http://localhost:8080/admin
2. 登錄: admin / admin
3. Realm: looper-hq
4. Users → Add user
5. 設定密碼（Credentials 頁籤）
```

### 方式 B：使用現有測試帳號
```
admin@looper-hq.local / admin123
lawyer@looper-hq.local / lawyer123
client@looper-hq.local / client123
```

立即重啟 dev server 即可測試！🚀
