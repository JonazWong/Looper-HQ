import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Health check endpoint for monitoring and load balancers.
 * 
 * Security Note: This endpoint is public (no auth required) but only returns
 * minimal information by default. Detailed metrics require internal access header.
 * 
 * Query parameters:
 * - detailed=true: Returns extended metrics (requires X-Internal-Health-Check header)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const detailed = url.searchParams.get('detailed') === 'true';
  const internalHeader = request.headers.get('X-Internal-Health-Check');
  
  // Only allow detailed metrics with internal header or in development
  const allowDetailed = detailed && (
    internalHeader === process.env.HEALTH_CHECK_SECRET || 
    process.env.NODE_ENV === 'development'
  );

  try {
    // Check database connectivity
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStart;
    
    // Basic public response (safe for unauthenticated access)
    const publicResponse = {
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
      database: 'connected' as const,
    };

    // Return minimal info for public access
    if (!allowDetailed) {
      return NextResponse.json(publicResponse);
    }

    // Extended metrics for internal monitoring (requires auth/secret)
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const memPercentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
    
    const openaiConfigured = !!(process.env.OPENAI_API_KEY);
    
    return NextResponse.json({
      ...publicResponse,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '2.0.0',
      environment: process.env.NODE_ENV || 'development',
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
      },
      { status: 503 }
    );
  }
}
