/**
 * React Hook：自動案件連結
 * 用於前端元件自動識別並連結案件編號
 * 
 * 適配 Looper HQ Premier Design System (Black Veil Empress 主題)
 */

'use client';

import { useMemo } from 'react';
import { extractCaseNumbers, generateCaseLinks, type CaseNumberInfo, type CaseLinks } from './case-number-parser';

export interface LinkedCaseNumber {
  caseInfo: CaseNumberInfo;
  links: CaseLinks;
}

/**
 * 從文本中提取案件編號並生成連結
 */
export function useExtractCaseNumbers(text: string): LinkedCaseNumber[] {
  return useMemo(() => {
    const caseNumbers = extractCaseNumbers(text);
    return caseNumbers.map(caseInfo => ({
      caseInfo,
      links: generateCaseLinks(caseInfo)!,
    }));
  }, [text]);
}

/**
 * 案件編號連結元件
 * Premier Design: 使用金色 (#D4AF37) 強調
 */
interface CaseNumberLinkProps {
  caseNumber: string;
  className?: string;
  showTooltip?: boolean;
}

export function CaseNumberLink({ caseNumber, className, showTooltip = true }: CaseNumberLinkProps) {
  const links = useMemo(() => generateCaseLinks(caseNumber), [caseNumber]);
  
  if (!links?.hklii) {
    return <span className={className}>{caseNumber}</span>;
  }
  
  return (
    <a
      href={links.hklii}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-premier-gold hover:text-premier-gold/80 underline decoration-premier-gold/30 font-medium transition-all ${className || ''}`}
      title={showTooltip ? `在 HKLII 查看 ${caseNumber}` : undefined}
    >
      {caseNumber}
    </a>
  );
}

/**
 * 自動連結文本中的所有案件編號
 */
interface AutoLinkTextProps {
  text: string;
  className?: string;
}

export function AutoLinkText({ text, className }: AutoLinkTextProps) {
  const segments = useMemo(() => {
    const caseNumbers = extractCaseNumbers(text);
    if (caseNumbers.length === 0) {
      return [{ type: 'text' as const, content: text }];
    }
    
    const result: Array<{ type: 'text' | 'link'; content: string; caseInfo?: CaseNumberInfo }> = [];
    let lastIndex = 0;
    
    // 找出所有案件編號的位置
    const regex = /\b([A-Z]{2,6})\s*(\d+)\/(\d{4})\b/g;
    let match: RegExpExecArray | null;
    
    while ((match = regex.exec(text)) !== null) {
      // 添加案件編號前的文本
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
        });
      }
      
      // 添加案件編號（作為連結）
      const matchedText = match[0];
      const caseInfo = caseNumbers.find(c => c.fullNumber === matchedText);
      if (caseInfo) {
        result.push({
          type: 'link',
          content: matchedText,
          caseInfo,
        });
      } else {
        result.push({
          type: 'text',
          content: matchedText,
        });
      }
      
      lastIndex = match.index + matchedText.length;
    }
    
    // 添加剩餘文本
    if (lastIndex < text.length) {
      result.push({
        type: 'text',
        content: text.slice(lastIndex),
      });
    }
    
    return result;
  }, [text]);
  
  return (
    <span className={className}>
      {segments.map((segment, index) => 
        segment.type === 'link' && segment.caseInfo ? (
          <CaseNumberLink
            key={index}
            caseNumber={segment.content}
          />
        ) : (
          <span key={index}>{segment.content}</span>
        )
      )}
    </span>
  );
}

/**
 * 案件連結清單（顯示所有找到的案件編號）
 * Premier Design: 黑底金邊卡片
 */
interface CaseLinksListProps {
  text: string;
  showJudiciary?: boolean;
  showLegalRef?: boolean;
}

export function CaseLinksList({ text, showJudiciary = true, showLegalRef = false }: CaseLinksListProps) {
  const linkedCases = useExtractCaseNumbers(text);
  
  if (linkedCases.length === 0) {
    return null;
  }
  
  return (
    <div className="border border-premier-gold/30 rounded-lg p-4 bg-gradient-to-br from-zinc-900/50 to-black/50 backdrop-blur-sm">
      <h4 className="font-semibold text-premier-gold mb-3 flex items-center gap-2">
        <span className="text-lg">⚖️</span>
        相關案件編號
      </h4>
      <div className="space-y-3">
        {linkedCases.map((item, index) => (
          <div key={index} className="flex flex-col gap-1 border-l-2 border-premier-gold/50 pl-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-medium text-white bg-premier-gold/10 px-2 py-0.5 rounded">
                {item.caseInfo.fullNumber}
              </span>
              <span className="text-sm text-zinc-400">
                {item.caseInfo.courtName} - {item.caseInfo.caseType}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              {item.links.hklii && (
                <a
                  href={item.links.hklii}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-premier-gold/80 hover:text-premier-gold underline decoration-premier-gold/30 transition-colors flex items-center gap-1"
                >
                  <span>📚</span>
                  HKLII
                </a>
              )}
              {showJudiciary && item.links.judiciary && (
                <a
                  href={item.links.judiciary}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-premier-gold/80 hover:text-premier-gold underline decoration-premier-gold/30 transition-colors flex items-center gap-1"
                >
                  <span>⚖️</span>
                  司法機構
                </a>
              )}
              {showLegalRef && item.links.legalRef && (
                <a
                  href={item.links.legalRef}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-premier-gold/80 hover:text-premier-gold underline decoration-premier-gold/30 transition-colors flex items-center gap-1"
                >
                  <span>📖</span>
                  法律參考
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
