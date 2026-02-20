#!/bin/bash
# 批量保存所有重要页面快照
# Quick Snapshot All Pages

echo "📸 开始保存所有页面快照..."
echo ""

# 创建输出目录
mkdir -p snapshots/dashboard
mkdir -p snapshots/cases
mkdir -p snapshots/clients
mkdir -p snapshots/auth

# Dashboard 区域
echo "📊 Dashboard 页面..."
pnpm snapshot dashboard -o snapshots/dashboard/main.html

# 案件管理
echo "📁 案件管理页面..."
pnpm snapshot cases -o snapshots/cases/list.html
pnpm snapshot cases/new -o snapshots/cases/new.html

# 客户管理
echo "👥 客户管理页面..."
pnpm snapshot clients -o snapshots/clients/list.html
pnpm snapshot clients/new -o snapshots/clients/new.html

# 搜索
echo "🔍 搜索页面..."
pnpm snapshot search -o snapshots/dashboard/search.html

# Auth 页面
echo "🔐 认证页面..."
pnpm snapshot app/(auth)/login/page.tsx -o snapshots/auth/login.html
pnpm snapshot app/(auth)/register/page.tsx -o snapshots/auth/register.html

echo ""
echo "✅ 所有快照已保存到 snapshots/ 目录"
echo "📂 打开目录: snapshots/"
echo ""
