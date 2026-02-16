/**
 * 管理员账号创建脚本
 * 用于生产环境首次启动时创建默认管理员
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 创建管理员账号...');

  // 检查是否已有用户
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('✓ 数据库已有用户，跳过管理员创建');
    return;
  }

  // 创建默认 Firm
  const firm = await prisma.firm.create({
    data: {
      name: 'Looper HQ',
      email: 'admin@looperhq.hk',
      phone: '+852 3000 0000',
      address: 'Hong Kong',
      subscription: 'ENTERPRISE',
    },
  });

  // 创建管理员用户
  const admin = await prisma.user.create({
    data: {
      email: 'admin@looperhq.hk',
      name: 'Administrator',
      role: 'ADMIN',
      phone: '+852 3000 0001',
      firmId: firm.id,
      firmOwner: true,
    },
  });

  console.log('✅ 管理员账号创建成功！');
  console.log('');
  console.log('登录信息：');
  console.log('  Email: admin@looperhq.hk');
  console.log('  密码: 任意密码（开发模式）');
  console.log('');
}

main()
  .catch((error) => {
    console.error('❌ 创建管理员失败:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
