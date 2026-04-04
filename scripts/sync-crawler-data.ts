#!/usr/bin/env tsx

import { PrismaClient } from '../packages/database';

const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_SYNC_DAYS = 30;

function getRequiredSourceUrl(): string {
  return process.env.CRAWLER_SYNC_SOURCE_DATABASE_URL
    || process.env.DO_DATABASE_URL
    || process.env.SOURCE_DATABASE_URL
    || '';
}

function getRequiredTargetUrl(): string {
  return process.env.CRAWLER_SYNC_TARGET_DATABASE_URL
    || process.env.TARGET_DATABASE_URL
    || process.env.DATABASE_URL
    || '';
}

function parseSyncDays(): number {
  const raw = process.env.CRAWLER_SYNC_DAYS;
  if (!raw) return DEFAULT_SYNC_DAYS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SYNC_DAYS;
}

function createClient(url: string): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: { url },
    },
  });
}

async function syncRssSources(source: PrismaClient, target: PrismaClient) {
  const rssSources = await source.rssSource.findMany({
    orderBy: { updatedAt: 'asc' },
  });

  for (const rssSource of rssSources) {
    await target.rssSource.upsert({
      where: { source: rssSource.source },
      update: {
        name: rssSource.name,
        url: rssSource.url,
        isActive: rssSource.isActive,
        status: rssSource.status,
        lastError: rssSource.lastError,
        lastFetchAt: rssSource.lastFetchAt,
        fetchInterval: rssSource.fetchInterval,
        maxRetries: rssSource.maxRetries,
        retryDelay: rssSource.retryDelay,
        keywords: rssSource.keywords,
        excludeKeywords: rssSource.excludeKeywords,
      },
      create: {
        id: rssSource.id,
        name: rssSource.name,
        source: rssSource.source,
        url: rssSource.url,
        isActive: rssSource.isActive,
        status: rssSource.status,
        lastError: rssSource.lastError,
        lastFetchAt: rssSource.lastFetchAt,
        fetchInterval: rssSource.fetchInterval,
        maxRetries: rssSource.maxRetries,
        retryDelay: rssSource.retryDelay,
        keywords: rssSource.keywords,
        excludeKeywords: rssSource.excludeKeywords,
      },
    });
  }

  return rssSources.length;
}

async function syncPublicCases(source: PrismaClient, target: PrismaClient, cutoff: Date) {
  let cursorId: string | undefined;
  let total = 0;

  while (true) {
    const batch = await source.publicCase.findMany({
      where: {
        updatedAt: { gte: cutoff },
      },
      orderBy: { id: 'asc' },
      take: DEFAULT_BATCH_SIZE,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    });

    if (batch.length === 0) {
      break;
    }

    for (const publicCase of batch) {
      await target.publicCase.upsert({
        where: {
          source_externalId: {
            source: publicCase.source,
            externalId: publicCase.externalId,
          },
        },
        update: {
          sourceUrl: publicCase.sourceUrl,
          caseNumber: publicCase.caseNumber,
          title_zh: publicCase.title_zh,
          title_en: publicCase.title_en,
          description_zh: publicCase.description_zh,
          description_en: publicCase.description_en,
          category: publicCase.category,
          court: publicCase.court,
          parties: publicCase.parties,
          judge: publicCase.judge,
          judgmentDate: publicCase.judgmentDate,
          judgment_zh: publicCase.judgment_zh,
          judgment_en: publicCase.judgment_en,
          keywords: publicCase.keywords,
          tags: publicCase.tags,
          publishedAt: publicCase.publishedAt,
          author: publicCase.author,
          neutralCitation: publicCase.neutralCitation,
          courtLevel: publicCase.courtLevel,
          fullText: publicCase.fullText,
          crawledAt: publicCase.crawledAt,
        },
        create: {
          id: publicCase.id,
          source: publicCase.source,
          externalId: publicCase.externalId,
          sourceUrl: publicCase.sourceUrl,
          caseNumber: publicCase.caseNumber,
          title_zh: publicCase.title_zh,
          title_en: publicCase.title_en,
          description_zh: publicCase.description_zh,
          description_en: publicCase.description_en,
          category: publicCase.category,
          court: publicCase.court,
          parties: publicCase.parties,
          judge: publicCase.judge,
          judgmentDate: publicCase.judgmentDate,
          judgment_zh: publicCase.judgment_zh,
          judgment_en: publicCase.judgment_en,
          keywords: publicCase.keywords,
          tags: publicCase.tags,
          publishedAt: publicCase.publishedAt,
          author: publicCase.author,
          neutralCitation: publicCase.neutralCitation,
          courtLevel: publicCase.courtLevel,
          fullText: publicCase.fullText,
          crawledAt: publicCase.crawledAt,
        },
      });
      total++;
    }

    cursorId = batch[batch.length - 1]?.id;
  }

  return total;
}

