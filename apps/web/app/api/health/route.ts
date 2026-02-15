import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
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
  }
}
