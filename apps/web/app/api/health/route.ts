import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: 'ok' | 'error';
      responseTime?: number;
      error?: string;
    };
    openai: {
      status: 'ok' | 'error';
      configured: boolean;
      error?: string;
    };
    memory: {
      status: 'ok' | 'warning';
      used: number;
      total: number;
      percentage: number;
    };
  };
  version: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  const healthCheck: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: { status: 'ok' },
      openai: { status: 'ok', configured: false },
      memory: { status: 'ok', used: 0, total: 0, percentage: 0 },
    },
    version: process.env.npm_package_version || '2.0.0',
  };

  // 1. 數據庫檢查
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    healthCheck.checks.database.responseTime = Date.now() - dbStart;
    
    if (healthCheck.checks.database.responseTime > 1000) {
      healthCheck.status = 'degraded';
    }
  } catch (error: any) {
    healthCheck.checks.database.status = 'error';
    healthCheck.checks.database.error = error.message;
    healthCheck.status = 'unhealthy';
  }

  // 2. OpenAI/OpenRouter 配置檢查
  healthCheck.checks.openai.configured = !!(
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_BASE_URL
  );
  
  if (!healthCheck.checks.openai.configured) {
    healthCheck.checks.openai.status = 'error';
    healthCheck.checks.openai.error = 'API keys not configured';
    healthCheck.status = 'degraded';
  }

  // 3. 記憶體檢查
  const memUsage = process.memoryUsage();
  healthCheck.checks.memory.used = Math.round(memUsage.heapUsed / 1024 / 1024);
  healthCheck.checks.memory.total = Math.round(memUsage.heapTotal / 1024 / 1024);
  healthCheck.checks.memory.percentage = Math.round(
    (memUsage.heapUsed / memUsage.heapTotal) * 100
  );

  if (healthCheck.checks.memory.percentage > 90) {
    healthCheck.checks.memory.status = 'warning';
    healthCheck.status = 'degraded';
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                     healthCheck.status === 'degraded' ? 200 : 503;

  return NextResponse.json(healthCheck, { status: statusCode });
}
