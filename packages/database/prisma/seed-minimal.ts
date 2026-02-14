/**
 * 精簡版 Seed - 只包含 RSS 爬蟲配置
 * 
 * 用途：生產環境和開發環境的初始化
 * 不包含模擬數據，只配置實際的數據源
 * 
 * 參考文檔：
 * - docs/港聞新聞源到法律資訊搜尋方法及注意事項指南.md
 * - docs/香港司法機構案件數據自動抓取系統 - 完整實現指南.md
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 初始化數據庫（精簡版）...');
  console.log('只配置 RSS 來源，不包含模擬數據\n');

  // 清除現有數據（保持順序以避免外鍵約束錯誤）
  console.log('清除現有數據...');
  await prisma.searchHistory.deleteMany();
  await prisma.publicCase.deleteMany();
  await prisma.rssSource.deleteMany();
  console.log('✓ 已清除所有數據\n');

  // 創建 RSS 來源配置
  // 根據「港聞新聞源到法律資訊搜尋方法及注意事項指南」
  console.log('配置 RSS 新聞來源...');
  
  const rssSources = [
    {
      name: '明報日報 - 港聞',
      source: 'MINGPAO_PNS_RSS',
      url: 'https://news.mingpao.com/rss/pns/s00002.xml',
      isActive: false, // 暫停：被封鎖
      status: 'INACTIVE',
      fetchInterval: 7200, // 2小時（根據文檔建議：每日新聞源每1-2小時）
      maxRetries: 3,
      retryDelay: 300, // 5分鐘
      keywords: [
        // 中文法律關鍵詞
        '法庭', '法院', '法律', '法官', '訴訟',
        '律師', '檢控', '判決', '裁決', '司法',
        '刑事', '民事', '高院', '終審', '上訴',
        '聆訊', '審訊', '控罪', '辯護', '陪審',
        // 英文法律關鍵詞
        'court', 'law', 'legal', 'judge', 'lawsuit',
        'prosecution', 'trial', 'verdict', 'justice',
        'lawyer', 'attorney', 'litigation', 'appeal',
        // 案件類型
        '司法覆核', '民事訴訟', '刑事案件', '家事案件',
        '僱傭糾紛', '合約糾紛', '侵權', '破產',
        // 法院名稱
        '高等法院', '區域法院', '裁判法院', '終審法院',
        'High Court', 'District Court', 'Magistrates',
      ],
      excludeKeywords: [
        // 排除非法律新聞
        'sports', 'entertainment', 'food', 'travel',
        '體育', '娛樂', '美食', '旅遊', '天氣',
        '財經', '股市', '樓市', '地產',
        '時尚', '購物', '影視', '音樂',
      ],
    },
    {
      name: '明報即時新聞 - 法律',
      source: 'MINGPAO_INS_RSS',
      url: 'https://news.mingpao.com/rss/ins/s00001.xml',
      isActive: false, // 暫停：被封鎖
      status: 'INACTIVE',
      fetchInterval: 900, // 15分鐘（根據文檔建議：即時新聞源每10-15分鐘）
      maxRetries: 3,
      retryDelay: 300,
      keywords: [
        // 使用相同的關鍵詞列表
        '法庭', '法院', '法律', '法官', '訴訟',
        '律師', '檢控', '判決', '裁決', '司法',
        '刑事', '民事', '高院', '終審', '上訴',
        '聆訊', '審訊', '控罪', '辯護', '陪審',
        'court', 'law', 'legal', 'judge', 'lawsuit',
        'prosecution', 'trial', 'verdict', 'justice',
        'lawyer', 'attorney', 'litigation', 'appeal',
        '司法覆核', '民事訴訟', '刑事案件', '家事案件',
        '僱傭糾紛', '合約糾紛', '侵權', '破產',
        '高等法院', '區域法院', '裁判法院', '終審法院',
        'High Court', 'District Court', 'Magistrates',
      ],
      excludeKeywords: [
        'sports', 'entertainment', 'food', 'travel',
        '體育', '娛樂', '美食', '旅遊', '天氣',
        '財經', '股市', '樓市', '地產',
        '時尚', '購物', '影視', '音樂',
      ],
    },
    {
      name: 'South China Morning Post - Legal',
      source: 'SCMP_RSS',
      url: 'https://www.scmp.com/rss/2/feed',
      isActive: true,
      status: 'ACTIVE',
      fetchInterval: 3600, // 1小時
      maxRetries: 3,
      retryDelay: 300,
      keywords: [
        // 英文法律關鍵詞
        'court', 'law', 'legal', 'judge', 'lawsuit',
        'prosecution', 'trial', 'verdict', 'justice',
        'lawyer', 'attorney', 'litigation', 'appeal',
        'magistrate', 'barrister', 'solicitor',
        // 中文法律關鍵詞
        '法庭', '法院', '法律', '法官', '訴訟',
        '律師', '檢控', '判決', '裁決', '司法',
        '刑事', '民事', '高院', '終審', '上訴',
        // 案件類型
        'judicial review', 'civil case', 'criminal case',
        'conviction', 'sentence', 'acquittal',
        '司法覆核', '民事訴訟', '刑事案件',
        // 法院名稱
        'High Court', 'District Court', 'Magistrates Court',
        'Court of Final Appeal', 'Court of Appeal',
        '高等法院', '區域法院', '裁判法院', '終審法院',
      ],
      excludeKeywords: [
        'sports', 'entertainment', 'food', 'travel',
        'lifestyle', 'fashion', 'music', 'film',
        'property', 'real estate', 'stock market',
        '體育', '娛樂', '美食', '旅遊', '時尚',
      ],
    },
    {
      name: '香港電台新聞 - RTHK News',
      source: 'RTHK_RSS',
      url: 'https://rthk.hk/rss/news.xml',
      isActive: true,
      status: 'ACTIVE',
      fetchInterval: 3600, // 1小時
      maxRetries: 3,
      retryDelay: 300,
      keywords: [
        // 中文法律關鍵詞
        '法庭', '法院', '法律', '法官', '訴訟',
        '律師', '檢控', '判決', '裁決', '司法',
        '刑事', '民事', '高院', '終審', '上訴',
        '聆訊', '審訊', '控罪', '辯護', '陪審',
        // 英文法律關鍵詞
        'court', 'law', 'legal', 'judge', 'lawsuit',
        'prosecution', 'trial', 'verdict', 'justice',
        'lawyer', 'litigation', 'appeal',
        // 案件類型
        '司法覆核', '民事訴訟', '刑事案件', '家事案件',
        '僱傭糾紛', '合約糾紛', '侵權', '破產',
        '入境條例', '選舉條例', '公眾集會',
        // 法院名稱
        '高等法院', '區域法院', '裁判法院', '終審法院',
        '上訴法庭', '原訟法庭', '死因裁判法庭',
        'High Court', 'District Court', 'Magistrates',
      ],
      excludeKeywords: [
        'sports', 'entertainment', 'food', 'travel',
        '體育', '娛樂', '美食', '旅遊', '天氣',
        '財經', '股市', '樓市', '地產',
        '時尚', '購物', '影視', '音樂',
      ],
    },
  ];

  for (const source of rssSources) {
    await prisma.rssSource.create({
      data: source,
    });
    console.log(`✓ 已配置: ${source.name}`);
  }

  console.log('\n📊 配置摘要:');
  console.log('─'.repeat(60));
  console.log(`RSS 來源數量: ${rssSources.length}`);
  console.log(`啟用的來源: ${rssSources.filter(s => s.isActive).length}`);
  console.log('\n抓取頻率設置:');
  rssSources.forEach(s => {
    const intervalMinutes = s.fetchInterval / 60;
    console.log(`  • ${s.name}: 每 ${intervalMinutes} 分鐘`);
  });
  console.log('\n📝 注意事項:');
  console.log('  1. 遵守 robots.txt 和網站服務條款');
  console.log('  2. 每次請求間隔至少 1-2 秒（已在爬蟲中實現）');
  console.log('  3. 設定合理的 User-Agent（見 .env 配置）');
  console.log('  4. 監控爬蟲執行狀態和成功率');
  console.log('  5. 定期檢查 RSS 源是否可訪問\n');

  console.log('✅ 數據庫初始化完成！');
  console.log('\n🚀 後續步驟:');
  console.log('  1. 運行爬蟲測試: pnpm crawler:rss');
  console.log('  2. 查看結果: pnpm db:studio');
  console.log('  3. 啟用自動化: 推送到 GitHub 啟動 GitHub Actions\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed 執行失敗:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