async function syncCrawlerJobRuns(source: PrismaClient, target: PrismaClient, cutoff: Date) {
  const jobRuns = await source.crawlerJobRun.findMany({
    where: {
      startedAt: { gte: cutoff },
    },
    orderBy: { startedAt: 'asc' },
  });

  for (const jobRun of jobRuns) {
    await target.crawlerJobRun.upsert({
      where: { id: jobRun.id },
      update: {
        triggeredBy: jobRun.triggeredBy,
        status: jobRun.status,
        totalAdded: jobRun.totalAdded,
        totalSkipped: jobRun.totalSkipped,
        totalErrors: jobRun.totalErrors,
        sourceStats: jobRun.sourceStats,
        aiAnalysisRan: jobRun.aiAnalysisRan,
        aiAnalysisCount: jobRun.aiAnalysisCount,
        errorMessage: jobRun.errorMessage,
        startedAt: jobRun.startedAt,
        completedAt: jobRun.completedAt,
        durationSeconds: jobRun.durationSeconds,
      },
      create: {
        id: jobRun.id,
        triggeredBy: jobRun.triggeredBy,
        status: jobRun.status,
        totalAdded: jobRun.totalAdded,
        totalSkipped: jobRun.totalSkipped,
        totalErrors: jobRun.totalErrors,
        sourceStats: jobRun.sourceStats,
        aiAnalysisRan: jobRun.aiAnalysisRan,
        aiAnalysisCount: jobRun.aiAnalysisCount,
        errorMessage: jobRun.errorMessage,
        startedAt: jobRun.startedAt,
        completedAt: jobRun.completedAt,
        durationSeconds: jobRun.durationSeconds,
        createdAt: jobRun.createdAt,
      },
    });
  }

  return jobRuns.length;
}

async function main() {
  const sourceUrl = getRequiredSourceUrl();
  const targetUrl = getRequiredTargetUrl();

  if (!sourceUrl) {
    throw new Error('Missing source DB URL. Set CRAWLER_SYNC_SOURCE_DATABASE_URL or DO_DATABASE_URL.');
  }

  if (!targetUrl) {
    throw new Error('Missing target DB URL. Set CRAWLER_SYNC_TARGET_DATABASE_URL or DATABASE_URL.');
  }

  const syncDays = parseSyncDays();
  const cutoff = new Date(Date.now() - syncDays * 24 * 60 * 60 * 1000);

  const source = createClient(sourceUrl);
  const target = createClient(targetUrl);

  try {
    console.log('🔄 Syncing crawler data between databases...');
    console.log(`   Window: last ${syncDays} days`);

    const rssSourcesSynced = await syncRssSources(source, target);
    const publicCasesSynced = await syncPublicCases(source, target, cutoff);
    const jobRunsSynced = await syncCrawlerJobRuns(source, target, cutoff);

    console.log('\n✅ Sync completed');
    console.log(`   rss_sources: ${rssSourcesSynced}`);
    console.log(`   public_cases: ${publicCasesSynced}`);
    console.log(`   crawler_job_runs: ${jobRunsSynced}`);
  } finally {
    await source.$disconnect();
    await target.$disconnect();
  }
}

main().catch((error) => {
  console.error('\n❌ Crawler data sync failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});