#!/usr/bin/env pwsh
# Looper HQ - Clean Redundant Files
# 清理專案中的冗餘文件

Write-Host "🧹 開始清理 Looper-HQ 冗餘文件..." -ForegroundColor Cyan

# 1. 版本歷史備份（完全過時）
Write-Host "`n📦 刪除版本歷史文件..." -ForegroundColor Yellow
@(
    "v1_.do",
    "v1_apps",
    "v1_packages", 
    "v1_scripts",
    "v1_package.json",
    "v1_DEPLOYMENT.md",
    "v2_package.json",
    "v2_scripts",
    "v3_package.json",
    "v3_scripts",
    "v4_package.json"
) | ForEach-Object {
    if (Test-Path $_) {
        Remove-Item -Recurse -Force $_
        Write-Host "  ✓ 已刪除: $_" -ForegroundColor Green
    }
}

# 2. 臨時修復文檔
Write-Host "`n📝 刪除臨時修復文檔..." -ForegroundColor Yellow
@(
    "DEPLOYMENT_FIX_SUMMARY.md",
    "DIGITALOCEAN_QUICK_FIX.md",
    "DIGITAL_OCEAN_PRISMA_FIX.md",
    "DO_DEPLOYMENT_FIX.md",
    "DOCKER_PRISMA_FIX.md",
    "PUBLIC_DIRECTORY_FIX.md",
    "LOCKFILE_FIX_VERIFICATION.md",
    "RESET_SUMMARY.md",
    "IMPLEMENTATION_SUMMARY.md",
    "RSS_SOURCES_UPDATE.md",
    "CRAWLER_QUICK_REFERENCE.md",
    "QUICK_DEPLOY.md",
    "sat_feb_14_2026_一鍵安裝開發環境腳本與.md"
) | ForEach-Object {
    if (Test-Path $_) {
        Remove-Item -Force $_
        Write-Host "  ✓ 已刪除: $_" -ForegroundColor Green
    }
}

# 3. 重複配置文件
Write-Host "`n⚙️  刪除重複配置文件..." -ForegroundColor Yellow
@(
    "docker-compose.dev.yml",
    "docker-compose.prod.yml",
    "DOCKER.md",
    "MIGRATION_GUIDE.md"
) | ForEach-Object {
    if (Test-Path $_) {
        Remove-Item -Force $_
        Write-Host "  ✓ 已刪除: $_" -ForegroundColor Green
    }
}

# 4. 空或無用的應用 (需要確認後手動刪除)
Write-Host "`n⚠️  以下需要手動確認刪除:" -ForegroundColor Red
Write-Host "  • apps\legal-case-search - 空應用（所有功能在 apps/web）"
Write-Host "  • services - 空目錄"
Write-Host ""
Write-Host "如需刪除，執行:"
Write-Host "  Remove-Item -Recurse -Force apps\legal-case-search, services" -ForegroundColor Cyan

# 5. 重複的實現總結
Write-Host "`n📄 刪除重複的實現總結..." -ForegroundColor Yellow
@(
    "docs\migration\IMPLEMENTATION_SUMMARY.md",
    "apps\web\NEXTAUTH_SETUP_SUMMARY.md",
    "apps\web\docs\IMPLEMENTATION_SUMMARY.md"
) | ForEach-Object {
    if (Test-Path $_) {
        Remove-Item -Force $_
        Write-Host "  ✓ 已刪除: $_" -ForegroundColor Green
    }
}

# 6. 孤立測試文件
Write-Host "`n🧪 刪除孤立測試文件..." -ForegroundColor Yellow
if (Test-Path "packages_utils_src_ai-client.ts") {
    Remove-Item -Force "packages_utils_src_ai-client.ts"
    Write-Host "  ✓ 已刪除: packages_utils_src_ai-client.ts" -ForegroundColor Green
}

Write-Host "`n✅ 清理完成！" -ForegroundColor Green
Write-Host "提示: 執行 git status 查看變更" -ForegroundColor Cyan
