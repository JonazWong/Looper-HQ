import { PrismaClient, CaseSource } from '../../packages/database';
import { RssNewsAdapter } from '../../apps/web/lib/services/data-sources/rss-news-adapter';
import { defaultCrawlerConfig, getRandomUserAgent, isKnownError } from './crawler-config';
import { isBlacklisted } from './source-blacklist';

const prisma = new PrismaClient();

// Time window configuration for duplicate detection
const TIME_WINDOW_CONFIG = {
  daysToCheck: 7,
  msInDay: 1000 * 60 * 60 * 24,
};

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate cutoff timestamp for duplicate checking
 */
function getCutoffTimestamp(): Date {
  const now = Date.now();
  const offset = TIME_WINDOW_CONFIG.daysToCheck * TIME_WINDOW_CONFIG.msInDay;
  return new Date(now - offset);
}

/**
 * Track RSS news sources with retry logic and success rate monitoring
 */
export async function trackRssNews(): Promise<number> {
  let totalUpdated = 0;
  const sourceResults: Array<{ name: string; success: boolean }> = [];

  try {
    // Load active RSS sources from database
    const allSources = await prisma.rssSource.findMany({
      where: {
        isActive: true,
        status: { in: ['ACTIVE', 'ERROR'] },
      },
    });

    console.log(`📰 Found ${allSources.length} RSS sources in database`);

    if (allSources.length === 0) {
      throw new Error('No active RSS sources configured in database. Run crawler:ensure-sources first.');
    }

    // Filter sources that need to be fetched based on fetchInterval
    const now = new Date();
    const sources = allSources.filter(source => {
      if (!source.lastFetchAt) {
        console.log(`  ✓ ${source.name}: Never fetched before`);
        return true;
      }
      
      const nextFetchTime = new Date(source.lastFetchAt.getTime() + source.fetchInterval * 1000);
      const shouldFetch = now >= nextFetchTime;
      
      if (shouldFetch) {
        const minutesSince = Math.floor((now.getTime() - source.lastFetchAt.getTime()) / 60000);
        console.log(`  ✓ ${source.name}: Last fetched ${minutesSince}m ago (interval: ${source.fetchInterval / 60}m)`);
        return true;
      } else {
        const minutesUntilNext = Math.ceil((nextFetchTime.getTime() - now.getTime()) / 60000);
        console.log(`  ⏭ ${source.name}: Skip - next fetch in ${minutesUntilNext}m`);
        return false;
      }
    });

    if (sources.length === 0) {
      console.log(`\n⏸️  No sources need fetching at this time`);
      return 0;
    }

    console.log(`\n🚀 Processing ${sources.length} sources...\n`);

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      
      // Check blacklist before processing
      const blacklistEntry = isBlacklisted(source.url);
      if (blacklistEntry) {
        console.log(`🚫 [${i + 1}/${sources.length}] ${source.name}: Skipped (blacklisted)`);
        console.log(`   Reason: ${blacklistEntry.reason}`);
        continue;
      }

      let retryCount = 0;
      let lastError: string | null = null;
      let sourceSuccess = false;

      // Add configured delay between sources to avoid server pressure
      if (i > 0) {
        const delayMs = defaultCrawlerConfig.rateLimitDelayMs;
        console.log(`  ⏳ Waiting ${delayMs / 1000}s before next source...`);
        await sleep(delayMs);
      }

      console.log(`\nProcessing [${i + 1}/${sources.length}]: ${source.name}...`);

      // Retry loop - use configured maxRetries
      const maxRetries = defaultCrawlerConfig.maxRetries;
      while (retryCount <= maxRetries && !sourceSuccess) {
        try {
          if (retryCount > 0) {
            const retryDelayMs = defaultCrawlerConfig.retryDelayMs;
            console.log(`  Retry ${retryCount}/${maxRetries} after ${retryDelayMs / 1000}s delay...`);
            await sleep(retryDelayMs);
          }

          // Create adapter for this source with random User-Agent rotation
          const headers = defaultCrawlerConfig.userAgentRotation
            ? { 'User-Agent': getRandomUserAgent() }
            : undefined;

          const adapter = new RssNewsAdapter(
            source.source as CaseSource,
            source.url,
            source.keywords,
            source.excludeKeywords
          );

          // Fetch articles
          const result = await adapter.fetch({});
          console.log(`  Found ${result.cases.length} articles after filtering`);

          // Fetch recent cases once for similarity checking
          const recentCases = await prisma.publicCase.findMany({
            where: {
              source: source.source as CaseSource,
              publishedAt: { gte: getCutoffTimestamp() },
            },
            select: { title_zh: true, title_en: true, id: true, externalId: true },
          });

          const existingTitles = recentCases.map(c => c.title_zh || c.title_en);
          const existingIds = new Set(recentCases.map(c => c.externalId));

          // Upsert each case with deduplication
          let updated = 0;
          let created = 0;
          let duplicatesSkipped = 0;

          for (const caseData of result.cases) {
            // Check if already exists by externalId
            const alreadyExists = existingIds.has(caseData.externalId);

            // Check for near-duplicates by title similarity
            const isDuplicate = adapter.checkTitleSimilarity(
              caseData.title,
              existingTitles,
              0.85
            );

            if (isDuplicate && !alreadyExists) {
              duplicatesSkipped++;
              continue; // Skip near-duplicate
            }

            await prisma.publicCase.upsert({
              where: {
                source_externalId: {
                  source: caseData.source,
                  externalId: caseData.externalId,
                },
              },
              update: {
                title_zh: caseData.title,
                title_en: caseData.title, // RSS usually in Chinese, use same for both
                description_zh: caseData.description,
                description_en: caseData.description,
                category: caseData.category,
                keywords: caseData.keywords,
                tags: caseData.tags,
                // updatedAt is automatically managed by Prisma @updatedAt
              },
              create: {
                source: caseData.source,
                externalId: caseData.externalId,
                sourceUrl: caseData.sourceUrl,
                title_zh: caseData.title,
                title_en: caseData.title,
                description_zh: caseData.description,
                description_en: caseData.description,
                category: caseData.category,
                publishedAt: caseData.publishedAt,
                author: caseData.author,
                keywords: caseData.keywords,
                tags: caseData.tags,
                crawledAt: new Date(),
              },
            });

            if (alreadyExists) {
              updated++;
            } else {
              created++;
            }
            totalUpdated++;
          }

          // Update source status - success
          await prisma.rssSource.update({
            where: { id: source.id },
            data: {
              status: 'ACTIVE',
              lastFetchAt: new Date(),
              lastError: null,
            },
          });

          console.log(`  ✅ ${source.name}: ${created} new, ${updated} updated, ${duplicatesSkipped} duplicates skipped`);
          sourceSuccess = true;
          sourceResults.push({ name: source.name, success: true });
        } catch (error: any) {
          lastError = error.message;
          retryCount++;

          // Use isKnownError to determine log level
          const isKnown = isKnownError(error.message);
          const logLevel = isKnown ? '⚠️ ' : '❌';

          if (retryCount > maxRetries) {
            if (isKnown) {
              console.warn(`${logLevel} ${source.name} failed (known error): ${error.message}`);
            } else {
              console.error(`${logLevel} ${source.name} failed after ${maxRetries} retries: ${error.message}`);
            }

            // Update error status
            await prisma.rssSource.update({
              where: { id: source.id },
              data: {
                status: 'ERROR',
                lastError: error.message,
              },
            });

            sourceResults.push({ name: source.name, success: false });
          } else {
            // Log retry attempt differently based on error type
            if (isKnown) {
              console.warn(`  ${logLevel} Known error (attempt ${retryCount}/${maxRetries}): ${error.message}`);
            } else {
              console.error(`  ${logLevel} Error (attempt ${retryCount}/${maxRetries}): ${error.message}`);
            }
          }
        }
      }
    }

    // Calculate and log success rate
    if (sourceResults.length > 0) {
      const successCount = sourceResults.filter(r => r.success).length;
      const successRate = (successCount / sourceResults.length) * 100;
      const threshold = defaultCrawlerConfig.successRateThreshold * 100;

      console.log(`\n📊 Success Rate Summary:`);
      console.log(`  Total sources: ${sourceResults.length}`);
      console.log(`  Successful: ${successCount}`);
      console.log(`  Failed: ${sourceResults.length - successCount}`);
      console.log(`  Success rate: ${successRate.toFixed(1)}%`);
      console.log(`  Threshold: ${threshold.toFixed(0)}%`);

      if (successRate < threshold) {
        console.warn(`\n⚠️  WARNING: Success rate (${successRate.toFixed(1)}%) is below configured threshold (${threshold}%)`);
      }

      if (successCount === 0) {
        throw new Error('All active RSS sources failed to fetch or parse');
      }
    }

    return totalUpdated;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  trackRssNews()
    .then((count) => {
      console.log(`\n✨ RSS tracking completed: ${count} articles processed`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ RSS tracking failed:', error);
      process.exit(1);
    });
}
