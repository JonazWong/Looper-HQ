#!/usr/bin/env pwsh
# Test HK Judiciary Crawler
# 測試香港司法機構爬蟲

Write-Host "`n🏛️ 香港司法機構案件爬蟲測試" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

# Check environment
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env 文件不存在！請先設置環境變量。" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 準備工作:" -ForegroundColor Yellow
Write-Host "   1. 確保資料庫已啟動 (pnpm docker:up)"
Write-Host "   2. 確保 Prisma Client 已生成 (pnpm --filter=@looper-hq/database prisma generate)"
Write-Host "   3. 確保資料庫 schema 已同步 (pnpm db:push)"
Write-Host ""

$confirmation = Read-Host "確認已完成上述步驟？ (y/N)"
if ($confirmation -ne 'y') {
    Write-Host "❌ 已取消" -ForegroundColor Red
    exit 0
}

# Run the crawler
Write-Host "`n🚀 開始執行爬蟲..." -ForegroundColor Green
Write-Host ""

Set-Location "scripts/crawlers"
try {
    npx tsx hk-judiciary-crawler.ts
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host "`n✨ 爬蟲執行完成！" -ForegroundColor Green
        Write-Host "`n📊 查看結果:" -ForegroundColor Cyan
        Write-Host "   • Prisma Studio: pnpm --filter=@looper-hq/database prisma studio"
        Write-Host "   • 或檢查 public_cases 表中的 source='HK_JUDICIARY' 記錄"
    } else {
        Write-Host "`n❌ 爬蟲執行失敗 (Exit Code: $exitCode)" -ForegroundColor Red
    }
    
    exit $exitCode
} catch {
    Write-Host "`n❌ 執行失敗: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Set-Location "../.."
}
