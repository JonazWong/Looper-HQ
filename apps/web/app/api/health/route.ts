import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  database: 'connected' | 'disconnected';
}

export async function GET() {
  const healthcheck: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected',
  };

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    // Error intentionally not logged to avoid exposing internal details
    healthcheck.database = 'disconnected';
    healthcheck.status = 'unhealthy';
  }

  const statusCode = healthcheck.status === 'healthy' ? 200 : 503;
  
  return NextResponse.json(healthcheck, { status: statusCode });
}
