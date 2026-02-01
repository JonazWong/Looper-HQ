import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const user = await prisma.user.create({
    data: {
      email: 'demo@looperhq.com',
      name: 'Demo User',
      role: 'OWNER',
      membershipTier: 'ENTERPRISE',
    },
  });

  console.log('Created user:', user);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
