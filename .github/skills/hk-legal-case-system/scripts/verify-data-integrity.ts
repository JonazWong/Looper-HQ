#!/usr/bin/env tsx
/**
 * 資料完整性驗證腳本
 * 檢查爬蟲資料是否正確寫入資料庫、AI 分類關聯是否正確
 * 
 * 使用方式:
 *   tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts
 *   tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts --source RSS
 *   tsx .github/skills/hk-legal-case-system/scripts/verify-data-integrity.ts --recent 24
 */

import { PrismaClient } from '@looper-hq/database';

const prisma = new PrismaClient();

interface IntegrityIssue {
  type: 'ERROR' | 'WARNING' | 'INFO';
  category: string;
  message: string;
  recordId?: number;
  details?: any;
}

async function verifyDataIntegrity() {
  console.log('🔍 資料完整性驗證\n');
  console.log('='.repeat(70));

  const args = process.argv.slice(2);
  const sourceFilter = args.find(a => a.startsWith('--source='))?.split('=')[1];
  const recentHours = parseInt(args.find(a => a.startsWith('--recent='))?.split('=')[1] || '0');

  const issues: IntegrityIssue[] = [];

  // 構建時間過濾條件
  const timeFilter = recentHours > 0 
    ? { createdAt: { gte: new Date(Date.now() - recentHours * 60 * 60 * 1000) } }
    : {};

  const whereClause = {
    ...timeFilter,
    ...(sourceFilter ? { source: sourceFilter } : {}),
  };

  console.log(`篩選條件: ${sourceFilter || '所有來源'}, ${recentHours > 0 ? `最近 ${recentHours} 小時` : '所有時間'}\n`);

  // ==================== 1. 爬蟲執行記錄驗證 ====================
  console.log('📊 1. 爬蟲執行記錄驗證');
  console.log('-'.repeat(70));

  try {
    const latestJobRun = await prisma.crawlerJobRun.findFirst({
      orderBy: { startedAt: 'desc' },
    });

    if (!latestJobRun) {
      issues.push({
        type: 'ERROR',
        category: 'CrawlerJobRun',
        message: '未找到任何爬蟲執行記錄',
      });
    } else {
      console.log(`   最近執行: ${latestJobRun.startedAt.toISOString()}`);
      console.log(`   狀態: ${latestJobRun.status}`);
      console.log(`   統計: ${JSON.stringify(latestJobRun.stats)}`);

      const hoursSinceRun = (Date.now() - latestJobRun.startedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceRun > 26) { // 預期每 24 小時執行
        issues.push({
          type: 'WARNING',
          category: 'CrawlerJobRun',
          message: `爬蟲超過 ${Math.round(hoursSinceRun)} 小時未執行`,
          details: { lastRun: latestJobRun.startedAt },
        });
      }

      if (latestJobRun.status === 'FAILED') {
        issues.push({
          type: 'ERROR',
          category: 'CrawlerJobRun',
          message: '最近爬蟲執行失敗',
          details: { errorLog: latestJobRun.errorLog },
        });
      }

      if (latestJobRun.status === 'PARTIAL_SUCCESS') {
        issues.push({
          type: 'WARNING',
          category: 'CrawlerJobRun',
          message: '爬蟲部分成功（某些來源失敗）',
          details: { stats: latestJobRun.stats },
        });
      }
    }
  } catch (error: any) {
    issues.push({
      type: 'ERROR',
      category: 'CrawlerJobRun',
      message: `無法檢查爬蟲記錄: ${error.message}`,
    });
  }

  // ==================== 2. PublicCase 資料品質 ====================
  console.log('\n📋 2. PublicCase 資料品質檢查');
  console.log('-'.repeat(70));

  try {
    const totalCases = await prisma.publicCase.count({ where: whereClause });
    console.log(`   總案件數: ${totalCases}`);

    // 2a. 缺少必要欄位
    const missingTitles = await prisma.publicCase.count({
      where: {
        ...whereClause,
        title_zh: null,
        title_en: null,
      },
    });

    if (missingTitles > 0) {
      issues.push({
        type: 'ERROR',
        category: 'PublicCase',
        message: `${missingTitles} 筆案件缺少標題（中英文皆無）`,
      });
      console.log(`   ❌ 缺少標題: ${missingTitles}`);
    } else {
      console.log(`   ✅ 所有案件都有標題`);
    }

    // 2b. 缺少摘要
    const missingSummaries = await prisma.publicCase.count({
      where: {
        ...whereClause,
        summary_zh: null,
        summary_en: null,
      },
    });

    if (missingSummaries > totalCases * 0.3) { // 超過 30% 缺摘要
      issues.push({
        type: 'WARNING',
        category: 'PublicCase',
        message: `${missingSummaries} 筆案件缺少摘要（${Math.round(missingSummaries/totalCases*100)}%）`,
      });
      console.log(`   ⚠️  缺少摘要: ${missingSummaries}`);
    } else {
      console.log(`   ✅ 摘要覆蓋率: ${Math.round((1 - missingSummaries/totalCases)*100)}%`);
    }

    // 2c. 缺少 URL
    const missingUrls = await prisma.publicCase.count({
      where: {
        ...whereClause,
        url: null,
      },
    });

    if (missingUrls > 0) {
      issues.push({
        type: 'WARNING',
        category: 'PublicCase',
        message: `${missingUrls} 筆案件缺少來源 URL`,
      });
      console.log(`   ⚠️  缺少 URL: ${missingUrls}`);
    }

    // 2d. externalId 為空
    const missingExternalId = await prisma.publicCase.count({
      where: {
        ...whereClause,
        OR: [
          { externalId: null },
          { externalId: '' },
        ],
      },
    });

    if (missingExternalId > 0) {
      issues.push({
        type: 'ERROR',
        category: 'PublicCase',
        message: `${missingExternalId} 筆案件缺少 externalId（去重機制失效）`,
      });
      console.log(`   ❌ 缺少 externalId: ${missingExternalId}`);
    }

  } catch (error: any) {
    issues.push({
      type: 'ERROR',
      category: 'PublicCase',
      message: `資料品質檢查失敗: ${error.message}`,
    });
  }

  // ==================== 3. 重複資料檢測 ====================
  console.log('\n🔁 3. 重複資料檢測');
  console.log('-'.repeat(70));

  try {
    const duplicates = await prisma.$queryRaw<Array<{ source: string; externalId: string; count: bigint }>>`
      SELECT source, "externalId", COUNT(*) as count
      FROM "PublicCase"
      ${whereClause.source ? prisma.$queryRawUnsafe`WHERE source = '${whereClause.source}'` : prisma.$queryRaw``}
      GROUP BY source, "externalId"
      HAVING COUNT(*) > 1
      LIMIT 10
    `;

    if (duplicates.length > 0) {
      issues.push({
        type: 'ERROR',
        category: 'Duplicates',
        message: `發現 ${duplicates.length} 組重複資料`,
        details: duplicates.map(d => ({ 
          source: d.source, 
          externalId: d.externalId, 
          count: Number(d.count) 
        })),
      });
      console.log(`   ❌ 發現 ${duplicates.length} 組重複:`);
      duplicates.forEach(d => {
        console.log(`      ${d.source}/${d.externalId}: ${d.count} 筆`);
      });
    } else {
      console.log(`   ✅ 無重複資料`);
    }
  } catch (error: any) {
    issues.push({
      type: 'ERROR',
      category: 'Duplicates',
      message: `重複檢測失敗: ${error.message}`,
    });
  }

  // ==================== 4. AI 分類狀態 ====================
  console.log('\n🤖 4. AI 分類狀態檢查');
  console.log('-'.repeat(70));

  try {
    const [total, classified, unclassified, lowConfidence, noCategory] = await Promise.all([
      prisma.publicCase.count({ where: whereClause }),
      prisma.publicCase.count({ where: { ...whereClause, aiClassified: true } }),
      prisma.publicCase.count({ where: { ...whereClause, aiClassified: false } }),
      prisma.publicCase.count({ 
        where: { 
          ...whereClause,
          aiClassified: true, 
          aiConfidence: { lt: 0.7 } 
        } 
      }),
      prisma.publicCase.count({ 
        where: { 
          ...whereClause,
          aiClassified: true,
          category: null,
        } 
      }),
    ]);

    console.log(`   總案件: ${total}`);
    console.log(`   已分類: ${classified} (${Math.round(classified/total*100)}%)`);
    console.log(`   未分類: ${unclassified}`);
    console.log(`   低信心度: ${lowConfidence}`);

    if (noCategory > 0) {
      issues.push({
        type: 'ERROR',
        category: 'AI_Classification',
        message: `${noCategory} 筆案件標記為已分類但缺少 category`,
      });
      console.log(`   ❌ 分類異常（已標記但無類別）: ${noCategory}`);
    }

    if (unclassified > 100) {
      issues.push({
        type: 'INFO',
        category: 'AI_Classification',
        message: `${unclassified} 筆案件待分類`,
      });
      console.log(`   💡 建議執行批量分類`);
    }

    if (lowConfidence > classified * 0.2) { // 超過 20% 低信心度
      issues.push({
        type: 'WARNING',
        category: 'AI_Classification',
        message: `${lowConfidence} 筆低信心度分類（${Math.round(lowConfidence/classified*100)}%），需人工審查`,
      });
    }

  } catch (error: any) {
    issues.push({
      type: 'ERROR',
      category: 'AI_Classification',
      message: `分類狀態檢查失敗: ${error.message}`,
    });
  }

  // ==================== 5. 來源分佈與健康度 ====================
  console.log('\n📡 5. 來源分佈與健康度');
  console.log('-'.repeat(70));

  try {
    const sourceCounts = await prisma.publicCase.groupBy({
      by: ['source'],
      where: timeFilter,
      _count: true,
      orderBy: { _count: { source: 'desc' } },
    });

    console.log(`   來源統計:`);
    sourceCounts.forEach(s => {
      console.log(`      ${s.source}: ${s._count}`);
    });

    // 檢查預期來源是否有資料
    const expectedSources = ['RSS', 'HKLII', 'JUDICIARY_DCL'];
    const activeSources = sourceCounts.map(s => s.source);

    expectedSources.forEach(source => {
      if (!activeSources.includes(source)) {
        issues.push({
          type: 'WARNING',
          category: 'Source',
          message: `來源 ${source} 在篩選範圍內無資料`,
        });
      }
    });

    // 檢查 RSS 來源配置
    const rssSources = await prisma.rssSource.findMany({
      where: { active: true },
      select: { id: true, name: true, url: true, lastFetchedAt: true },
    });

    console.log(`\n   已啟用 RSS 來源: ${rssSources.length}`);
    rssSources.forEach(rss => {
      const hoursSinceFetch = rss.lastFetchedAt 
        ? (Date.now() - rss.lastFetchedAt.getTime()) / (1000 * 60 * 60)
        : null;
      
      console.log(`      ${rss.name}: ${hoursSinceFetch ? `${Math.round(hoursSinceFetch)}h 前` : '從未抓取'}`);

      if (!hoursSinceFetch || hoursSinceFetch > 36) {
        issues.push({
          type: 'WARNING',
          category: 'RSS',
          message: `RSS 來源 "${rss.name}" 超過 36 小時未更新`,
          details: { url: rss.url, lastFetchedAt: rss.lastFetchedAt },
        });
      }
    });

  } catch (error: any) {
    issues.push({
      type: 'ERROR',
      category: 'Source',
      message: `來源檢查失敗: ${error.message}`,
    });
  }

  // ==================== 6. 資料關聯完整性 ====================
  console.log('\n🔗 6. 資料關聯完整性');
  console.log('-'.repeat(70));

  try {
    // 檢查是否有孤立的 PublicCase（理論上不應發生，因為沒有外鍵約束）
    // 但可以檢查 AI 分類後是否正確設置了相關欄位

    const classifiedWithoutJudge = await prisma.publicCase.count({
      where: {
        ...whereClause,
        aiClassified: true,
        category: { in: ['CRIMINAL', 'CIVIL', 'JUDICIAL_REVIEW'] }, // 預期有法官
        judge: null,
      },
    });

    if (classifiedWithoutJudge > 0) {
      issues.push({
        type: 'WARNING',
        category: 'AI_Classification',
        message: `${classifiedWithoutJudge} 筆已分類案件預期應有法官資訊但為空`,
      });
      console.log(`   ⚠️  缺法官資訊: ${classifiedWithoutJudge}`);
    } else {
      console.log(`   ✅ 已分類案件關鍵欄位完整`);
    }

    // 檢查 parties (JSON 欄位) 格式
    const casesWithParties = await prisma.publicCase.findMany({
      where: {
        ...whereClause,
        parties: { not: prisma.publicCase.fields.parties.equals(null) },
      },
      select: { id: true, parties: true },
      take: 100,
    });

    let invalidPartiesCount = 0;
    casesWithParties.forEach(c => {
      if (!Array.isArray(c.parties)) {
        invalidPartiesCount++;
        issues.push({
          type: 'ERROR',
          category: 'DataFormat',
          message: `案件 ${c.id} 的 parties 欄位格式錯誤（應為陣列）`,
          recordId: c.id,
          details: { parties: c.parties },
        });
      }
    });

    if (invalidPartiesCount === 0 && casesWithParties.length > 0) {
      console.log(`   ✅ parties JSON 格式正確 (抽樣 ${casesWithParties.length} 筆)`);
    }

  } catch (error: any) {
    issues.push({
      type: 'ERROR',
      category: 'DataIntegrity',
      message: `關聯檢查失敗: ${error.message}`,
    });
  }

  // ==================== 總結報告 ====================
  console.log('\n' + '='.repeat(70));
  console.log('📋 驗證總結\n');

  const errors = issues.filter(i => i.type === 'ERROR');
  const warnings = issues.filter(i => i.type === 'WARNING');
  const infos = issues.filter(i => i.type === 'INFO');

  console.log(`   錯誤 (ERROR): ${errors.length}`);
  console.log(`   警告 (WARNING): ${warnings.length}`);
  console.log(`   資訊 (INFO): ${infos.length}`);

  if (errors.length > 0) {
    console.log('\n❌ 發現嚴重問題:\n');
    errors.forEach((e, idx) => {
      console.log(`   ${idx + 1}. [${e.category}] ${e.message}`);
      if (e.details) {
        console.log(`      詳情: ${JSON.stringify(e.details, null, 2)}`);
      }
    });
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  警告事項:\n');
    warnings.forEach((w, idx) => {
      console.log(`   ${idx + 1}. [${w.category}] ${w.message}`);
    });
  }

  if (infos.length > 0) {
    console.log('\n💡 建議事項:\n');
    infos.forEach((i, idx) => {
      console.log(`   ${idx + 1}. [${i.category}] ${i.message}`);
    });
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ 資料完整性良好！');
  }

  console.log('\n' + '='.repeat(70));

  await prisma.$disconnect();

  // 返回錯誤碼
  process.exit(errors.length > 0 ? 1 : 0);
}

verifyDataIntegrity().catch(error => {
  console.error('驗證腳本執行失敗:', error);
  process.exit(1);
});
