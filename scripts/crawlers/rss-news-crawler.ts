import { PrismaClient, CaseSource } from '@looper-hq/database';
import { RssNewsAdapter } from '../../apps/web/lib/services/data-sources/rss-news-adapter';

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
    const sources = await prisma.rssSource.findMany({
      where: {
        isActive: true,
        status: { in: ['ACTIVE', 'ERROR'] },
      },
    });

    console.log(`📰 Found ${sources.length} RSS sources to track`);

    for (const source of sources) {
      let retryCount = 0;
      let lastError: string | null = null;
      let sourceSuccess = false;

      console.log(`\nProcessing: ${source.name}...`);

      // Retry loop
      while (retryCount <= source.maxRetries && !sourceSuccess) {
        try {
          if (retryCount > 0) {
            console.log(`  Retry ${retryCount}/${source.maxRetries} after ${source.retryDelay}s delay...`);
            await sleep(source.retryDelay * 1000);
          }

          // Create adapter for this source
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
            select: { title: true, id: true, externalId: true },
          });

          const existingTitles = recentCases.map(c => c.title);
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
                title: caseData.title,
                description: caseData.description,
                category: caseData.category,
                keywords: caseData.keywords,
                tags: caseData.tags,
                // updatedAt is automatically managed by Prisma @updatedAt
              },
              create: {
                source: caseData.source,
                externalId: caseData.externalId,
                sourceUrl: caseData.sourceUrl,
                title: caseData.title,
                description: caseData.description,
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

          if (retryCount > source.maxRetries) {
            console.error(`  ❌ ${source.name} failed after ${source.maxRetries} retries: ${error.message}`);

            // Update error status
            await prisma.rssSource.update({
              where: { id: source.id },
              data: {
                status: 'ERROR',
                lastError: error.message,
              },
            });

            sourceResults.push({ name: source.name, success: false });
          }
        }
      }
    }

    // Calculate and log success rate
    if (sourceResults.length > 0) {
      const successCount = sourceResults.filter(r => r.success).length;
      const successRate = (successCount / sourceResults.length) * 100;

      console.log(`\n📊 Success Rate Summary:`);
      console.log(`  Total sources: ${sourceResults.length}`);
      console.log(`  Successful: ${successCount}`);
      console.log(`  Failed: ${sourceResults.length - successCount}`);
      console.log(`  Success rate: ${successRate.toFixed(1)}%`);

      if (successRate < 50) {
        console.warn(`\n⚠️  WARNING: Success rate (${successRate.toFixed(1)}%) is below 50%`);
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
