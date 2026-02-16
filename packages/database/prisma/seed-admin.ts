/**
 * 管理员账号创建脚本
 * 用于生产环境首次启动时创建默认管理员
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 检查管理员账号...');

  // 检查 admin@looperhq.hk 是否已存在
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@looperhq.hk' },
  });

  if (existingAdmin) {
    console.log('✓ 管理员账号 admin@looperhq.hk 已存在，跳过创建');
    console.log('');
    console.log('登录信息：');
    console.log('  Email: admin@looperhq.hk');
    console.log('  密码: 任意密码（开发模式）');
    console.log('');
    return;
  }

  console.log('⚙️  创建新的管理员账号...');

  // 查找或创建默认 Firm
  let firm = await prisma.firm.findFirst({
    where: {
      OR: [
        { email: 'admin@looperhq.hk' },
        { name: 'Looper HQ' },
      ],
    },
  });

  if (!firm) {
    console.log('  → 创建默认 Firm...');
    firm = await prisma.firm.create({
      data: {
        name: 'Looper HQ',
        email: 'admin@looperhq.hk',
        phone: '+852 3000 0000',
        address: 'Hong Kong',
        subscription: 'ENTERPRISE',
      },
    });
  } else {
    console.log('  → 使用现有 Firm:', firm.name);
  }

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
