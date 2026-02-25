#!/usr/bin/env pwsh
# Looper HQ Development Environment - Quick Start
# 一鍵啟動開發環境

Write-Host "`n🚀 Looper HQ 開發環境啟動中..." -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

# Step 1: Check environment file
Write-Host "`n📋 [1/6] 檢查環境配置..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "   ⚠️  .env 文件不存在，從 .env.example 複製..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "   ✓ .env 文件已創建，請檢查配置" -ForegroundColor Green
} else {
    Write-Host "   ✓ .env 文件存在" -ForegroundColor Green
}

# Step 2: Start Docker services
Write-Host "`n🐳 [2/6] 啟動 Docker 服務（PostgreSQL, Redis）..." -ForegroundColor Yellow
try {
    pnpm docker:up
    Write-Host "   ✓ Docker 服務已啟動" -ForegroundColor Green
    Write-Host "   ⏳ 等待 PostgreSQL 初始化 (15 秒)..." -ForegroundColor Cyan
    Start-Sleep -Seconds 15
} catch {
    Write-Host "   ❌ Docker 啟動失敗: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 請確保 Docker Desktop 正在運行" -ForegroundColor Yellow
    exit 1
}

# Step 3: Install dependencies
Write-Host "`n📦 [3/6] 安裝依賴..." -ForegroundColor Yellow
try {
    pnpm install --frozen-lockfile
    Write-Host "   ✓ 依賴安裝完成" -ForegroundColor Green
} catch {
    Write-Host "   ❌ 依賴安裝失敗" -ForegroundColor Red
    exit 1
}

# Step 4: Generate Prisma Client
Write-Host "`n🔧 [4/6] 生成 Prisma Client..." -ForegroundColor Yellow
try {
    pnpm --filter=@looper-hq/database prisma generate
    Write-Host "   ✓ Prisma Client 已生成" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Prisma Client 生成失敗" -ForegroundColor Red
    exit 1
}

# Step 5: Sync database schema
Write-Host "`n💾 [5/6] 同步數據庫 Schema..." -ForegroundColor Yellow
try {
    pnpm db:push
    Write-Host "   ✓ 數據庫 Schema 已同步" -ForegroundColor Green
} catch {
    Write-Host "   ❌ 數據庫同步失敗" -ForegroundColor Red
    exit 1
}

# Step 6: Seed database (optional but recommended)
Write-Host "`n🌱 [6/6] 填充測試數據..." -ForegroundColor Yellow
$seedConfirmation = Read-Host "是否填充測試數據？(y/N)"
if ($seedConfirmation -eq 'y') {
    try {
        pnpm db:seed
        Write-Host "   ✓ 測試數據已填充" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  數據填充失敗（可選步驟）" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⊘ 跳過數據填充" -ForegroundColor Gray
}

# Success summary
Write-Host "`n" + ("=" * 70) -ForegroundColor Green
Write-Host "✨ 開發環境準備完成！" -ForegroundColor Green
Write-Host ("=" * 70) -ForegroundColor Green

Write-Host "`n📊 測試賬號（開發模式）:" -ForegroundColor Cyan
Write-Host "   管理員: admin@looperhq.com (任意密碼)" -ForegroundColor White
Write-Host "   律師:   lawyer@looperhq.com (任意密碼)" -ForegroundColor White
Write-Host "   客戶:   wong.client@example.com (任意密碼)" -ForegroundColor White

Write-Host "`n🌐 訪問地址:" -ForegroundColor Cyan
Write-Host "   主應用:      http://localhost:3005" -ForegroundColor White
Write-Host "   案件搜索:    http://localhost:3001" -ForegroundColor White
Write-Host "   Prisma Studio: http://localhost:5555" -ForegroundColor White

Write-Host "`n🎯 測試檢查清單:" -ForegroundColor Cyan
Write-Host "   [ ] 登入系統 (admin@looperhq.com)" -ForegroundColor White
Write-Host "   [ ] 檢查主 Dashboard (/zh/dashboard)" -ForegroundColor White
Write-Host "   [ ] 檢查會員資料庫 (/zh/services)" -ForegroundColor White
Write-Host "   [ ] 檢查管理員面板 (/zh/admin) - 僅 ADMIN 可見" -ForegroundColor White
Write-Host "   [ ] 測試 Sidebar 導航（是否顯示 Admin 鏈接）" -ForegroundColor White
Write-Host "   [ ] 測試爬蟲配置整合（./test-judiciary-crawler.ps1）" -ForegroundColor White

Write-Host "`n⚙️  啟動開發服務器:" -ForegroundColor Yellow
Write-Host "   pnpm dev        # 啟動主應用 (port 3005)" -ForegroundColor White
Write-Host "   pnpm dev:legal  # 啟動案件搜索 (port 3001)" -ForegroundColor White
Write-Host "   pnpm dev:all    # 同時啟動兩個應用" -ForegroundColor White

Write-Host "`n🔧 額外工具:" -ForegroundColor Yellow
Write-Host "   pnpm --filter=@looper-hq/database prisma studio  # 數據庫管理界面" -ForegroundColor White
Write-Host "   ./test-judiciary-crawler.ps1  # 測試司法機構爬蟲" -ForegroundColor White

Write-Host "`n按 Enter 啟動開發服務器，或 Ctrl+C 取消..." -ForegroundColor Cyan
Read-Host

Write-Host "`n🚀 啟動開發服務器..." -ForegroundColor Green
pnpm dev
