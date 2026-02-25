#!/usr/bin/env bash
# Test HK Judiciary Crawler
# 測試香港司法機構爬蟲

set -e

echo ""
echo "🏛️ 香港司法機構案件爬蟲測試"
echo "======================================================================"

# Check environment
if [ ! -f .env ]; then
    echo "❌ .env 文件不存在！請先設置環境變量。"
    exit 1
fi

echo ""
echo "📋 準備工作:"
echo "   1. 確保資料庫已啟動 (pnpm docker:up)"
echo "   2. 確保 Prisma Client 已生成 (pnpm --filter=@looper-hq/database prisma generate)"
echo "   3. 確保資料庫 schema 已同步 (pnpm db:push)"
echo ""

read -p "確認已完成上述步驟？ (y/N): " confirmation
if [ "$confirmation" != "y" ]; then
    echo "❌ 已取消"
    exit 0
fi

# Run the crawler
echo ""
echo "🚀 開始執行爬蟲..."
echo ""

cd scripts/crawlers

if npx tsx hk-judiciary-crawler.ts; then
    echo ""
    echo "✨ 爬蟲執行完成！"
    echo ""
    echo "📊 查看結果:"
    echo "   • Prisma Studio: pnpm --filter=@looper-hq/database prisma studio"
    echo "   • 或檢查 public_cases 表中的 source='HK_JUDICIARY' 記錄"
    exit 0
else
    echo ""
    echo "❌ 爬蟲執行失敗"
    exit 1
fi
