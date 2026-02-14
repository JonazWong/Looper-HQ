# 🔄 數據庫完全重置腳本
# 用途：清空所有資料，只保留 RSS 來源配置

Write-Host "🔄 數據庫完全重置" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  警告：這會刪除資料庫中的所有資料！" -ForegroundColor Yellow
Write-Host ""

# 確認操作
$confirmation = Read-Host "確定要繼續嗎？輸入 'YES' 確認"
if ($confirmation -ne 'YES') {
    Write-Host "操作已取消" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "開始重置..." -ForegroundColor Green

# 1. 確保 Docker 運行
Write-Host "📋 步驟 1/5: 檢查 Docker 容器..." -ForegroundColor Yellow
$dockerRunning = docker ps --filter "name=postgres" --format "{{.Names}}"
if ($dockerRunning) {
    Write-Host "✅ PostgreSQL 容器正在運行" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL 容器未運行，正在啟動..." -ForegroundColor Yellow
    pnpm docker:up
    Write-Host "⏳ 等待資料庫就緒（15秒）..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
}
Write-Host ""

# 2. 設置環境變數
Write-Host "📋 步驟 2/5: 設置環境變數..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://postgres:Ken202318@localhost:5432/looper_hq"
Write-Host "✅ 環境變數已設置" -ForegroundColor Green
Write-Host ""

# 3. 完全重置資料庫
Write-Host "📋 步驟 3/5: 重置資料庫結構..." -ForegroundColor Yellow
Write-Host "這會刪除所有現有資料..." -ForegroundColor Gray

Push-Location "packages\database"

# 執行強制重置
npx prisma db push --force-reset --accept-data-loss --skip-generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 資料庫已完全重置" -ForegroundColor Green
} else {
    Write-Host "❌ 資料庫重置失敗" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location
Write-Host ""

# 4. 重新生成 Prisma Client
Write-Host "📋 步驟 4/5: 重新生成 Prisma Client..." -ForegroundColor Yellow
pnpm --filter=@looper-hq/database generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client 已生成" -ForegroundColor Green
} else {
    Write-Host "❌ Prisma Client 生成失敗" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 5. 初始化 RSS 來源配置（使用精簡版 seed）
Write-Host "📋 步驟 5/5: 初始化 RSS 來源配置..." -ForegroundColor Yellow
Push-Location "packages\database"
$env:DATABASE_URL = "postgresql://postgres:Ken202318@localhost:5432/looper_hq"
npx tsx prisma/seed-minimal.ts
$seedExitCode = $LASTEXITCODE
Pop-Location

if ($seedExitCode -eq 0) {
    Write-Host "✅ RSS 來源配置完成" -ForegroundColor Green
} else {
    Write-Host "❌ RSS 來源配置失敗" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ 數據庫重置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📊 當前狀態：" -ForegroundColor Cyan
Write-Host "  • 資料庫：已清空" -ForegroundColor White
Write-Host "  • RSS 來源：已配置（明報日報、明報即時）" -ForegroundColor White
Write-Host "  • 模擬數據：無" -ForegroundColor White
Write-Host ""
Write-Host "🚀 後續步驟：" -ForegroundColor Cyan
Write-Host "  1. 測試爬蟲: pnpm crawler:rss" -ForegroundColor White
Write-Host "  2. 查看資料: pnpm db:studio" -ForegroundColor White
Write-Host "  3. 查看 PublicCase 表格確認爬取的真實資料" -ForegroundColor White
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
