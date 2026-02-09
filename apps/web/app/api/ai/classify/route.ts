import { NextRequest, NextResponse } from 'next/server';
import { classifyCase } from '@/lib/services/ai-classifier';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const classifySchema = z.object({
  publicCaseId: z.string().optional(),
  title: z.string().min(1),
  content: z.string().optional(),
  autoUpdate: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicCaseId, title, content, autoUpdate } = classifySchema.parse(body);
    
    // AI 分類
    const classification = await classifyCase(title, content || '');
    
    // 自動更新資料庫（如果 autoUpdate=true）
    if (autoUpdate && publicCaseId) {
      await prisma.publicCase.update({
        where: { id: publicCaseId },
        data: {
          category: classification.category,
          court: classification.extractedInfo.court,
          judge: classification.extractedInfo.judge,
          judgmentDate: classification.extractedInfo.judgmentDate ? 
            new Date(classification.extractedInfo.judgmentDate) : 
            null,
          keywords: classification.keywords,
          tags: classification.relatedCases || [],
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      data: classification,
    });
  } catch (error: any) {
    console.error('Classification API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Classification failed' },
      { status: 500 }
    );
  }
}
