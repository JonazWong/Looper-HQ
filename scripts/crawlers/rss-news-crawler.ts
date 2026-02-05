import { PrismaClient, CaseSource } from '../../packages/database';
import { RssNewsAdapter } from '../../apps/web/lib/services/data-sources/rss-news-adapter';

const prisma = new PrismaClient();

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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
      let retryCount = 0;
      let lastError: string | null = null;
      let sourceSuccess = false;

      // Add 2-second delay between sources to avoid server pressure
      if (i > 0) {
        console.log('  ⏳ Waiting 2s before next source...');
        await sleep(2000);
      }

      console.log(`\nProcessing [${i + 1}/${sources.length}]: ${source.name}...`);

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

          // Upsert each case
          let updated = 0;
          let created = 0;

          for (const caseData of result.cases) {
            const existing = await prisma.publicCase.findUnique({
              where: {
                source_externalId: {
                  source: caseData.source,
                  externalId: caseData.externalId,
                },
              },
            });

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

            if (existing) {
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

          console.log(`  ✅ ${source.name}: ${created} new, ${updated} updated`);
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
