import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { classifyCase } from '@/lib/services/ai-classifier';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const result = await classifyCase(title, content);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Classification error:', error);
    return NextResponse.json(
      { error: 'Classification failed', details: error.message },
      { status: 500 }
    );
  }
}
