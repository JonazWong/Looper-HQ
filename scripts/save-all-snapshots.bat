@echo off
REM 批量保存所有重要页面快照 (Windows)
REM Quick Snapshot All Pages

echo 📸 开始保存所有页面快照...
echo.

REM 创建输出目录
if not exist snapshots\dashboard mkdir snapshots\dashboard
if not exist snapshots\cases mkdir snapshots\cases
if not exist snapshots\clients mkdir snapshots\clients
if not exist snapshots\auth mkdir snapshots\auth

REM Dashboard 区域
echo 📊 Dashboard 页面...
call pnpm snapshot dashboard -o snapshots/dashboard/main.html

REM 案件管理
echo 📁 案件管理页面...
call pnpm snapshot cases -o snapshots/cases/list.html
call pnpm snapshot cases/new -o snapshots/cases/new.html

REM 客户管理
echo 👥 客户管理页面...
call pnpm snapshot clients -o snapshots/clients/list.html
call pnpm snapshot clients/new -o snapshots/clients/new.html

REM 搜索
echo 🔍 搜索页面...
call pnpm snapshot search -o snapshots/dashboard/search.html

REM Auth 页面
echo 🔐 认证页面...
call pnpm snapshot app/(auth)/login/page.tsx -o snapshots/auth/login.html
call pnpm snapshot app/(auth)/register/page.tsx -o snapshots/auth/register.html

echo.
echo ✅ 所有快照已保存到 snapshots\ 目录
echo 📂 打开目录: snapshots\
echo.
pause
