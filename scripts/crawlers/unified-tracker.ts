import { trackJudiciaryCases } from './hk-judiciary-crawler';
import { trackRssNews } from './rss-news-crawler';

async function main() {
  console.log('🚀 Starting daily case tracking...\n');
  console.log('='.repeat(60));

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
  try {
    console.log('\n📰 Tracking RSS news sources...');
    console.log('-'.repeat(60));
    stats.rss = await trackRssNews();
    console.log(`\n✅ RSS: ${stats.rss} articles processed`);
  } catch (error: any) {
    console.error('\n❌ RSS tracking failed:', error.message);
    stats.errors.push(`RSS: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Tracking Summary:');
  console.log('='.repeat(60));
  console.log(`   HK Judiciary: ${stats.judiciary} cases`);
  console.log(`   RSS News:     ${stats.rss} articles`);
  console.log(`   Total:        ${stats.judiciary + stats.rss} items`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors occurred (${stats.errors.length}):`);
    stats.errors.forEach((err) => console.log(`   - ${err}`));
    console.log('\n⚠️  Daily tracking completed with errors (non-fatal)');
    // Don't fail if only RSS sources have issues - they retry automatically
    // process.exit(1); // Disabled - allow partial success
  }

  console.log('\n✨ Daily tracking completed successfully!');
  process.exit(0);
}

// Handle uncaught errors
process.on('unhandledRejection', (error: any) => {
  console.error('\n💥 Unhandled error:', error);
  process.exit(1);
});

main();
