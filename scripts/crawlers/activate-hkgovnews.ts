/**
 * Activate HK Government News RSS source for testing
 * Quick script to enable HKGOVNEWS_RSS source
 */

import { PrismaClient } from '../../packages/database';

const prisma = new PrismaClient();

async function activateHKGovNews() {
  try {
    const result = await prisma.rssSource.updateMany({
      where: { source: 'HKGOVNEWS_RSS' },
      data: {
        isActive: true,
        status: 'ACTIVE',
      },
    });

    if (result.count > 0) {
      console.log('✅ Activated HK Government News RSS source');
      console.log(`   Updated ${result.count} source(s)`);
    } else {
      console.log('⚠️  HK Government News RSS source not found in database');
      console.log('   Make sure you ran the seed script with HKGOVNEWS_RSS support');
    }
  } catch (error) {
    console.error('❌ Failed to activate source:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

activateHKGovNews();
