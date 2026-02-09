import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { batchClassifyCases } from '@/lib/services/ai-classifier';

export async function POST(request: NextRequest) {
  try {
    // 獲取未分類的案例（category 為空或為 'OTHER'）
    const unclassifiedCases = await prisma.publicCase.findMany({
      where: {
        OR: [
          { category: null },
          { category: 'OTHER' },
        ],
      },
      take: 50, // 每次處理 50 個
      select: {
        id: true,
        title: true,
        description: true,
      },
    });
    
    if (unclassifiedCases.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unclassified cases found',
        processed: 0,
      });
    }
    
    // 批量分類
    const results = await batchClassifyCases(unclassifiedCases);
    
    // 更新資料庫
    const updates = [];
    for (const [caseId, classification] of results) {
      updates.push(
        prisma.publicCase.update({
          where: { id: caseId },
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
        })
      );
    }
    
    await Promise.all(updates);
    
    return NextResponse.json({
      success: true,
      message: `Successfully classified ${results.size} cases`,
      processed: results.size,
      total: unclassifiedCases.length,
    });
  } catch (error: any) {
    console.error('Batch classification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Batch classification failed' },
      { status: 500 }
    );
  }
}
