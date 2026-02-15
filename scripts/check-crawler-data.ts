#!/usr/bin/env tsx
/**
 * 檢查爬蟲數據狀態
 * 用於驗證自動爬蟲是否正常抓取數據
 */

import { PrismaClient, CaseSource } from '../packages/database';

const prisma = new PrismaClient();

async function checkCrawlerData() {
  console.log('🔍 檢查爬蟲數據狀態...\n');
  console.log('='.repeat(70));

  try {
    // 1. 檢查 PublicCase 總數
    const totalCases = await prisma.publicCase.count();
    console.log(`\n📊 PublicCase 總數: ${totalCases}`);

    // 2. 按來源分類統計
    console.log('\n📋 按來源分類:');
    console.log('-'.repeat(70));
    
    const sources = Object.values(CaseSource);
    for (const source of sources) {
      const count = await prisma.publicCase.count({
        where: { source }
      });
      
      if (count > 0) {
        // 獲取最新和最舊的記錄
        const latest = await prisma.publicCase.findFirst({
          where: { source },
          orderBy: { crawledAt: 'desc' },
          select: { crawledAt: true, title_zh: true }
        });
        
        const oldest = await prisma.publicCase.findFirst({
          where: { source },
          orderBy: { crawledAt: 'asc' },
          select: { crawledAt: true }
        });

        console.log(`  ${source.padEnd(20)} : ${count.toString().padStart(6)} 筆`);
        console.log(`    └─ 最新: ${latest?.crawledAt.toLocaleString('zh-TW')}`);
        console.log(`    └─ 最舊: ${oldest?.crawledAt.toLocaleString('zh-TW')}`);
        if (latest?.title_zh) {
          console.log(`    └─ 範例: ${latest.title_zh.substring(0, 50)}...`);
        }
      } else {
        console.log(`  ${source.padEnd(20)} : ${count.toString().padStart(6)} 筆 ❌ 無數據`);
      }
    }

    // 3. 檢查 RSS 來源狀態
    console.log('\n📡 RSS 來源狀態:');
    console.log('-'.repeat(70));
    
    const rssSources = await prisma.rssSource.findMany({
      orderBy: { lastFetchAt: 'desc' }
    });

    if (rssSources.length === 0) {
      console.log('  ⚠️  未找到任何 RSS 來源配置');
    } else {
      for (const source of rssSources) {
        const statusIcon = source.status === 'ACTIVE' ? '✅' :
                          source.status === 'ERROR' ? '❌' : '⏸️';
        const activeIcon = source.isActive ? '🟢' : '🔴';
        
        console.log(`\n  ${activeIcon} ${statusIcon} ${source.name}`);
        console.log(`     URL: ${source.url}`);
        console.log(`     狀態: ${source.status}`);
        console.log(`     最後抓取: ${source.lastFetchAt ? source.lastFetchAt.toLocaleString('zh-TW') : '從未抓取'}`);
        
        if (source.lastError) {
          console.log(`     ⚠️  錯誤: ${source.lastError.substring(0, 100)}`);
        }
        
        // 統計該來源的案件數
        const caseCount = await prisma.publicCase.count({
          where: { source: source.source as CaseSource }
        });
        console.log(`     📊 案件數: ${caseCount}`);
      }
    }

    // 4. 最近24小時新增的案件
    console.log('\n📅 最近 24 小時新增:');
    console.log('-'.repeat(70));
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCases = await prisma.publicCase.count({
      where: {
        crawledAt: { gte: oneDayAgo }
      }
    });
    
    console.log(`  最近 24h: ${recentCases} 筆新案件`);

    // 按來源統計
    for (const source of sources) {
      const count = await prisma.publicCase.count({
        where: {
          source,
          crawledAt: { gte: oneDayAgo }
        }
      });
      
      if (count > 0) {
        console.log(`    └─ ${source}: ${count} 筆`);
      }
    }

    // 5. 顯示最新5筆案件
    console.log('\n📝 最新 5 筆案件:');
    console.log('-'.repeat(70));
    
    const latestCases = await prisma.publicCase.findMany({
      orderBy: { crawledAt: 'desc' },
      take: 5,
      select: {
        source: true,
        title_zh: true,
        crawledAt: true,
        category: true,
        keywords: true
      }
    });

    if (latestCases.length === 0) {
      console.log('  ⚠️  資料庫中沒有任何案件');
    } else {
      latestCases.forEach((c, idx) => {
        console.log(`\n  ${idx + 1}. [${c.source}] ${c.title_zh}`);
        console.log(`     時間: ${c.crawledAt.toLocaleString('zh-TW')}`);
        console.log(`     分類: ${c.category || '未分類'}`);
        console.log(`     關鍵字: ${c.keywords.join(', ')}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ 檢查完成\n');

  } catch (error) {
    console.error('\n❌ 檢查失敗:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 執行檢查
checkCrawlerData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
