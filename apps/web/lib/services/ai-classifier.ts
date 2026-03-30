import { generateCompletion } from '@looper-hq/utils';
import { CaseCategory } from '@looper-hq/database';

const OPENROUTER_HEADERS = {
  'HTTP-Referer': 'https://looper-hq.app',
  'X-Title': 'Looper HQ',
};

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

// Pre-classification rules to reduce AI API calls and improve accuracy
function preClassifyByTitle(title: string): CaseCategory | null {
  const t = title.toUpperCase();

  // Criminal patterns
  if (/HKSAR\s+V\.?\s+|香港特別行政區\s*訴|SECRETARY FOR JUSTICE V\./i.test(title)) {
    return 'CRIMINAL';
  }
  if (/CRIMINAL APPEAL|刑事上訴/i.test(title)) {
    return 'CRIMINAL_APPEAL';
  }

  // Judicial Review
  if (/JUDICIAL REVIEW|司法覆核|APPLICATION FOR LEAVE TO APPLY FOR JUDICIAL REVIEW/i.test(title)) {
    return 'JUDICIAL_REVIEW';
  }

  // Family & Matrimonial
  if (/MATRIMONIAL|DIVORCE|婚姻訴訟|離婚|FCMC|FAMILY COURT/i.test(title)) {
    return 'FAMILY';
  }

  // Probate & Estate
  if (/ESTATE OF|IN THE MATTER OF THE ESTATE|遺產|遺囑/i.test(title)) {
    return 'OTHER';
  }

  // Bankruptcy
  if (/BANKRUPTCY|WINDING UP|LIQUIDATION|破產|清盤/i.test(title)) {
    return 'BANKRUPTCY_INSOLVENCY';
  }

  // Competition
  if (/COMPETITION TRIBUNAL|競爭事務委員會/i.test(title)) {
    return 'COMPETITION';
  }

  // Labour
  if (/LABOUR TRIBUNAL|EMPLOYMENT|勞工/i.test(title)) {
    return 'EMPLOYMENT';
  }

  // Lands Tribunal
  if (/LANDS TRIBUNAL|土地審裁處/i.test(title)) {
    return 'PROPERTY';
  }

  return null;
}

const FEW_SHOT_EXAMPLES = `
## 分類範例

範例1（刑事）:
標題: "HKSAR v Chan Tai Man"
摘要: "被告被控傷人罪，事發於旺角街頭"
→ {"category":"CRIMINAL","court":"District Court","judge":null,"parties":["HKSAR","Chan Tai Man"],"judgmentDate":null,"summary":"被告被控傷人罪","confidence":0.97,"keywords":["刑事","傷人"]}

範例2（民事合約）:
標題: "ABC Trading Ltd v XYZ Holdings"
摘要: "原告就被告拖欠貨款提出訴訟，涉款港幣二百萬"
→ {"category":"CONTRACT","court":"District Court","judge":null,"parties":["ABC Trading Ltd","XYZ Holdings"],"judgmentDate":null,"summary":"合約糾紛，拖欠貨款二百萬","confidence":0.93,"keywords":["合約","貨款"]}

範例3（司法覆核）:
標題: "Re: Application for Judicial Review - Immigration Department Decision"
摘要: "申請人就入境處拒絕其居留申請提出司法覆核"
→ {"category":"JUDICIAL_REVIEW","court":"Court of First Instance","judge":null,"parties":["Applicant","Director of Immigration"],"judgmentDate":null,"summary":"就入境處決定申請司法覆核","confidence":0.96,"keywords":["司法覆核","入境"]}
`;

