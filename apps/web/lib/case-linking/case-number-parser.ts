/**
 * 香港案件編號解析器
 * 自動識別、解析並生成案件連結
 * 
 * 支援格式：
 * - FACV 1/2024 (終審法院民事上訴)
 * - FACC 2/2024 (終審法院刑事上訴)
 * - HCAL 123/2024 (高等法院上訴)
 * - HCMP 456/2024 (高等法院雜項案件)
 * - DCCC 789/2024 (區域法院刑事案件)
 * - KCCC 100/2024 (九龍城裁判法院刑事案件)
 * - ESCC 200/2024 (東區裁判法院刑事案件)
 * 等等...
 */

export interface CaseNumberInfo {
  /** 完整案件編號 */
  fullNumber: string;
  
  /** 法院代碼 (如 HCAL, FACV) */
  courtCode: string;
  
  /** 案件序號 */
  caseSequence: string;
  
  /** 年份 */
  year: string;
  
  /** 法院名稱（中文） */
  courtName: string;
  
  /** 案件類型 */
  caseType: string;
  
  /** 法院級別 */
  courtLevel: 'final' | 'high' | 'district' | 'magistrate' | 'other';
}

export interface CaseLinks {
  /** HKLII 連結 */
  hklii?: string | null;
  
  /** 司法機構官網連結 */
  judiciary?: string | null;
  
  /** 法律參考資料庫連結 */
  legalRef?: string | null;
  
  /** 是否已驗證連結有效 */
  verified: boolean;
}

/**
 * 香港法院代碼對照表
 */
const COURT_CODE_MAP: Record<string, {
  name: string;
  type: string;
  level: CaseNumberInfo['courtLevel'];
  hkliiPath?: string;
}> = {
  // 終審法院
  'FACV': { name: '終審法院', type: '民事上訴', level: 'final', hkliiPath: 'hk/cases/hkcfa' },
  'FACC': { name: '終審法院', type: '刑事上訴', level: 'final', hkliiPath: 'hk/cases/hkcfa' },
  'FAMV': { name: '終審法院', type: '雜項訴訟', level: 'final', hkliiPath: 'hk/cases/hkcfa' },
  
  // 高等法院 - 上訴
  'HCAL': { name: '高等法院', type: '民事上訴', level: 'high', hkliiPath: 'hk/cases/hkca' },
  'HCMA': { name: '高等法院', type: '刑事上訴', level: 'high', hkliiPath: 'hk/cases/hkca' },
  'HCLA': { name: '高等法院', type: '土地上訴', level: 'high', hkliiPath: 'hk/cases/hkca' },
  
  // 高等法院 - 原訟
  'HCPI': { name: '高等法院', type: '人身傷害訴訟', level: 'high', hkliiPath: 'hk/cases/hkcfi' },
  'HCA': { name: '高等法院', type: '民事訴訟', level: 'high', hkliiPath: 'hk/cases/hkcfi' },
  'HCCT': { name: '高等法院', type: '建築與仲裁', level: 'high', hkliiPath: 'hk/cases/hkcfi' },
  'HCCL': { name: '高等法院', type: '公司清盤', level: 'high', hkliiPath: 'hk/cases/hkcfi' },
  'HCCW': { name: '高等法院', type: '公司訴訟', level: 'high', hkliiPath: 'hk/cases/hkcfi' },
  'HCMP': { name: '高等法院', type: '雜項案件', level: 'high', hkliiPath: 'hk/cases/hkcfi' },
  'HCSD': { name: '高等法院', type: '誹謗訴訟', level: 'high', hkliiPath: 'hk/cases/hkcfi' },
  
  // 區域法院
  'DCCC': { name: '區域法院', type: '刑事案件', level: 'district', hkliiPath: 'hk/cases/hkdc' },
  'DCCJ': { name: '區域法院', type: '刑事案件（法官）', level: 'district', hkliiPath: 'hk/cases/hkdc' },
  'DCEO': { name: '區域法院', type: '僱員補償', level: 'district', hkliiPath: 'hk/cases/hkdc' },
  'DCEC': { name: '區域法院', type: '僱員補償上訴', level: 'district', hkliiPath: 'hk/cases/hkdc' },
  'DCPI': { name: '區域法院', type: '人身傷害', level: 'district', hkliiPath: 'hk/cases/hkdc' },
  'DCCV': { name: '區域法院', type: '民事訴訟', level: 'district', hkliiPath: 'hk/cases/hkdc' },
  
  // 裁判法院（主要法院）
  'ESCC': { name: '東區裁判法院', type: '刑事案件', level: 'magistrate' },
  'FLCC': { name: '粉嶺裁判法院', type: '刑事案件', level: 'magistrate' },
  'KCCC': { name: '九龍城裁判法院', type: '刑事案件', level: 'magistrate' },
  'KTCC': { name: '觀塘裁判法院', type: '刑事案件', level: 'magistrate' },
  'KWCC': { name: '荃灣裁判法院', type: '刑事案件', level: 'magistrate' },
  'STTC': { name: '沙田裁判法院', type: '刑事案件', level: 'magistrate' },
  'STCC': { name: '沙田裁判法院', type: '刑事案件', level: 'magistrate' },
  'TMCC': { name: '屯門裁判法院', type: '刑事案件', level: 'magistrate' },
  'WKCC': { name: '黃大仙裁判法院', type: '刑事案件', level: 'magistrate' },
};

