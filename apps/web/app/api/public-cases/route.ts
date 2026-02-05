import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().optional(),
  source: z.enum(['HK_JUDICIARY', 'SCMP_RSS', 'RTHK_RSS', 'APPLE_DAILY_RSS', 'HKLII']).optional(),
  category: z.string().optional(),
  court: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = searchSchema.parse(Object.fromEntries(searchParams));

    const { query, source, category, court, dateFrom, dateTo, page, limit } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { keywords: { has: query } },
      ];
    }

    if (source) {
      where.source = source;
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (court) {
      where.court = { contains: court, mode: 'insensitive' };
    }

    if (dateFrom || dateTo) {
      where.crawledAt = {};
      if (dateFrom) where.crawledAt.gte = new Date(dateFrom);
      if (dateTo) where.crawledAt.lte = new Date(dateTo);
    }

    // Fetch data
    const [cases, total] = await Promise.all([
      prisma.publicCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { crawledAt: 'desc' },
      }),
      prisma.publicCase.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        cases,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Public cases search error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
