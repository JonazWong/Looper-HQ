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
    // Check database connectivity with timing
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStart;
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const memPercentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
    
    // Check OpenAI configuration
    const openaiConfigured = !!(process.env.OPENAI_API_KEY);
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
      version: process.env.npm_package_version || '2.0.0',
      checks: {
        database: {
          status: 'ok',
          responseTime: dbResponseTime,
        },
        openai: {
          status: openaiConfigured ? 'ok' : 'not_configured',
          configured: openaiConfigured,
        },
        memory: {
          status: memPercentage > 90 ? 'warning' : 'ok',
          used: memUsedMB,
          total: memTotalMB,
          percentage: memPercentage,
        },
      },
    });
  } catch (error) {
    // Error intentionally not logged to avoid exposing internal details
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: 'Database connection failed',
      },
      { status: 503 }
    );
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
