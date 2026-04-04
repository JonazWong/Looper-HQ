#!/usr/bin/env tsx

import { PrismaClient, CaseSource, RssSourceStatus } from '../packages/database';

const prisma = new PrismaClient();

type DefaultSource = {
  source: CaseSource;
  name: string;
  url: string;
  isActive: boolean;
  status: RssSourceStatus;
  fetchInterval: number;
  maxRetries: number;
  retryDelay: number;
  keywords: string[];
  excludeKeywords: string[];
};

const DEFAULT_RSS_SOURCES: DefaultSource[] = [
  {
    source: CaseSource.MINGPAO_PNS_RSS,
    name: 'Ming Pao Daily News - Hong Kong News',
    url: 'https://news.mingpao.com/rss/pns/s00002.xml',
    isActive: false,
    status: RssSourceStatus.INACTIVE,
    fetchInterval: 900,
    maxRetries: 3,
    retryDelay: 300,
    keywords: ['香港', '法院', '法庭', '法律', '案件', '審訊'],
    excludeKeywords: ['體育', '娛樂', '財經'],
  },
  {
    source: CaseSource.MINGPAO_INS_RSS,
    name: 'Hong Kong Free Press',
    url: 'https://hongkongfp.com/feed/',
    isActive: true,
    status: RssSourceStatus.ACTIVE,
    fetchInterval: 900,
    maxRetries: 3,
    retryDelay: 300,
    keywords: ['hong kong', 'court', 'trial', 'law', 'judiciary', 'legal'],
    excludeKeywords: ['sport'],
  },
  {
    source: CaseSource.HKGOVNEWS_RSS,
    name: 'Hong Kong Government News - General',
    url: 'https://www.info.gov.hk/gia/rss/general.xml',
    isActive: false,
    status: RssSourceStatus.INACTIVE,
    fetchInterval: 900,
    maxRetries: 3,
    retryDelay: 300,
    keywords: ['法庭', '法院', '法律', '審訊', '司法'],
    excludeKeywords: ['體育', '娛樂'],
  },
];

async function main() {
  console.log('Checking RSS source configuration...');

  let created = 0;
  let updated = 0;

  for (const src of DEFAULT_RSS_SOURCES) {
    const existing = await prisma.rssSource.findUnique({
      where: { source: src.source },
      select: { id: true },
    });

    await prisma.rssSource.upsert({
      where: { source: src.source },
      update: {
        name: src.name,
        url: src.url,
        isActive: src.isActive,
        status: src.status,
        fetchInterval: src.fetchInterval,
        maxRetries: src.maxRetries,
        retryDelay: src.retryDelay,
        keywords: src.keywords,
        excludeKeywords: src.excludeKeywords,
      },
      create: {
        name: src.name,
        source: src.source,
        url: src.url,
        isActive: src.isActive,
        status: src.status,
        fetchInterval: src.fetchInterval,
        maxRetries: src.maxRetries,
        retryDelay: src.retryDelay,
        keywords: src.keywords,
        excludeKeywords: src.excludeKeywords,
      },
    });

    if (existing) {
      updated++;
    } else {
      created++;
    }
  }

  const activeCount = await prisma.rssSource.count({
    where: {
      isActive: true,
      status: { in: [RssSourceStatus.ACTIVE, RssSourceStatus.ERROR] },
    },
  });

  if (activeCount === 0) {
    throw new Error('RSS source bootstrap completed but no active source is available.');
  }

  console.log(`RSS sources ensured. created=${created}, updated=${updated}, active=${activeCount}`);
}

main()
  .catch((error) => {
    console.error('Failed to ensure RSS sources:', error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
