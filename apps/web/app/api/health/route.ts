import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const healthcheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  };

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    healthcheck.database = 'connected';
  } catch (error) {
    // Error intentionally not logged to avoid exposing internal details
    healthcheck.database = 'disconnected';
    healthcheck.status = 'unhealthy';
  }

  const statusCode = healthcheck.status === 'healthy' ? 200 : 503;
  
  return NextResponse.json(healthcheck, { status: statusCode });
}
