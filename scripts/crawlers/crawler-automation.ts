#!/usr/bin/env tsx

import { PrismaClient, RssSourceStatus } from '../../packages/database';
import { defaultCrawlerConfig } from './crawler-config';
import { SOURCE_BLACKLIST, isBlacklisted } from './source-blacklist';

const prisma = new PrismaClient();
const fixMode = process.argv.includes('--fix') || process.argv.includes('fix');

function printHeader() {
  console.log('🔧 Crawler Automation Check');
  console.log('='.repeat(72));
  console.log(`Mode: ${fixMode ? 'AUTO-FIX' : 'CHECK ONLY'}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(72));
}

function checkEnv(name: string) {
  const value = process.env[name];
  const hasValue = typeof value !== 'undefined' && value !== '';
  console.log(`${hasValue ? '✅' : '❌'} ${name}: ${hasValue ? value : 'MISSING'}`);
}

function checkNumericEnv(name: string, defaultValue: number) {
  const raw = process.env[name];
  const parsed = raw ? Number(raw) : NaN;
  const valid = !Number.isNaN(parsed) && parsed > 0;
  console.log(`${valid ? '✅' : '⚠️'} ${name}: ${valid ? parsed : `${raw ?? 'missing'} (default ${defaultValue})`}`);
}

async function runCheck() {
  printHeader();

  console.log('\n1) 檢查環境變數');
  checkEnv('CRAWLER_ENABLED');
  checkEnv('RSS_USER_AGENT');
  checkEnv('RSS_PROXY_URL');
  checkEnv('DATABASE_URL');
  checkNumericEnv('CRAWLER_MAX_RETRIES', defaultCrawlerConfig.maxRetries);
  checkNumericEnv('CRAWLER_TIMEOUT_MS', defaultCrawlerConfig.timeoutMs);
  checkNumericEnv('CRAWLER_RATE_LIMIT_MS', defaultCrawlerConfig.rateLimitDelayMs);

  console.log('\n2) 檢查 crawler-config.ts');
  console.log(`  - maxRetries: ${defaultCrawlerConfig.maxRetries}`);
  console.log(`  - retryDelayMs: ${defaultCrawlerConfig.retryDelayMs}`);
  console.log(`  - timeoutMs: ${defaultCrawlerConfig.timeoutMs}`);
  console.log(`  - successRateThreshold: ${defaultCrawlerConfig.successRateThreshold}`);
  console.log(`  - rateLimitDelayMs: ${defaultCrawlerConfig.rateLimitDelayMs}`);
  console.log(`  - userAgentRotation: ${defaultCrawlerConfig.userAgentRotation}`);
  console.log(`  - maxConsecutiveFailures: ${defaultCrawlerConfig.maxConsecutiveFailures}`);
  console.log(`  - blacklisted patterns: ${defaultCrawlerConfig.knownErrorPatterns.length}`);

  console.log('\n3) 來源黑名單檢查');
  console.log(`  - 明確黑名單條目: ${SOURCE_BLACKLIST.length}`);
  SOURCE_BLACKLIST.forEach((item) => {
    console.log(`    · ${item.pattern} (${item.reason})`);
  });

  console.log('\n4) 資料庫中的 RSS 來源狀態');
  const sources = await prisma.rssSource.findMany({
    orderBy: [{ isActive: 'desc' }, { status: 'asc' }, { name: 'asc' }],
  });

  if (sources.length === 0) {
    console.log('  ⚠️  未找到任何 RSS 來源配置，請先執行 pnpm db:seed 或 scripts/ensure-rss-sources.ts');
    return;
  }

  const now = Date.now();
  const blacklistedSources = sources.filter((s) => isBlacklisted(s.url) !== null);
  const errorSources = sources.filter((s) => s.isActive && s.status === RssSourceStatus.ERROR);
  const staleSources = sources.filter((s) => {
    if (!s.lastFetchAt || !s.fetchInterval) return false;
    const lastFetchMs = s.lastFetchAt.getTime();
    return now - lastFetchMs > s.fetchInterval * 2 * 1000;
  });
  const inactiveErrorSources = sources.filter((s) => !s.isActive && s.status === RssSourceStatus.ERROR);

  console.log(`  - RSS sources: ${sources.length}`);
  console.log(`  - Active sources: ${sources.filter((s) => s.isActive).length}`);
  console.log(`  - ERROR sources: ${errorSources.length}`);
  console.log(`  - Stale sources: ${staleSources.length}`);
  console.log(`  - Blacklisted sources: ${blacklistedSources.length}`);

  for (const source of sources) {
    const statusIcon = source.status === RssSourceStatus.ACTIVE ? '✅' :
      source.status === RssSourceStatus.ERROR ? '❌' :
      source.status === RssSourceStatus.INACTIVE ? '⏸️' : '⚪';
    const activeIcon = source.isActive ? '🟢' : '🔴';
    const ageMinutes = source.lastFetchAt ? Math.floor((now - source.lastFetchAt.getTime()) / 60000) : null;
    const staleNote = ageMinutes !== null && source.fetchInterval ? ` (${ageMinutes}m since last fetch)` : '';
    console.log(`\n  ${activeIcon} ${statusIcon} ${source.name}`);
    console.log(`    source: ${source.source}`);
    console.log(`    url: ${source.url}`);
    console.log(`    status: ${source.status}`);
    console.log(`    isActive: ${source.isActive}`);
    console.log(`    fetchInterval: ${source.fetchInterval}s`);
    console.log(`    lastFetchAt: ${source.lastFetchAt ? source.lastFetchAt.toISOString() : 'never'}${staleNote}`);
    if (source.lastError) {
      console.log(`    lastError: ${source.lastError.substring(0, 120)}`);
    }
    const blacklistedEntry = isBlacklisted(source.url);
    if (blacklistedEntry) {
      console.log(`    ⚠️  Blacklisted: ${blacklistedEntry.pattern} (${blacklistedEntry.reason})`);
    }
  }

  if (blacklistedSources.length > 0) {
    console.log('\n⚠️  建議修復: 黑名單來源應自動停用以避免封鎖或錯誤抓取');
  }

  if (errorSources.length > 0) {
    console.log('\n⚠️  建議修復: 目前有錯誤來源，請檢查 lastError 並考慮暫時停用');
  }

  if (staleSources.length > 0) {
    console.log('\n🟡 建議修復: 來源已過期未抓取，請檢查排程、cron 或爬蟲執行狀態');
  }

  if (fixMode) {
    console.log('\n5) 進入自動修復模式');
    const autoDisable = sources.filter((source) => {
      const blacklistedEntry = isBlacklisted(source.url);
      const hasStaleError = source.isActive && source.status === RssSourceStatus.ERROR && source.lastFetchAt && (now - source.lastFetchAt.getTime() > 72 * 60 * 60 * 1000);
      return blacklistedEntry || hasStaleError;
    });

    if (autoDisable.length === 0) {
      console.log('  ✔️  沒有符合自動停用條件的來源。');
    } else {
      for (const source of autoDisable) {
        console.log(`  🔧 自動停用: ${source.name} (${source.url})`);
        await prisma.rssSource.update({
          where: { id: source.id },
          data: {
            isActive: false,
            status: RssSourceStatus.INACTIVE,
            lastError: source.lastError
              ? `${source.lastError} | auto-disabled by crawler-automation` 
              : 'auto-disabled by crawler-automation',
          },
        });
      }
      console.log(`  ✅ 已停用 ${autoDisable.length} 個來源。`);
    }
  }

  console.log('\n' + '='.repeat(72));
  console.log('Crawler automation check finished.');
}

runCheck()
  .catch((error) => {
    console.error('❌ Crawler automation failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
