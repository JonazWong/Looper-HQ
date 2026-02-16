import { generateCompletion } from '@looper-hq/utils';
import { CaseCategory } from '@looper-hq/database';

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

  const responseContent = await generateCompletion({
    systemPrompt: '你是專業的香港法律案例分析助手。',
    userPrompt: prompt,
    jsonMode: true,
    maxTokens: 1000,
  });

  const cleaned = responseContent.replace(/```(?:json)?\n?/g, '');
  
  let result: any;
  try {
    result = JSON.parse(cleaned);
  } catch (error) {
    throw new Error('Failed to parse AI classification response: invalid JSON format');
  }

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

/**
 * Batch classify multiple cases
 */
export async function batchClassifyCases(
  cases: Array<{ title: string; content: string }>
): Promise<ClassificationResult[]> {
  const results: ClassificationResult[] = [];
  
  for (const caseData of cases) {
    try {
      const result = await classifyCase(caseData.title, caseData.content);
      results.push(result);
      
      // Rate limiting: wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to classify case: ${caseData.title}`, error);
      // Return a default result for failed classification
      results.push({
        category: 'OTHER' as CaseCategory,
        court: null,
        judge: null,
        parties: [],
        judgmentDate: null,
        summary: caseData.title.substring(0, 100),
        confidence: 0,
        keywords: [],
      });
    }
  }
  
  return results;
}
