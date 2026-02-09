import { NextRequest, NextResponse } from 'next/server';
import { translateText, autoTranslate } from '@/lib/services/translator';
import { z } from 'zod';

const translateSchema = z.object({
  text: z.string().min(1),
  direction: z.enum(['zh-to-en', 'en-to-zh', 'auto']).optional().default('auto'),
  context: z.enum(['legal', 'general']).optional().default('legal'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, direction, context } = translateSchema.parse(body);
    
    let result;
    if (direction === 'auto') {
      result = await autoTranslate(text);
    } else {
      result = await translateText(text, direction, context);
    }
    
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Translation API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Translation failed' },
      { status: 500 }
    );
  }
}