async function classifyCaseWithRetry(
  title: string,
  content: string,
  maxRetries = 3
): Promise<ClassificationResult> {
  const preClassified = preClassifyByTitle(title);

  const prompt = `${FEW_SHOT_EXAMPLES}

---

請分析以下香港法律案例，提取結構化信息。

標題: ${title}
內容: ${content.substring(0, 2000)}

請以 JSON 格式回覆（不要加其他文字）：
{
  "category": "CIVIL|CRIMINAL|CRIMINAL_APPEAL|CORPORATE|FAMILY|PROPERTY|EMPLOYMENT|INTELLECTUAL_PROPERTY|ADMINISTRATIVE|CONSTITUTIONAL|IMMIGRATION|PERSONAL_INJURY|TORT|CONTRACT|BANKRUPTCY_INSOLVENCY|SECURITIES|ARBITRATION|JUDICIAL_REVIEW|HUMAN_RIGHTS|COMPETITION|TAX|OTHER",
  "court": "法院名稱（如 Court of Final Appeal, Court of Appeal, Court of First Instance, District Court, Magistrates Court）或 null",
  "judge": "主審法官姓名或 null",
  "parties": ["原告/申請人", "被告/答辯人"],
  "judgmentDate": "YYYY-MM-DD 或 null",
  "summary": "30-60字案情摘要（中文）",
  "confidence": 0.95,
  "keywords": ["關鍵詞1", "關鍵詞2", "關鍵詞3"]
}

分類說明：
- CIVIL: 民事訴訟（一般）
- CRIMINAL: 刑事案件（香港特區訴被告）
- CRIMINAL_APPEAL: 刑事上訴
- CORPORATE: 公司法、商業法、股東糾紛
- FAMILY: 家事、離婚、撫養、監護
- PROPERTY: 物業、土地、租約
- EMPLOYMENT: 勞工、僱傭合約、解僱
- INTELLECTUAL_PROPERTY: 知識產權、版權、商標、專利
- ADMINISTRATIVE: 行政法、政府決定
- CONSTITUTIONAL: 憲法、基本法、人權
- IMMIGRATION: 入境事務、居留權、遣返
- PERSONAL_INJURY: 人身傷害、損害賠償
- TORT: 侵權法（一般）
- CONTRACT: 合約糾紛、貨款、服務合約
- BANKRUPTCY_INSOLVENCY: 破產、清盤、公司清算
- SECURITIES: 證券、期貨、投資詐騙
- ARBITRATION: 仲裁、調解
- JUDICIAL_REVIEW: 司法覆核
- HUMAN_RIGHTS: 人權法（ICCPR、BOR）
- COMPETITION: 競爭法
- TAX: 稅務、差餉
- OTHER: 其他${preClassified ? `\n\n注意：根據標題規則預判類別為 ${preClassified}，請確認或修正。` : ''}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }

      const isOpenRouter =
        process.env.AI_PROVIDER === 'openrouter' ||
        !!(process.env.OPENROUTER_BASE_URL) ||
        (process.env.OPENAI_BASE_URL || '').includes('openrouter');
      const responseContent = await generateCompletion({
        systemPrompt: '你是專業的香港法律案例分析助手。請嚴格按照 JSON 格式回覆，不要加入任何說明文字。',
        userPrompt: prompt,
        jsonMode: true,
        maxTokens: 1000,
        ...(isOpenRouter && {
          requestOptions: { headers: OPENROUTER_HEADERS },
        }),
      });

      // Extract JSON from response (handle code blocks)
      const cleaned = responseContent
        .replace(/```(?:json)?\n?/g, '')
        .replace(/```\s*$/g, '')
        .trim();

      let result: any;
      try {
        result = JSON.parse(cleaned);
      } catch {
        // Try extracting JSON object if surrounded by text
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Cannot extract JSON from AI response');
        }
      }

      // Validate category against known enum values
      const validCategories: CaseCategory[] = [
        'CIVIL', 'CRIMINAL', 'CRIMINAL_APPEAL', 'CORPORATE', 'FAMILY', 'PROPERTY',
        'EMPLOYMENT', 'INTELLECTUAL_PROPERTY', 'ADMINISTRATIVE', 'CONSTITUTIONAL',
        'IMMIGRATION', 'PERSONAL_INJURY', 'TORT', 'CONTRACT', 'BANKRUPTCY_INSOLVENCY',
        'SECURITIES', 'ARBITRATION', 'JUDICIAL_REVIEW', 'HUMAN_RIGHTS', 'COMPETITION',
        'TAX', 'OTHER',
      ];

      const category = validCategories.includes(result.category)
        ? result.category as CaseCategory
        : (preClassified ?? 'OTHER' as CaseCategory);

      return {
        category,
        court: result.court || null,
        judge: result.judge || null,
        parties: Array.isArray(result.parties) ? result.parties : [],
        judgmentDate: result.judgmentDate ? new Date(result.judgmentDate) : null,
        summary: result.summary || title.substring(0, 100),
        confidence: typeof result.confidence === 'number'
          ? Math.min(1, Math.max(0, result.confidence))
          : 0.5,
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
      };
    } catch (error) {
      lastError = error as Error;
      console.warn(`AI classification attempt ${attempt + 1}/${maxRetries} failed for: ${title}`, error);
    }
  }

  // All retries exhausted - return best-effort fallback
  console.error(`AI classification failed after ${maxRetries} attempts for: ${title}`, lastError);
  return {
    category: preClassified ?? 'OTHER' as CaseCategory,
    court: null,
    judge: null,
    parties: [],
    judgmentDate: null,
    summary: title.substring(0, 100),
    confidence: preClassified ? 0.4 : 0,
    keywords: [],
  };
}

export async function classifyCase(
  title: string,
  content: string
): Promise<ClassificationResult> {
  return classifyCaseWithRetry(title, content);
}

/**
 * Batch classify multiple cases with rate limiting and progress tracking
 */
export async function batchClassifyCases(
  cases: Array<{ title: string; content: string }>,
  options: { delayMs?: number; onProgress?: (completed: number, total: number) => void } = {}
): Promise<ClassificationResult[]> {
  const { delayMs = 600, onProgress } = options;
  const results: ClassificationResult[] = [];

  for (let i = 0; i < cases.length; i++) {
    const caseData = cases[i];
    const result = await classifyCaseWithRetry(caseData.title, caseData.content);
    results.push(result);

    if (onProgress) {
      onProgress(i + 1, cases.length);
    }

    // Rate limiting between requests (skip after last item)
    if (i < cases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

