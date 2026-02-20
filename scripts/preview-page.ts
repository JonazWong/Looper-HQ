#!/usr/bin/env tsx
/**
 * 页面预览工具 - Page Preview Tool
 * 
 * 用法 / Usage:
 *   pnpm preview app/(dashboard)/cases/page.tsx
 *   pnpm preview app/(dashboard)/clients/page.tsx
 *   pnpm preview app/(dashboard)/dashboard/page.tsx
 * 
 * 功能 / Features:
 *   - 自动启动开发服务器
 *   - 在浏览器中打开指定页面
 *   - 支持所有 Next.js 路由
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// 将文件路径转换为 URL 路径
function filePathToUrl(filePath: string): string {
  // 移除 apps/web/ 前缀
  let urlPath = filePath.replace(/^apps\/web\//, '');
  
  // 移除 app/ 前缀
  urlPath = urlPath.replace(/^app\//, '');
  
  // 移除 [locale]/ 动态路由段
  urlPath = urlPath.replace(/\[locale\]\//, '');
  
  // 移除路由组 (dashboard), (auth) 等
  urlPath = urlPath.replace(/\([^)]+\)\//g, '');
  
  // 移除 page.tsx, layout.tsx 等文件名
  urlPath = urlPath.replace(/\/(page|layout|loading|error|not-found)\.(tsx|ts|jsx|js)$/, '');
  
  // 移除尾部斜杠
  urlPath = urlPath.replace(/\/$/, '');
  
  // 添加前导斜杠
  if (!urlPath.startsWith('/')) {
    urlPath = '/' + urlPath;
  }
  
  // 如果是根路径，改为 /dashboard (默认登录后页面)
  if (urlPath === '' || urlPath === '/') {
    urlPath = '/dashboard';
  }
  
  return urlPath;
}

// 检测语言环境
function detectLocale(filePath: string): string {
  // 检查文件路径中是否包含 [locale]
  if (filePath.includes('[locale]')) {
    return 'zh'; // 默认使用中文
  }
  return 'zh';
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('\n📄 页面预览工具 - Page Preview Tool\n', colors.bright);
    log('用法 / Usage:', colors.yellow);
    log('  pnpm preview <page-path>\n');
    log('示例 / Examples:', colors.green);
    log('  pnpm preview app/(dashboard)/cases/page.tsx');
    log('  pnpm preview app/(dashboard)/clients/page.tsx');
    log('  pnpm preview app/(dashboard)/dashboard/page.tsx');
    log('  pnpm preview app/(auth)/login/page.tsx\n');
    log('支持的路径格式 / Supported path formats:', colors.blue);
    log('  - 完整路径: apps/web/app/[locale]/(dashboard)/cases/page.tsx');
    log('  - 相对路径: app/(dashboard)/cases/page.tsx');
    log('  - 简短路径: (dashboard)/cases\n');
    process.exit(0);
  }
  
  let filePath = args[0];
  
  // 标准化路径
  filePath = filePath.replace(/\\/g, '/');
  
  // 检查文件是否存在
  const possiblePaths = [
    path.join(process.cwd(), filePath),
    path.join(process.cwd(), 'apps/web', filePath),
    path.join(process.cwd(), 'apps/web/app/[locale]', filePath),
    path.join(process.cwd(), 'apps/web/app/[locale]', filePath, 'page.tsx'),
  ];
  
  let actualPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      actualPath = p;
      break;
    }
  }
  
  if (!actualPath) {
    log(`\n❌ 找不到文件: ${filePath}\n`, colors.red);
    log('请检查路径是否正确，或尝试以下格式:', colors.yellow);
    log('  - app/(dashboard)/cases/page.tsx');
    log('  - (dashboard)/clients\n');
    process.exit(1);
  }
  
  // 转换为 URL 路径
  const locale = detectLocale(filePath);
  const urlPath = filePathToUrl(filePath);
  const fullUrl = `http://localhost:3002/${locale}${urlPath}`;
  
  log('\n🚀 启动页面预览...\n', colors.bright);
  log(`📁 文件路径: ${colors.green}${filePath}${colors.reset}`);
  log(`🌐 预览地址: ${colors.blue}${fullUrl}${colors.reset}\n`);
  
  log('⏳ 正在启动开发服务器...', colors.yellow);
  log('   (如果服务器已运行，将直接打开浏览器)\n');
  
  // 检查服务器是否已运行
  const checkServer = async (): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3002/api/health');
      return response.ok;
    } catch {
      return false;
    }
  };
  
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    log('✅ 开发服务器已运行', colors.green);
    openBrowser(fullUrl);
  } else {
    log('🔄 启动新的开发服务器...', colors.yellow);
    
    // 启动开发服务器
    const devServer = spawn('pnpm', ['dev'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true,
    });
    
    // 等待服务器启动
    let attempts = 0;
    const maxAttempts = 30;
    
    const waitForServer = setInterval(async () => {
      attempts++;
      
      if (await checkServer()) {
        clearInterval(waitForServer);
        log('\n✅ 开发服务器已就绪', colors.green);
        openBrowser(fullUrl);
        
        log('\n💡 提示:', colors.blue);
        log('   - 按 Ctrl+C 停止服务器');
        log('   - 页面会自动热重载\n');
      } else if (attempts >= maxAttempts) {
        clearInterval(waitForServer);
        log('\n❌ 服务器启动超时', colors.red);
        log('   请手动访问: ' + fullUrl + '\n');
        devServer.kill();
        process.exit(1);
      }
    }, 1000);
    
    // 处理 Ctrl+C
    process.on('SIGINT', () => {
      log('\n\n👋 关闭开发服务器...', colors.yellow);
      devServer.kill();
      process.exit(0);
    });
  }
}

// 在浏览器中打开 URL
function openBrowser(url: string) {
  const platform = process.platform;
  let command: string;
  
  if (platform === 'win32') {
    command = `start ${url}`;
  } else if (platform === 'darwin') {
    command = `open ${url}`;
  } else {
    command = `xdg-open ${url}`;
  }
  
  log(`\n🌐 在浏览器中打开: ${url}`, colors.blue);
  
  spawn(command, {
    shell: true,
    stdio: 'ignore',
  });
}

main().catch((error) => {
  log(`\n❌ 错误: ${error.message}\n`, colors.red);
  process.exit(1);
});
