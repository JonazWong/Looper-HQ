import { prisma } from '../../packages/database';

/**
 * Health check for RSS sources
 * Shows status, last fetch time, and errors
 */
async function checkRssHealth() {
  console.log('🏥 RSS Source Health Check');
  console.log('='.repeat(60));
  console.log(`Current time: ${new Date().toISOString()}\n`);

  const sources = await prisma.rssSource.findMany({
    orderBy: [
      { isActive: 'desc' },
      { status: 'asc' },
      { name: 'asc' },
    ],
  });

  if (sources.length === 0) {
    console.log('⚠️  No RSS sources found in database');
    console.log('💡 Run: pnpm db:seed');
    return;
  }

  console.log(`Total sources: ${sources.length}\n`);

  // Active sources
  const activeSources = sources.filter(s => s.isActive);
  console.log(`🟢 Active Sources: ${activeSources.length}\n`);

  for (const source of activeSources) {
    const lastFetchAgo = source.lastFetchAt
      ? Math.floor((Date.now() - source.lastFetchAt.getTime()) / 60000)
      : null;

    const expectedInterval = source.fetchInterval / 60; // minutes
    const isStale = lastFetchAgo !== null && lastFetchAgo > expectedInterval * 2;
    const statusIcon = 
      source.status === 'ACTIVE' && !isStale ? '✅' :
      source.status === 'ERROR' ? '🔴' :
      isStale ? '🟡' : '⏸️';

    console.log(`${statusIcon} ${source.name}`);
    console.log(`  Status: ${source.status}`);
    console.log(`  URL: ${source.url}`);
    console.log(`  Last fetch: ${lastFetchAgo !== null ? `${lastFetchAgo}m ago` : 'Never'}`);
    console.log(`  Interval: ${expectedInterval}m`);
    
    if (isStale) {
      console.log(`  ⚠️ STALE: Should fetch every ${expectedInterval}m, last fetched ${lastFetchAgo}m ago`);
    }
    
    if (source.lastError) {
      console.log(`  ❌ Last error: ${source.lastError.slice(0, 100)}${source.lastError.length > 100 ? '...' : ''}`);
    }
    
    console.log(`  Keywords: ${source.keywords.length} terms`);
    console.log('');
  }

  // Inactive sources
  const inactiveSources = sources.filter(s => !s.isActive);
  if (inactiveSources.length > 0) {
    console.log(`⏸️  Inactive Sources: ${inactiveSources.length}\n`);
    
    for (const source of inactiveSources) {
      console.log(`⚫ ${source.name}`);
      console.log(`  Status: ${source.status}`);
      if (source.lastError) {
        console.log(`  Reason: ${source.lastError.slice(0, 100)}${source.lastError.length > 100 ? '...' : ''}`);
      }
      console.log('');
    }
  }

  // Statistics
  console.log('='.repeat(60));
  console.log('📊 Statistics\n');
  
  const statusCounts = sources.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  const activeCount = activeSources.length;
  const totalCount = sources.length;
  const activeRate = (activeCount / totalCount) * 100;

  console.log(`\nActive rate: ${activeCount}/${totalCount} (${activeRate.toFixed(1)}%)`);

  // Recommendations
  console.log('\n💡 Recommendations:\n');
  
  const errorSources = sources.filter(s => s.status === 'ERROR');
  if (errorSources.length > 0) {
    console.log(`  🔴 ${errorSources.length} source(s) in ERROR status:`);
    errorSources.forEach(s => {
      console.log(`     - ${s.name}: Consider disabling or fixing URL`);
    });
    console.log('');
  }

  const staleSources = activeSources.filter(s => {
    const lastFetchAgo = s.lastFetchAt
      ? Math.floor((Date.now() - s.lastFetchAt.getTime()) / 60000)
      : null;
    return lastFetchAgo !== null && lastFetchAgo > (s.fetchInterval / 60) * 2;
  });

  if (staleSources.length > 0) {
    console.log(`  🟡 ${staleSources.length} source(s) not fetched recently:`);
    staleSources.forEach(s => {
      console.log(`     - ${s.name}: Check crawler execution`);
    });
    console.log('');
  }

  if (activeSources.length === 0) {
    console.log(`  ⚠️ No active sources! Enable at least one source in database.`);
    console.log('');
  }

  console.log('  Run crawler manually: pnpm run crawler:rss');
  console.log('  View source details: pnpm db:studio → RssSource table');
  
  console.log('\n' + '='.repeat(60));

  await prisma.$disconnect();
}

checkRssHealth().catch((error) => {
  console.error('❌ Health check failed:', error);
  process.exit(1);
});
