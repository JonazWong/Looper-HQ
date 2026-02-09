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
    const body = await request.json();
    const { publicCaseId, title, content, autoUpdate } = classifySchema.parse(body);
    
    // AI classification
    const classification = await classifyCase(title, content || '');
    
    // Auto-update database if autoUpdate=true
    if (autoUpdate && publicCaseId) {
      await prisma.publicCase.update({
        where: { id: publicCaseId },
        data: {
          category: classification.category,
          court: classification.extractedInfo.court,
          judge: classification.extractedInfo.judge,
          judgmentDate: safeParseDate(classification.extractedInfo.judgmentDate),
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
        { success: false, error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Classification failed' },
      { status: 500 }
    );
  }
}
