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
        description_zh: true,
        description_en: true,
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
      title: c.title_zh || c.title_en || '',
      content: c.description_zh || c.description_en || '',
    }));
    const results = await batchClassifyCases(casesToClassify);
    
    // Update database
    const updates = [];
    for (let i = 0; i < results.length; i++) {
      const caseData = unclassifiedCases[i];
      const classification = results[i];
      
      updates.push(
        prisma.publicCase.update({
          where: { id: caseData.id },
          data: {
            category: classification.category,
            court: classification.court,
            judge: classification.judge,
            judgmentDate: classification.judgmentDate,
            keywords: classification.keywords,
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
