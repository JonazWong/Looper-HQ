#!/usr/bin/env tsx
/**
 * 页面快照工具 - Page Snapshot Tool
 * 
 * 将页面保存为静态 HTML 文件，方便离线查看和比较
 * 
 * 用法 / Usage:
 *   pnpm snapshot app/(dashboard)/cases/page.tsx
 *   pnpm snapshot app/(dashboard)/clients/page.tsx --output snapshots/clients.html
 * 
 * 功能 / Features:
 *   - 保存完整的 HTML (包含所有 CSS)
 *   - 可以离线查看
 *   - 方便前后版本比较
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

// 将文件路径转换为 URL 路径 (与 preview-page.ts 相同)
function filePathToUrl(filePath: string): string {
  let urlPath = filePath.replace(/^apps\/web\//, '');
  urlPath = urlPath.replace(/^app\//, '');
  urlPath = urlPath.replace(/\[locale\]\//, '');
  urlPath = urlPath.replace(/\([^)]+\)\//g, '');
  urlPath = urlPath.replace(/\/(page|layout|loading|error|not-found)\.(tsx|ts|jsx|js)$/, '');
  urlPath = urlPath.replace(/\/$/, '');
  
  if (!urlPath.startsWith('/')) {
    urlPath = '/' + urlPath;
  }
  
  if (urlPath === '' || urlPath === '/') {
    urlPath = '/dashboard';
  }
  
  return urlPath;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log('\n📸 页面快照工具 - Page Snapshot Tool\n', colors.bright);
    log('用法 / Usage:', colors.yellow);
    log('  pnpm snapshot <page-path> [options]\n');
    log('选项 / Options:', colors.blue);
    log('  --output, -o <path>    输出文件路径 (默认: snapshots/<pagename>.html)');
    log('  --viewport <size>      视口大小 (默认: 1920x1080)');
    log('  --locale <lang>        语言 (默认: zh)\n');
    log('示例 / Examples:', colors.green);
    log('  pnpm snapshot app/(dashboard)/cases/page.tsx');
    log('  pnpm snapshot (dashboard)/clients -o my-snapshot.html');
    log('  pnpm snapshot dashboard --locale en\n');
    process.exit(0);
  }
  
  // 解析参数
  const filePath = args[0].replace(/\\/g, '/');
  const outputIndex = args.indexOf('--output') !== -1 ? args.indexOf('--output') : args.indexOf('-o');
  const localeIndex = args.indexOf('--locale');
  const viewportIndex = args.indexOf('--viewport');
  
  const locale = localeIndex !== -1 ? args[localeIndex + 1] : 'zh';
  const viewport = viewportIndex !== -1 ? args[viewportIndex + 1] : '1920x1080';
  
  const urlPath = filePathToUrl(filePath);
  const pageName = urlPath.split('/').filter(Boolean).join('-') || 'home';
  const defaultOutput = path.join(process.cwd(), 'snapshots', `${pageName}-${locale}.html`);
  const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : defaultOutput;
  
  // 确保输出目录存在
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const fullUrl = `http://localhost:3002/${locale}${urlPath}`;
  
  log('\n📸 生成页面快照...\n', colors.bright);
  log(`📁 页面路径: ${colors.green}${filePath}${colors.reset}`);
  log(`🌐 URL: ${colors.blue}${fullUrl}${colors.reset}`);
  log(`💾 输出文件: ${colors.yellow}${outputPath}${colors.reset}\n`);
  
  // 检查是否安装了 Playwright (如果没有，提供替代方案)
  log('⚠️  此功能需要 Playwright。正在检查...', colors.yellow);
  
  try {
    require.resolve('playwright');
    log('✅ Playwright 已安装\n', colors.green);
    await captureWithPlaywright(fullUrl, outputPath, viewport);
  } catch {
    log('❌ Playwright 未安装', colors.red);
    log('\n💡 安装方法:', colors.blue);
    log('   pnpm add -D playwright');
    log('   pnpm exec playwright install chromium\n');
    log('或者使用简化版本 (仅保存 DOM，不含样式):', colors.yellow);
    log('   pnpm snapshot:simple ' + filePath + '\n');
    process.exit(1);
  }
}

async function captureWithPlaywright(url: string, outputPath: string, viewport: string) {
  const { chromium } = require('playwright');
  
  const [width, height] = viewport.split('x').map(Number);
  
  log('🚀 启动浏览器...', colors.yellow);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width, height },
  });
  const page = await context.newPage();
  
  log('📡 访问页面...', colors.yellow);
  await page.goto(url, { waitUntil: 'networkidle' });
  
  // 等待 React 渲染完成
  await page.waitForTimeout(2000);
  
  log('💾 保存 HTML...', colors.yellow);
  const html = await page.content();
  
  // 添加基础 URL，使相对路径的资源可以加载
  const htmlWithBase = html.replace(
    '<head>',
    `<head>\n    <base href="${url.replace(/\/[^\/]*$/, '/')}"/>`
  );
  
  fs.writeFileSync(outputPath, htmlWithBase);
  
  await browser.close();
  
  log(`\n✅ 快照已保存: ${outputPath}`, colors.green);
  log(`📦 文件大小: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`, colors.blue);
  log(`\n💡 打开快照: file://${outputPath}\n`, colors.blue);
}

main().catch((error) => {
  log(`\n❌ 错误: ${error.message}\n`, colors.red);
  console.error(error);
  process.exit(1);
});
