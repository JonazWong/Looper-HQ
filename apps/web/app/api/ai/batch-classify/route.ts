import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { batchClassifyCases } from '@/lib/services/ai-classifier';

// Helper function to validate and parse date strings
function safeParseDate(dateString: string | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${dateString}`);
      return null;
    }
    return date;
  } catch (error) {
    console.warn(`Failed to parse date: ${dateString}`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get unclassified cases (category is null or 'OTHER')
    const unclassifiedCases = await prisma.publicCase.findMany({
      where: {
        OR: [
          { category: null },
          { category: 'OTHER' },
        ],
      },
      take: 50, // Process 50 cases at a time
      select: {
        id: true,
        title_zh: true,
        title_en: true,
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
    
    // Batch classification
    const casesToClassify = unclassifiedCases.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description || undefined,
    }));
    const results = await batchClassifyCases(casesToClassify);
    
    // Update database
    const updates = [];
    for (const [caseId, classification] of results) {
      updates.push(
        prisma.publicCase.update({
          where: { id: caseId },
          data: {
            category: classification.category,
            court: classification.extractedInfo.court,
            judge: classification.extractedInfo.judge,
            judgmentDate: safeParseDate(classification.extractedInfo.judgmentDate),
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
