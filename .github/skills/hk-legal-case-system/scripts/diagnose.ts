#!/usr/bin/env tsx
/**
 * 快速診斷腳本 - 檢查爬蟲、AI 分類和資料庫健康狀態
 * 
 * 使用方式:
 *   tsx .github/skills/hk-legal-case-system/scripts/diagnose.ts
 */

import { PrismaClient } from '@looper-hq/database';

const prisma = new PrismaClient();

async function diagnose() {
  console.log('🔍 系統健康檢查\n');
  console.log('=' .repeat(60));

  const checks = {
    database: false,
    crawlers: false,
    aiClassification: false,
    dataQuality: false,
  };

  // 1. 資料庫連線
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ 資料庫連線正常');
    checks.database = true;
  } catch (error: any) {
    console.error('❌ 資料庫連線失敗:', error.message);
    process.exit(1);
  }

  // 2. 爬蟲執行狀態
  try {
    const lastRun = await prisma.crawlerJobRun.findFirst({
      orderBy: { startedAt: 'desc' },
    });

    if (!lastRun) {
      console.log('⚠️  無爬蟲執行記錄');
    } else {
      const hoursSinceRun = Math.round(
        (Date.now() - lastRun.startedAt.getTime()) / (1000 * 60 * 60)
      );
      
      console.log(`\n📊 最近爬蟲執行:`);
      console.log(`   狀態: ${lastRun.status}`);
      console.log(`   時間: ${hoursSinceRun} 小時前`);
      console.log(`   統計: ${JSON.stringify(lastRun.stats)}`);
      
      if (lastRun.status === 'SUCCESS') {
        checks.crawlers = true;
      }
      
      if (hoursSinceRun > 48) {
        console.log('   ⚠️  超過 48 小時未執行，檢查 GitHub Actions');
      }
    }
  } catch (error: any) {
    console.error('❌ 爬蟲狀態檢查失敗:', error.message);
  }

  // 3. AI 分類統計
  try {
    const [total, classified, unclassified, lowConfidence] = await Promise.all([
      prisma.publicCase.count(),
      prisma.publicCase.count({ where: { aiClassified: true } }),
      prisma.publicCase.count({ where: { aiClassified: false } }),
      prisma.publicCase.count({ 
        where: { 
          aiClassified: true, 
          aiConfidence: { lt: 0.7 } 
        } 
      }),
    ]);

    console.log(`\n🤖 AI 分類狀態:`);
    console.log(`   總案件數: ${total}`);
    console.log(`   已分類: ${classified} (${Math.round(classified/total*100)}%)`);
    console.log(`   未分類: ${unclassified}`);
    console.log(`   低信心 (<0.7): ${lowConfidence}`);

    if (classified > 0) {
      checks.aiClassification = true;
    }

    if (unclassified > 100) {
      console.log(`   💡 建議執行批量分類: pnpm tsx scripts/batch-classify.ts`);
    }
  } catch (error: any) {
    console.error('❌ AI 分類檢查失敗:', error.message);
  }

  // 4. 資料品質
  try {
    const [noTitle, noSummary, duplicates] = await Promise.all([
      prisma.publicCase.count({ 
        where: { 
          title_zh: null, 
          title_en: null 
        } 
      }),
      prisma.publicCase.count({ 
        where: { 
          summary_zh: null, 
          summary_en: null 
        } 
      }),
      prisma.$queryRaw<Array<{ source: string; externalId: string; count: number }>>`
        SELECT source, "externalId", COUNT(*) as count
        FROM "PublicCase"
        GROUP BY source, "externalId"
        HAVING COUNT(*) > 1
      `,
    ]);

    console.log(`\n📈 資料品質:`);
    console.log(`   缺標題: ${noTitle}`);
    console.log(`   缺摘要: ${noSummary}`);
    console.log(`   重複記錄: ${duplicates.length}`);

    if (noTitle === 0 && noSummary < 10 && duplicates.length === 0) {
      checks.dataQuality = true;
    }

    if (duplicates.length > 0) {
      console.log(`   ⚠️  發現重複資料，建議檢查 unique constraint`);
    }
  } catch (error: any) {
    console.error('❌ 資料品質檢查失敗:', error.message);
  }

  // 5. 來源分佈
  try {
    const sources = await prisma.publicCase.groupBy({
      by: ['source'],
      _count: true,
      orderBy: { _count: { source: 'desc' } },
    });

    console.log(`\n📡 來源分佈:`);
    sources.forEach(s => {
      console.log(`   ${s.source}: ${s._count} 案件`);
    });
  } catch (error: any) {
    console.error('❌ 來源分析失敗:', error.message);
  }

  // 6. 環境變數檢查
  console.log(`\n🔧 環境配置:`);
  const envChecks = {
    'DATABASE_URL': !!process.env.DATABASE_URL,
    'OPENAI_API_KEY': !!process.env.OPENAI_API_KEY,
    'NEXTAUTH_SECRET': !!process.env.NEXTAUTH_SECRET,
    'CRAWLER_ENABLED': process.env.CRAWLER_ENABLED === 'true',
  };

  Object.entries(envChecks).forEach(([key, value]) => {
    console.log(`   ${value ? '✅' : '❌'} ${key}`);
  });

  // 總結
  console.log('\n' + '='.repeat(60));
  const allChecks = Object.values(checks).every(v => v);
  if (allChecks) {
    console.log('✅ 系統狀態良好');
  } else {
    console.log('⚠️  發現問題，請檢查上述報告');
  }

  await prisma.$disconnect();
}

diagnose().catch(error => {
  console.error('診斷失敗:', error);
  process.exit(1);
});
