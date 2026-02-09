import OpenAI from 'openai';
import { CaseCategory } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1',
});

export interface ClassificationResult {
  category: CaseCategory;
  court: string | null;
  judge: string | null;
  parties: string[];
  judgmentDate: Date | null;
  summary: string;
  confidence: number;
  keywords: string[];
}

export async function classifyCase(
  title: string,
  content: string
): Promise<ClassificationResult> {
  const isOpenRouter = process.env.OPENAI_BASE_URL?.includes('openrouter');
  const model = process.env.OPENAI_MODEL || 'anthropic/claude-3.5-sonnet';

  const prompt = `分析以下香港法律案例，提取結構化信息。

標題: ${title}
內容: ${content.substring(0, 2000)}

請以 JSON 格式回覆：
{
  "category": "CIVIL|CRIMINAL|PROPERTY|EMPLOYMENT|FAMILY|CORPORATE",
  "court": "法院名稱",
  "judge": "法官姓名",
  "parties": ["當事人1", "當事人2"],
  "judgmentDate": "YYYY-MM-DD",
  "summary": "50字摘要",
  "confidence": 0.95,
  "keywords": ["關鍵詞1", "關鍵詞2"]
}`;

  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: '你是專業的香港法律案例分析助手。',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  }, {
    headers: isOpenRouter ? {
      'HTTP-Referer': 'https://looper-hq.app',
      'X-Title': 'Looper HQ',
    } : undefined,
  });

  const responseContent = response.choices[0].message.content || '{}';
  const cleaned = responseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  const result = JSON.parse(cleaned);

  return {
    category: result.category as CaseCategory,
    court: result.court,
    judge: result.judge,
    parties: result.parties || [],
    judgmentDate: result.judgmentDate ? new Date(result.judgmentDate) : null,
    summary: result.summary,
    confidence: result.confidence || 0.5,
    keywords: result.keywords || [],
  };
}

