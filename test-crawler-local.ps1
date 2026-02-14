# 🧪 RSS 爬蟲本地測試腳本（PowerShell）
# 用途：在 Windows 本地環境測試 RSS 爬蟲功能

Write-Host "🧪 RSS 爬蟲本地測試開始..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. 檢查資料庫連接
Write-Host "📋 步驟 1/5: 檢查資料庫連接..." -ForegroundColor Yellow
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

# 2. 確保環境變數可用
Write-Host "📋 步驟 2/6: 設置環境變數..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://postgres:Ken202318@localhost:5432/looper_hq"
Write-Host "✅ 環境變數已設置" -ForegroundColor Green
Write-Host ""

# 3. 重置並同步資料庫結構
Write-Host "📋 步驟 3/6: 重置並同步資料庫..." -ForegroundColor Yellow
Write-Host "提示：這會清除資料庫中的所有資料" -ForegroundColor Gray

# 進入 database 目錄
Push-Location "packages\database"

# 使用 npx 調用 prisma，並自動接受重置
Write-Host "正在重置資料庫..." -ForegroundColor Gray
npx prisma db push --force-reset --accept-data-loss --skip-generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 資料庫已重置並同步" -ForegroundColor Green
} else {
    Write-Host "❌ 資料庫重置失敗" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location
Write-Host ""

# 4. 生成 Prisma Client（資料庫同步後必須生成）
Write-Host "📋 步驟 4/6: 重新生成 Prisma Client..." -ForegroundColor Yellow
pnpm --filter=@looper-hq/database generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client 已生成" -ForegroundColor Green
} else {
    Write-Host "❌ Prisma Client 生成失敗" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 5. 確保有 seed 資料（RSS 來源配置）
Write-Host "📋 步驟 5/6: 初始化測試資料..." -ForegroundColor Yellow
Write-Host "提示：如果資料庫已有資料，這步會跳過" -ForegroundColor Gray
pnpm db:seed
Write-Host ""

# 6. 運行 RSS 爬蟲
Write-Host "📋 步驟 6/6: 運行 RSS 爬蟲..." -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
pnpm crawler:rss
$crawlerExitCode = $LASTEXITCODE
Write-Host ""

# 檢查結果
Write-Host "================================" -ForegroundColor Cyan
if ($crawlerExitCode -eq 0) {
    Write-Host "✅ RSS 爬蟲測試成功完成！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 查看結果：" -ForegroundColor Cyan
    Write-Host "   1. 運行 'pnpm db:studio' 打開 Prisma Studio" -ForegroundColor White
    Write-Host "   2. 查看 'PublicCase' 表格的新資料" -ForegroundColor White
    Write-Host "   3. 查看 'RssSource' 表格的抓取狀態" -ForegroundColor White
} else {
    Write-Host "❌ RSS 爬蟲執行失敗（退出碼: $crawlerExitCode）" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 常見問題排查：" -ForegroundColor Yellow
    Write-Host "   1. 檢查網絡連接" -ForegroundColor White
    Write-Host "   2. 檢查 RSS 來源是否可訪問" -ForegroundColor White
    Write-Host "   3. 查看上方的錯誤日誌" -ForegroundColor White
}
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
