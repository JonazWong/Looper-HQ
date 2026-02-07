import Parser from 'rss-parser';

const testSources = [
  {
    name: 'Ming Pao Instant',
    url: 'https://news.mingpao.com/rss/ins/s00001.xml',
  },
  {
    name: 'Ming Pao Daily',
    url: 'https://news.mingpao.com/rss/pns/s00002.xml',
  },
  {
    name: 'RTHK Local',
    url: 'https://news.rthk.hk/rthk/ch/rss/local.htm',
  },
  {
    name: 'HK01 Hong Kong',
    url: 'https://www.hk01.com/rss/zone/2',
  },
  {
    name: 'SCMP Hong Kong',
    url: 'https://www.scmp.com/rss/91/feed',
  },
  {
    name: 'Now News Local',
    url: 'https://news.now.com/rss/home/local',  
  },
];

async function testRssSources() {
  console.log('🧪 Testing RSS Sources\n');
  console.log('='.repeat(60));
  
  const parser = new Parser({
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      'Accept-Language': 'zh-HK,zh-TW;q=0.9,zh;q=0.8,en;q=0.7',
    },
    requestOptions: {
      rejectUnauthorized: false,
    },
  });

  const results: Array<{ name: string; success: boolean; items?: number; error?: string }> = [];

  for (const source of testSources) {
    try {
      console.log(`\nTesting: ${source.name}`);
      console.log(`URL: ${source.url}`);
      
      const feed = await parser.parseURL(source.url);
      
      console.log(`✅ Success!`);
      console.log(`  - Items found: ${feed.items.length}`);
      console.log(`  - Feed title: ${feed.title || 'N/A'}`);
      
      if (feed.items.length > 0) {
        console.log(`  - Latest: ${feed.items[0].title?.slice(0, 60)}...`);
      }
      
      results.push({
        name: source.name,
        success: true,
        items: feed.items.length,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed: ${errorMsg}`);
      
      results.push({
        name: source.name,
        success: false,
        error: errorMsg,
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary\n');
  
  const successCount = results.filter(r => r.success).length;
  const successRate = (successCount / results.length) * 100;
  
  console.log(`Total tested: ${results.length}`);
  console.log(`Successful: ${successCount} (${successRate.toFixed(1)}%)`);
  console.log(`Failed: ${results.length - successCount}`);
  
  console.log('\n✅ Working sources:');
  results
    .filter(r => r.success)
    .forEach(r => console.log(`  - ${r.name} (${r.items} items)`));
  
  if (results.some(r => !r.success)) {
    console.log('\n❌ Failed sources:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
  }
  
  console.log('\n💡 Recommendations:');
  if (successCount > 0) {
    console.log('  - Add successful sources to packages/database/prisma/seed.ts');
    console.log('  - Update RssSource enum in schema.prisma with new source codes');
  }
  if (successCount < results.length) {
    console.log('  - Mark failed sources as isActive: false in seed.ts');
  }
  
  console.log('\n' + '='.repeat(60));
}

testRssSources().catch(console.error);
