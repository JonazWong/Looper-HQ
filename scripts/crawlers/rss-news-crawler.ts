import { PrismaClient, CaseSource } from '@looper-hq/database';
import { RssNewsAdapter } from '../../apps/web/lib/services/data-sources/rss-news-adapter';

const prisma = new PrismaClient();

/**
 * Track RSS news sources
 */
export async function trackRssNews(): Promise<number> {
  let totalUpdated = 0;

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
      try {
        console.log(`\nProcessing: ${source.name}...`);

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
              updatedAt: new Date(),
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

        // Update source status
        await prisma.rssSource.update({
          where: { id: source.id },
          data: {
            status: 'ACTIVE',
            lastFetchAt: new Date(),
            lastError: null,
          },
        });

        console.log(`  ✅ ${source.name}: ${created} new, ${updated} updated`);
      } catch (error: any) {
        console.error(`  ❌ ${source.name} failed:`, error.message);

        // Update error status
        await prisma.rssSource.update({
          where: { id: source.id },
          data: {
            status: 'ERROR',
            lastError: error.message,
          },
        });
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
