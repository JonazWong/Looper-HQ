#!/bin/bash
# 快速測試技能腳本

echo "🧪 測試香港法案系統技能..."
echo "=============================="

# 1. 檢查 Docker 服務
echo -e "\n1️⃣ 檢查 Docker 服務..."
if docker ps | grep -q postgres; then
  echo "✅ PostgreSQL 運行中"
else
  echo "❌ PostgreSQL 未運行，啟動 Docker..."
  pnpm docker:up
  echo "⏳ 等待 15 秒..."
  sleep 15
fi

# 2. 測試診斷腳本
echo -e "\n2️⃣ 執行系統診斷..."
tsx .github/skills/hk-legal-case-system/scripts/diagnose.ts

# 3. 測試資料完整性驗證（僅最近 24 小時）
echo -e "\n3️⃣ 執行資料完整性驗證（最近 24 小時）..."
tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts --recent=24

echo -e "\n✅ 技能測試完成！"