/**
 * 案件編號正則表達式
 * 匹配格式：[法院代碼] [序號]/[年份]
 * 例如：HCAL 123/2024, FACV 1/2023
 */
const CASE_NUMBER_REGEX = /\b([A-Z]{2,6})\s*(\d+)\/(\d{4})\b/g;

/**
 * HK neutral citation abbreviation → HKLII path mapping
 */
export const NEUTRAL_CITATION_COURT_MAP: Record<string, string> = {
  HKCFA: 'hk/cases/hkcfa',
  HKCA: 'hk/cases/hkca',
  HKCFI: 'hk/cases/hkcfi',
  HKDC: 'hk/cases/hkdc',
};

/**
 * Neutral citation regex
 * Matches: [YYYY] HKCFA N, [YYYY] HKCA N, [YYYY] HKCFI N, [YYYY] HKDC N
 */
export const NEUTRAL_CITATION_REGEX = /\[(\d{4})\]\s+(HKCFA|HKCA|HKCFI|HKDC)\s+(\d+)/g;

export interface NeutralCitationInfo {
  /** Full citation string, e.g. "[2024] HKCFA 1" */
  fullCitation: string;
  year: string;
  /** Court abbreviation, e.g. "HKCFA" */
  court: string;
  number: string;
  /** HKLII URL path segment if available */
  hkliiPath?: string;
}

/**
 * Extract all HK neutral citations from text.
 * Returns deduplicated results.
 */
export function extractNeutralCitations(text: string): NeutralCitationInfo[] {
  const matches = Array.from(text.matchAll(new RegExp(NEUTRAL_CITATION_REGEX.source, 'g')));
  const seen = new Set<string>();
  const results: NeutralCitationInfo[] = [];

  for (const match of matches) {
    const [fullCitation, year, court, number] = match;
    if (seen.has(fullCitation)) continue;
    seen.add(fullCitation);

    results.push({
      fullCitation,
      year,
      court,
      number,
      hkliiPath: NEUTRAL_CITATION_COURT_MAP[court],
    });
  }

  return results;
}

/**
 * 從文本中提取所有案件編號
 */
