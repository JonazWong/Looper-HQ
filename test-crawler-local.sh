#!/bin/bash

# 🧪 RSS 爬蟲本地測試腳本
# 用途：在本地環境測試 RSS 爬蟲功能

echo "🧪 RSS 爬蟲本地測試開始..."
echo "================================"
echo ""

# 1. 檢查資料庫連接
echo "📋 步驟 1/5: 檢查資料庫連接..."
if docker ps | grep -q postgres; then
  echo "✅ PostgreSQL 容器正在運行"
else
  echo "⚠️  PostgreSQL 容器未運行，正在啟動..."
  pnpm docker:up
  echo "⏳ 等待資料庫就緒（15秒）..."
  sleep 15
fi
echo ""

# 2. 生成 Prisma Client
echo "📋 步驟 2/5: 生成 Prisma Client..."
pnpm --filter=@looper-hq/database prisma generate
if [ $? -eq 0 ]; then
  echo "✅ Prisma Client 生成成功"
else
  echo "❌ Prisma Client 生成失敗"
  exit 1
fi
echo ""

# 3. 檢查資料庫結構
echo "📋 步驟 3/5: 同步資料庫結構..."
pnpm db:push
if [ $? -eq 0 ]; then
  echo "✅ 資料庫結構已同步"
else
  echo "❌ 資料庫結構同步失敗"
  exit 1
fi
echo ""

# 4. 確保有 seed 資料（RSS 來源配置）
echo "📋 步驟 4/5: 初始化測試資料..."
echo "提示：如果資料庫已有資料，這步會跳過"
pnpm db:seed
echo ""

# 5. 運行 RSS 爬蟲
echo "📋 步驟 5/5: 運行 RSS 爬蟲..."
echo "================================"
echo ""
pnpm crawler:rss
CRAWLER_EXIT_CODE=$?
echo ""

# 檢查結果
echo "================================"
if [ $CRAWLER_EXIT_CODE -eq 0 ]; then
  echo "✅ RSS 爬蟲測試成功完成！"
  echo ""
  echo "📊 查看結果："
  echo "   1. 運行 'pnpm db:studio' 打開 Prisma Studio"
  echo "   2. 查看 'PublicCase' 表格的新資料"
  echo "   3. 查看 'RssSource' 表格的抓取狀態"
else
  echo "❌ RSS 爬蟲執行失敗（退出碼: $CRAWLER_EXIT_CODE）"
  echo ""
  echo "🔍 常見問題排查："
  echo "   1. 檢查網絡連接"
  echo "   2. 檢查 RSS 來源是否可訪問"
  echo "   3. 查看上方的錯誤日誌"
fi
echo ""
echo "================================"
