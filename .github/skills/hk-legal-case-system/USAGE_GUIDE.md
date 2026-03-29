# 🎓 香港法案系統技能 - 使用示範

## 📝 創建完成！

已成功創建完整的技能包，包含 **9 個檔案**，總大小約 **80 KB**。

## ✅ 技能結構

```
.github/skills/hk-legal-case-system/
├── 📄 SKILL.md                        # 主技能文件（5+ 工作流程）
├── 📄 README.md                       # 使用指南與概述
├── 📄 QUICK_REFERENCE.md              # 快速參考卡片
├── 📁 scripts/
│   ├── diagnose.ts                    # 系統健康檢查腳本
│   ├── verify-data-integrity.ts       # 資料完整性驗證
│   └── test-skill.sh                  # 測試腳本
└── 📁 references/
    ├── case-categories.md             # 22 種案例類別參考
    ├── production-sync.md             # DO 生產環境同步指南
    └── troubleshooting.md             # 6 大失敗情境修復
```

## 🚀 立即開始使用

### 方法 1: 在 VS Code 聊天視窗使用

```plaintext
/hk-legal-case-system 診斷系統健康狀態
```

```plaintext
/hk-legal-case-system 我的 RSS 爬蟲失敗了，如何診斷？
```

```plaintext
/hk-legal-case-system 添加新的法律資料來源：香港政府新聞公報
```

```plaintext
/hk-legal-case-system 批量重新分類低信心度案件
```

```plaintext
/hk-legal-case-system 本地資料庫如何與 DO 生產環境同步？
```

### 方法 2: 直接執行診斷腳本

```bash
# 1. 系統健康檢查
tsx .github/skills/hk-legal-case-system/scripts/diagnose.ts

# 輸出範例：
# 🔍 系統健康檢查
# ✅ 資料庫連線正常
# 📊 最近爬蟲執行: SUCCESS (2 小時前)
# 🤖 AI 分類狀態: 890/1234 已分類 (72%)
```

```bash
# 2. 資料完整性驗證
tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts

# 檢查項目：
# - 爬蟲執行記錄
# - PublicCase 資料品質
# - 重複資料偵測
# - AI 分類狀態
# - 來源分佈與健康度
# - 資料關聯完整性
```

```bash
# 3. 僅檢查最近資料
tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts --recent=24

# 4. 僅檢查特定來源
tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts --source=RSS
```

### 方法 3: 查閱參考文件

```bash
# 快速參考（列印貼在螢幕旁）
cat .github/skills/hk-legal-case-system/QUICK_REFERENCE.md

# 完整使用指南
cat .github/skills/hk-legal-case-system/README.md

# 案例類別參考（AI 分類用）
cat .github/skills/hk-legal-case-system/references/case-categories.md

# 故障排除
cat .github/skills/hk-legal-case-system/references/troubleshooting.md

# 生產環境同步
cat .github/skills/hk-legal-case-system/references/production-sync.md
```

## 📚 核心功能

### 1️⃣ 系統診斷與監控
- ✅ 自動檢查爬蟲執行狀態
- ✅ 驗證資料庫連線
- ✅ 分析 AI 分類覆蓋率
- ✅ 偵測重複資料
- ✅ 監控來源健康度

### 2️⃣ 爬蟲管理
- ✅ 5 個完整工作流程（添加、修復、診斷、擴展、批量）
- ✅ 6 大失敗情境快速修復指南
- ✅ RSS/HKLII/Judiciary 爬蟲範例
- ✅ 反爬機制應對策略

### 3️⃣ AI 分類與資料品質
- ✅ 22 種案例類別完整參考
- ✅ Prompt Engineering 最佳實踐
- ✅ 常見分類錯誤與修正
- ✅ 信心度閾值建議
- ✅ 批量處理腳本範例

### 4️⃣ 資料庫同步與備份
- ✅ 本地 ↔ DO 生產環境同步策略
- ✅ Prisma Migration 部署流程
- ✅ SSH Tunnel 安全連線
- ✅ 自動化備份腳本
- ✅ 資料完整性驗證

## 🎯 典型使用場景

### 場景 A: 每日例行檢查（5 分鐘）

```bash
# 早上上班後執行
tsx .github/skills/hk-legal-case-system/scripts/diagnose.ts

# 如果發現問題，執行完整驗證
tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts --recent=24
```

### 場景 B: 爬蟲失敗排查（10-15 分鐘）

1. 查看診斷報告
2. 檢查 GitHub Actions 日誌
3. 本地重現問題
4. 查閱 `troubleshooting.md` 找對應情境
5. 應用修復方法
6. 重新執行並驗證

### 場景 C: 添加新資料來源（30-60 分鐘）

1. 閱讀 `SKILL.md` → 工作流程 1
2. 創建爬蟲檔案
3. 實作 `trackXXX()` 函數
4. 註冊到 `unified-tracker.ts`
5. 測試並驗證資料
6. 提交 PR

### 場景 D: 生產環境同步（週末維護）

1. 閱讀 `production-sync.md`
2. 驗證本地環境
3. 建立 SSH tunnel
4. 執行資料同步腳本
5. 驗證完整性
6. 備份重要資料

## 💡 進階技巧

### 技巧 1: 設定別名加速操作

```bash
# 在 ~/.bashrc 或 ~/.zshrc 添加
alias hk-diagnose='tsx .github/skills/hk-legal-case-system/scripts/diagnose.ts'
alias hk-verify='tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts'
alias hk-ref='cat .github/skills/hk-legal-case-system/QUICK_REFERENCE.md'

# 使用
hk-diagnose
hk-verify --recent=24
hk-ref | grep "故障排除"
```

### 技巧 2: 整合到 Git Hooks

```bash
# .git/hooks/pre-push
#!/bin/bash
echo "檢查爬蟲健康度..."
pnpm crawler:health || exit 1
```

### 技巧 3: 定期自動檢查（crontab）

```bash
# 每天早上 9 點執行診斷
0 9 * * * cd /path/to/looper-hq && tsx .github/skills/hk-legal-case-system/scripts/diagnose.ts | mail -s "系統診斷報告" admin@looper-hq.dev
```

## 🔄 技能更新與維護

### 何時需要更新技能？

- ✅ 添加新的爬蟲類型
- ✅ 發現新的失敗情境
- ✅ AI 模型升級或 Prompt 改進
- ✅ Schema 重大變更
- ✅ 團隊反饋改進建議

### 如何更新？

直接編輯 `.github/skills/hk-legal-case-system/` 目錄下的文件，Copilot 會自動重新加載。

## 📞 需要協助？

1. **閱讀快速參考**: `QUICK_REFERENCE.md` 
2. **查看故障排除**: `references/troubleshooting.md`
3. **執行診斷腳本**: `scripts/diagnose.ts`
4. **詢問 AI**: 在 VS Code 使用 `/hk-legal-case-system`

## ✨ 下一步

### 建議 1: 立即測試
```bash
# 確保 Docker 運行
pnpm docker:up && sleep 15

# 執行診斷
tsx .github/skills/hk-legal-case-system/scripts/diagnose.ts
```

### 建議 2: 加入書籤
將 `QUICK_REFERENCE.md` 加入瀏覽器書籤，方便隨時查閱。

### 建議 3: 團隊分享
將此技能分享給團隊成員，統一維護流程。

---

**🎉 恭喜！你已經掌握完整的香港法案系統維護工具鏈！**

**維護者**: Looper HQ Team  
**創建日期**: 2026-03-26  
**版本**: 1.0