export function extractCaseNumbers(text: string): CaseNumberInfo[] {
  const matches = Array.from(text.matchAll(CASE_NUMBER_REGEX));
  const results: CaseNumberInfo[] = [];
  
  for (const match of matches) {
    const [fullNumber, courtCode, caseSequence, year] = match;
    const courtInfo = COURT_CODE_MAP[courtCode];
    
    if (courtInfo) {
      results.push({
        fullNumber,
        courtCode,
        caseSequence,
        year,
        courtName: courtInfo.name,
        caseType: courtInfo.type,
        courtLevel: courtInfo.level,
      });
    }
  }
  
  return results;
}

/**
 * 解析單一案件編號
 */
export function parseCaseNumber(caseNumber: string): CaseNumberInfo | null {
  const match = caseNumber.match(/([A-Z]{2,6})\s*(\d+)\/(\d{4})/);
  if (!match) return null;
  
  const [fullNumber, courtCode, caseSequence, year] = match;
  const courtInfo = COURT_CODE_MAP[courtCode];
  
  if (!courtInfo) return null;
  
  return {
    fullNumber,
    courtCode,
    caseSequence,
    year,
    courtName: courtInfo.name,
    caseType: courtInfo.type,
    courtLevel: courtInfo.level,
  };
}

/**
 * 生成 HKLII 連結
 */
export function generateHKLIILink(caseInfo: CaseNumberInfo): string | null {
  const courtInfo = COURT_CODE_MAP[caseInfo.courtCode];
  if (!courtInfo?.hkliiPath) return null;
  
  // HKLII URL 格式：https://www.hklii.hk/en/cases/[court]/[year]/[number]
  return `https://www.hklii.hk/en/cases/${courtInfo.hkliiPath}/${caseInfo.year}/${caseInfo.caseSequence}`;
}

/**
 * 生成司法機構連結
 */
export function generateJudiciaryLink(caseInfo: CaseNumberInfo): string | null {
  // 司法機構案件搜尋：https://www.judiciary.hk/en/crt_services/case_search.html
  const searchParams = new URLSearchParams({
    caseno: caseInfo.fullNumber,
  });
  
  return `https://www.judiciary.hk/en/crt_services/case_search.html?${searchParams.toString()}`;
}

/**
 * 生成所有可能的連結
 */
export function generateCaseLinks(caseNumberOrInfo: string | CaseNumberInfo): CaseLinks | null {
  const caseInfo = typeof caseNumberOrInfo === 'string' 
    ? parseCaseNumber(caseNumberOrInfo) 
    : caseNumberOrInfo;
    
  if (!caseInfo) return null;
  
  return {
    hklii: generateHKLIILink(caseInfo),
    judiciary: generateJudiciaryLink(caseInfo),
    legalRef: `https://legalref.judiciary.hk/lrs/common/search/search_result_detail_frame.jsp?DIS=1&QS=${encodeURIComponent(caseInfo.fullNumber)}`,
    verified: false,
  };
}

/**
 * 驗證連結是否有效（需要實際 HTTP 請求）
 */
export async function verifyCaseLinks(links: CaseLinks): Promise<CaseLinks> {
  // 這裡可以實作 HTTP HEAD 請求來檢查連結是否存在
  // 目前先返回未驗證狀態
  return {
    ...links,
    verified: false,
  };
}

/**
 * 從文本中自動識別並替換為可點擊連結（用於 UI）
 */
export function autoLinkCaseNumbers(text: string): string {
  return text.replace(CASE_NUMBER_REGEX, (match) => {
    const links = generateCaseLinks(match);
    if (!links?.hklii) return match;
    
    return `<a href="${links.hklii}" target="_blank" rel="noopener noreferrer" class="case-number-link">${match}</a>`;
  });
}

/**
 * 批量處理：從文本中提取所有案件編號並生成連結
 */
export function extractAndLinkCaseNumbers(text: string): Array<{
  caseInfo: CaseNumberInfo;
  links: CaseLinks;
}> {
  const caseNumbers = extractCaseNumbers(text);
  return caseNumbers.map(caseInfo => ({
    caseInfo,
    links: generateCaseLinks(caseInfo)!,
  }));
}
