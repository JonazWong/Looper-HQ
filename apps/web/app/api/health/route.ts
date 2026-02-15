import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Health check response structure
 */
interface HealthCheckResponse {
  /** Overall health status of the application */
  status: 'healthy' | 'unhealthy';
  /** ISO 8601 timestamp of the health check */
  timestamp: string;
  /** Process uptime in seconds since application start */
  uptime: number;
  /** Current Node.js environment */
  environment: string;
  /** Database connection status */
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
