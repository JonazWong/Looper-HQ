#!/usr/bin/env tsx
/**
 * 功能開發環境檢查腳本
 * 
 * 檢查開發環境是否正確配置，包括：
 * - Docker服務狀態
 * - 數據庫連接
 * - Prisma Client生成
 * - 環境變數
 * - Node.js版本
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

interface Check {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
}

const checks: Check[] = []

function addCheck(name: string, status: Check['status'], message: string) {
  checks.push({ name, status, message })
}

function execCommand(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' })
  } catch (error: any) {
    return error.message
  }
}

console.log('🔍 Looper HQ 開發環境檢查')
console.log('=' .repeat(50))
console.log('')

// 1. Node.js版本
console.log('檢查 Node.js 版本...')
const nodeVersion = process.version
const requiredVersion = 18
const currentVersion = parseInt(nodeVersion.slice(1).split('.')[0])

if (currentVersion >= requiredVersion) {
  addCheck('Node.js', 'pass', `版本 ${nodeVersion} ✅`)
} else {
  addCheck('Node.js', 'fail', `版本 ${nodeVersion}，需要 >= v${requiredVersion}.0.0 ❌`)
}

// 2. pnpm安裝
console.log('檢查 pnpm...')
const pnpmCheck = execCommand('pnpm --version')
if (pnpmCheck && !pnpmCheck.includes('not found')) {
  addCheck('pnpm', 'pass', `已安裝 (v${pnpmCheck.trim()}) ✅`)
} else {
  addCheck('pnpm', 'fail', '未安裝 ❌')
}

// 3. Docker服務
console.log('檢查 Docker 服務...')
const dockerCheck = execCommand('docker ps')
if (dockerCheck.includes('CONTAINER ID')) {
  const postgresRunning = dockerCheck.includes('looper-hq-db') || dockerCheck.includes('postgres')
  const redisRunning = dockerCheck.includes('looper-hq-redis') || dockerCheck.includes('redis')
  
  if (postgresRunning && redisRunning) {
    addCheck('Docker', 'pass', 'PostgreSQL 和 Redis 正在運行 ✅')
  } else if (postgresRunning || redisRunning) {
    addCheck('Docker', 'warn', '部分服務運行，請執行 pnpm docker:up ⚠️')
  } else {
    addCheck('Docker', 'warn', 'Docker運行但服務未啟動，請執行 pnpm docker:up ⚠️')
  }
} else {
  addCheck('Docker', 'fail', 'Docker未運行 ❌')
}

// 4. 環境變數
console.log('檢查環境變數...')
const envPath = join(process.cwd(), '.env')
if (existsSync(envPath)) {
  addCheck('.env', 'pass', '文件存在 ✅')
  
  // 檢查關鍵變數
  const envContent = require('fs').readFileSync(envPath, 'utf-8')
  const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL']
  const missingVars = requiredVars.filter(v => !envContent.includes(v))
  
  if (missingVars.length === 0) {
    addCheck('環境變數', 'pass', '關鍵變數已設置 ✅')
  } else {
    addCheck('環境變數', 'warn', `缺少: ${missingVars.join(', ')} ⚠️`)
  }
} else {
  addCheck('.env', 'fail', '文件不存在，請複製 .env.example ❌')
}

// 5. Prisma Client
console.log('檢查 Prisma Client...')
const prismaClientPath = join(process.cwd(), 'node_modules', '.prisma', 'client')
if (existsSync(prismaClientPath)) {
  addCheck('Prisma Client', 'pass', '已生成 ✅')
} else {
  addCheck('Prisma Client', 'fail', '未生成，請執行: pnpm --filter=@looper-hq/database prisma generate ❌')
}

// 6. Dependencies安裝
console.log('檢查依賴安裝...')
const nodeModulesPath = join(process.cwd(), 'node_modules')
if (existsSync(nodeModulesPath)) {
  const packageJson = require(join(process.cwd(), 'package.json'))
  const installedPackages = require('fs').readdirSync(nodeModulesPath)
  
  if (installedPackages.length > 10) { // 基本判斷
    addCheck('Dependencies', 'pass', '已安裝 ✅')
  } else {
    addCheck('Dependencies', 'warn', '可能不完整，請執行: pnpm install ⚠️')
  }
} else {
  addCheck('Dependencies', 'fail', '未安裝，請執行: pnpm install ❌')
}

// 7. Database連接
console.log('檢查數據庫連接...')
if (process.env.DATABASE_URL || existsSync(envPath)) {
  try {
    const dbUrl = process.env.DATABASE_URL || 
      require('fs').readFileSync(envPath, 'utf-8')
        .split('\n')
        .find((line: string) => line.startsWith('DATABASE_URL'))
        ?.split('=')[1]
        ?.trim()
        ?.replace(/^["']|["']$/g, '')
    
    if (dbUrl && dbUrl.includes('localhost:5433')) {
      addCheck('Database連接', 'pass', '配置正確 (port 5433) ✅')
    } else if (dbUrl && dbUrl.includes('localhost')) {
      addCheck('Database連接', 'warn', '端口可能不正確，應為 5433 ⚠️')
    } else if (dbUrl) {
      addCheck('Database連接', 'pass', '連接字串已設置 ✅')
    } else {
      addCheck('Database連接', 'fail', 'DATABASE_URL未設置 ❌')
    }
  } catch (error) {
    addCheck('Database連接', 'warn', '無法驗證 ⚠️')
  }
} else {
  addCheck('Database連接', 'fail', '環境變數未設置 ❌')
}

// 8. Git狀態
console.log('檢查 Git 狀態...')
const gitStatus = execCommand('git status --porcelain')
if (gitStatus.trim() === '') {
  addCheck('Git', 'pass', '工作目錄乾淨 ✅')
} else {
  const lines = gitStatus.trim().split('\n').length
  addCheck('Git', 'warn', `有 ${lines} 個未提交的變更 ⚠️`)
}

// 輸出結果
console.log('')
console.log('📊 檢查結果')
console.log('=' .repeat(50))
console.log('')

let passCount = 0
let warnCount = 0
let failCount = 0

checks.forEach(check => {
  const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌'
  console.log(`${icon} ${check.name.padEnd(20)} ${check.message}`)
  
  if (check.status === 'pass') passCount++
  else if (check.status === 'warn') warnCount++
  else failCount++
})

console.log('')
console.log('=' .repeat(50))
console.log(`總計: ${passCount} 通過, ${warnCount} 警告, ${failCount} 失敗`)
console.log('')

// 建議
if (failCount > 0) {
  console.log('🛠️  修復建議:')
  console.log('')
  
  checks.filter(c => c.status === 'fail').forEach(check => {
    switch (check.name) {
      case 'Node.js':
        console.log('  • 安裝 Node.js 18+: https://nodejs.org/')
        break
      case 'pnpm':
        console.log('  • 安裝 pnpm: npm install -g pnpm')
        break
      case 'Docker':
        console.log('  • 啟動 Docker Desktop')
        console.log('  • 執行: pnpm docker:up')
        break
      case '.env':
        console.log('  • 複製環境變數: cp .env.example .env')
        break
      case 'Prisma Client':
        console.log('  • 生成 Prisma Client: pnpm --filter=@looper-hq/database prisma generate')
        break
      case 'Dependencies':
        console.log('  • 安裝依賴: pnpm install --frozen-lockfile')
        break
      case 'Database連接':
        console.log('  • 設置 .env 中的 DATABASE_URL')
        break
    }
  })
  console.log('')
}

if (warnCount > 0 && failCount === 0) {
  console.log('⚠️  警告項目建議處理，但不影響基本開發')
  console.log('')
}

if (failCount === 0 && warnCount === 0) {
  console.log('🎉 所有檢查通過！可以開始開發了')
  console.log('')
  console.log('下一步:')
  console.log('  • 啟動開發服務器: pnpm dev')
  console.log('  • 打開 Prisma Studio: pnpm db:studio')
  console.log('  • 查看API文檔: http://localhost:3005/api')
  console.log('')
}

// 退出碼
process.exit(failCount > 0 ? 1 : 0)
