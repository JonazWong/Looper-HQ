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
  "category": "CIVIL|CRIMINAL|CRIMINAL_APPEAL|CORPORATE|FAMILY|PROPERTY|EMPLOYMENT|INTELLECTUAL_PROPERTY|ADMINISTRATIVE|CONSTITUTIONAL|IMMIGRATION|PERSONAL_INJURY|TORT|CONTRACT|BANKRUPTCY_INSOLVENCY|SECURITIES|ARBITRATION|JUDICIAL_REVIEW|HUMAN_RIGHTS|COMPETITION|TAX|OTHER",
  "court": "法院名稱",
  "judge": "法官姓名",
  "parties": ["當事人1", "當事人2"],
  "judgmentDate": "YYYY-MM-DD",
  "summary": "50字摘要",
  "confidence": 0.95,
  "keywords": ["關鍵詞1", "關鍵詞2"]
}

分類說明：
- CIVIL: 民事訴訟（一般）
- CRIMINAL: 刑事案件
- CRIMINAL_APPEAL: 刑事上訴
- CORPORATE: 公司法、商業法
- FAMILY: 家事、離婚、撫養
- PROPERTY: 物業、土地
- EMPLOYMENT: 勞工、僱傭
- INTELLECTUAL_PROPERTY: 知識產權、版權、商標
- ADMINISTRATIVE: 行政法、政府決定
- CONSTITUTIONAL: 憲法、基本法
- IMMIGRATION: 入境事務、居留權
- PERSONAL_INJURY: 人身傷害、損害賠償
- TORT: 侵權法（一般）
- CONTRACT: 合約糾紛
- BANKRUPTCY_INSOLVENCY: 破產、清盤
- SECURITIES: 證券、期貨
- ARBITRATION: 仲裁
- JUDICIAL_REVIEW: 司法覆核
- HUMAN_RIGHTS: 人權法
- COMPETITION: 競爭法
- TAX: 稅務
- OTHER: 其他`;

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
