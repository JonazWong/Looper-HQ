import OpenAI from 'openai';
import { CaseCategory } from '@prisma/client';

interface ClassificationResult {
  category: CaseCategory;
  confidence: number;
  keywords: string[];
  extractedInfo: {
    parties?: string[];
    judge?: string;
    court?: string;
    judgmentDate?: string;
  };
  summary?: string;
  relatedCases?: string[];
}

export async function classifyCase(
  title: string, 
  content: string
): Promise<ClassificationResult> {
  const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
  });
  
  const prompt = `
分析以下香港法律案例，並提供詳細分類資訊：

標題: ${title}
內容摘要: ${content.slice(0, 2000)}

請分類為以下類別之一:
- CIVIL (民事)
- CRIMINAL (刑事)
- CORPORATE (公司)
- FAMILY (家事)
- PROPERTY (物業)
- EMPLOYMENT (勞工)
- INTELLECTUAL_PROPERTY (知識產權)
- OTHER (其他)

請以 JSON 格式回覆:
{
  "category": "CATEGORY_NAME",
  "confidence": 0.95,
  "keywords": ["關鍵詞1", "關鍵詞2", ...],
  "extractedInfo": {
    "parties": ["原告", "被告"],
    "judge": "法官姓名",
    "court": "法院名稱",
    "judgmentDate": "YYYY-MM-DD"
  },
  "summary": "案例摘要（50-100字）",
  "relatedCases": ["相關案號1", "相關案號2"]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "你是專業的香港法律案例分析助手，精通案例分類和法律文件解析。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });
    
    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as ClassificationResult;
  } catch (error) {
    console.error('AI classification error:', error);
    throw error;
  }
}

// 批量分類
export async function batchClassifyCases(
  cases: Array<{ id: string; title: string; description?: string }>
): Promise<Map<string, ClassificationResult>> {
  const results = new Map<string, ClassificationResult>();
  
  for (const case_ of cases) {
    try {
      const classification = await classifyCase(
        case_.title,
        case_.description || ''
      );
      results.set(case_.id, classification);
      
      // Rate limiting: 等待 1 秒避免 API 限制
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to classify case ${case_.id}:`, error);
    }
  }
  
  return results;
}
