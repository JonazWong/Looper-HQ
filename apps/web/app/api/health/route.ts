import { NextResponse } from 'next/server';

/**
 * Health check endpoint for production deployment monitoring
 * Returns 200 OK if the application is healthy
 */
export async function GET() {
  try {
    // Basic health check - application is running
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'looper-hq',
      uptime: process.uptime(),
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
