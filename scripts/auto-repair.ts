import { PrismaClient } from '@prisma/client';

// Initialize Prisma client for auto-repair
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

interface RepairAction {
  name: string;
  check: () => Promise<boolean>;
  repair: () => Promise<void>;
}

const repairActions: RepairAction[] = [
  {
    name: 'Database Connection',
    check: async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
      } catch {
        return false;
      }
    },
    repair: async () => {
      console.log('Attempting database reconnection...');
      await prisma.$disconnect();
      await new Promise(resolve => setTimeout(resolve, 5000));
      await prisma.$connect();
    },
  },
  {
    name: 'Stale Database Connections',
    check: async () => {
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count 
        FROM pg_stat_activity 
        WHERE state = 'idle' 
        AND state_change < NOW() - INTERVAL '1 hour'
      `;
      return Number(result[0].count) < 10;
    },
    repair: async () => {
      console.log('Terminating stale connections...');
      await prisma.$executeRaw`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE state = 'idle'
        AND state_change < NOW() - INTERVAL '1 hour'
        AND pid <> pg_backend_pid()
      `;
    },
  },
];

async function runAutoRepair() {
  console.log('🔧 Starting auto-repair check...\n');
  
  for (const action of repairActions) {
    console.log(`Checking: ${action.name}`);
    
    const isHealthy = await action.check();
    
    if (isHealthy) {
      console.log(`✅ ${action.name}: OK\n`);
    } else {
      console.log(`❌ ${action.name}: FAILED`);
      console.log(`🔧 Attempting repair...\n`);
      
      try {
        await action.repair();
        
        // 重新檢查
        const recheck = await action.check();
        if (recheck) {
          console.log(`✅ ${action.name}: Repaired successfully\n`);
        } else {
          console.error(`❌ ${action.name}: Repair failed\n`);
        }
      } catch (error) {
        console.error(`❌ ${action.name}: Repair error:`, error);
      }
    }
  }
  
  console.log('Auto-repair check completed.');
}

// 定期執行（每 5 分鐘）
setInterval(runAutoRepair, 5 * 60 * 1000);

// 立即執行一次
runAutoRepair();
