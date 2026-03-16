import { PrismaClient } from '../../packages/database';
import { trackJudiciaryCases } from './hk-judiciary-crawler';
import { trackRssNews } from './rss-news-crawler';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting daily case tracking...\n');
  console.log('='.repeat(60));

  const startedAt = new Date();

  // Create a job run record so we can track status in the DB
  const jobRun = await prisma.crawlerJobRun.create({
    data: {
      triggeredBy: process.env.GITHUB_ACTIONS ? 'github_actions' : 'manual',
      status: 'RUNNING',
    },
  });

  console.log(`📝 Created job run record: ${jobRun.id}`);

  const stats = {
    judiciary: 0,
    rss: 0,
    errors: [] as string[],
  };

  // 1. Track HK Judiciary - TEMPORARILY DISABLED (source blocked/changed)
  // TODO: Re-implement with new judiciary.hk API when available
  console.log('\n⏸️  HK Judiciary tracking: DISABLED (source blocked)');
  console.log('   Waiting for new API implementation');
  stats.judiciary = 0;
  
  // Uncomment when new implementation is ready:
  // try {
  //   console.log('\n📜 Tracking HK Judiciary cases...');
  //   console.log('-'.repeat(60));
  //   stats.judiciary = await trackJudiciaryCases();
  //   console.log(`\n✅ Judiciary: ${stats.judiciary} cases processed`);
  // } catch (error: any) {
  //   console.error('\n❌ Judiciary tracking failed:', error.message);
  //   stats.errors.push(`Judiciary: ${error.message}`);
  // }

  // 2. Track RSS News
  let rssError: string | null = null;
  try {
    console.log('\n📰 Tracking RSS news sources...');
    console.log('-'.repeat(60));
    stats.rss = await trackRssNews();
    console.log(`\n✅ RSS: ${stats.rss} articles processed`);
  } catch (error: any) {
    console.error('\n❌ RSS tracking failed:', error.message);
    stats.errors.push(`RSS: ${error.message}`);
    rssError = error.message;
  }

  const completedAt = new Date();
  const durationSeconds = Math.round((completedAt.getTime() - startedAt.getTime()) / 1000);
  const totalAdded = stats.judiciary + stats.rss;
  const hasErrors = stats.errors.length > 0;

  // Determine final status
  const finalStatus = hasErrors
    ? (totalAdded > 0 ? 'PARTIAL_SUCCESS' : 'FAILED')
    : 'SUCCESS';

  // Update job run record with final stats
  await prisma.crawlerJobRun.update({
    where: { id: jobRun.id },
    data: {
      status: finalStatus,
      totalAdded,
      totalErrors: stats.errors.length,
      sourceStats: {
        judiciary: { added: stats.judiciary, errors: 0 },
        rss: { added: stats.rss, errors: rssError ? 1 : 0 },
      },
      errorMessage: stats.errors.length > 0 ? stats.errors.join('; ') : null,
      completedAt,
      durationSeconds,
    },
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Tracking Summary:');
  console.log('='.repeat(60));
  console.log(`   HK Judiciary: ${stats.judiciary} cases`);
  console.log(`   RSS News:     ${stats.rss} articles`);
  console.log(`   Total:        ${totalAdded} items`);
  console.log(`   Duration:     ${durationSeconds}s`);
  console.log(`   Status:       ${finalStatus}`);
  console.log(`   Job Run ID:   ${jobRun.id}`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors occurred (${stats.errors.length}):`);
    stats.errors.forEach((err) => console.log(`   - ${err}`));
    console.log('\n⚠️  Daily tracking completed with errors (non-fatal)');
    // Don't fail if only RSS sources have issues - they retry automatically
    // process.exit(1); // Disabled - allow partial success
  }

  console.log('\n✨ Daily tracking completed successfully!');
  await prisma.$disconnect();
  process.exit(0);
}

// Handle uncaught errors
process.on('unhandledRejection', async (error: any) => {
  console.error('\n💥 Unhandled error:', error);
  // Try to mark the most recent RUNNING job as FAILED
  try {
    const runningJob = await prisma.crawlerJobRun.findFirst({
      where: { status: 'RUNNING' },
      orderBy: { startedAt: 'desc' },
    });
    if (runningJob) {
      await prisma.crawlerJobRun.update({
        where: { id: runningJob.id },
        data: {
          status: 'FAILED',
          errorMessage: error?.message ?? String(error),
          completedAt: new Date(),
        },
      });
    }
  } catch (dbErr) {
    console.error('Failed to update job run status on crash:', dbErr);
  }
  await prisma.$disconnect();
  process.exit(1);
});

main();
