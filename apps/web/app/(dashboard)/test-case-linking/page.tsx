/**
 * 智能案件連結測試頁面
 * 測試 50+ 香港法院案件編號自動識別與連結功能
 */

'use client';

import { AutoLinkText, CaseLinksList, CaseNumberLink } from '@/lib/case-linking/use-case-linking';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';

export default function CaseLinkingTestPage() {
  // 測試案例文本（包含多種法院案件編號）
  const testCases = [
    {
      title: "終審法院民事上訴",
      text: "在 FACV 1/2024 中，法院駁回了原告的上訴。相關案件包括 FACV 3/2023。"
    },
    {
      title: "高等法院上訴案件",
      text: "HCAL 123/2024 與 HCAL 456/2024 兩案涉及相似的法律問題。另見 HCMP 789/2023。"
    },
    {
      title: "區域法院刑事案件",
      text: "被告在 DCCC 100/2024 中被判處監禁三年，法院同時參考了 DCCC 200/2023 的裁決。"
    },
    {
      title: "裁判法院案件",
      text: "KCCC 50/2024、ESCC 60/2024 和 TMCC 70/2024 均涉及交通違例事項。"
    },
    {
      title: "混合案件編號",
      text: "本案 HCA 1000/2024 引用了 FACV 5/2020、HCAL 888/2021 以及 DCCC 999/2022 的判例。"
    },
    {
      title: "無案件編號",
      text: "這段文本沒有包含任何案件編號，應該顯示為普通文本。"
    }
  ];

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 標題 */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gradient-gold">
          ⚖️ 智能案件連結測試
        </h1>
        <p className="text-premier-pearl-gray text-lg">
          自動識別並連結 50+ 香港法院案件編號格式
        </p>
      </div>

      {/* 測試 1: 單個案件連結 */}
      <GlassCard variant="gold">
        <GlassCardHeader>
          <GlassCardTitle>測試 1: 單個案件連結 (CaseNumberLink)</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-sm text-premier-pearl-gray mb-1">終審法院:</p>
              <CaseNumberLink caseNumber="FACV 1/2024" />
            </div>
            <div>
              <p className="text-sm text-premier-pearl-gray mb-1">高等法院:</p>
              <CaseNumberLink caseNumber="HCAL 123/2024" />
            </div>
            <div>
              <p className="text-sm text-premier-pearl-gray mb-1">區域法院:</p>
              <CaseNumberLink caseNumber="DCCC 456/2024" />
            </div>
            <div>
              <p className="text-sm text-premier-pearl-gray mb-1">裁判法院:</p>
              <CaseNumberLink caseNumber="KCCC 789/2024" />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* 測試 2: 自動文本連結 */}
      <GlassCard variant="gold">
        <GlassCardHeader>
          <GlassCardTitle>測試 2: 自動文本連結 (AutoLinkText)</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          {testCases.map((testCase, index) => (
            <div key={index} className="border-l-2 border-premier-gold/50 pl-4">
              <h3 className="text-premier-gold font-semibold mb-2">{testCase.title}</h3>
              <p className="text-premier-pearl">
                <AutoLinkText text={testCase.text} />
              </p>
            </div>
          ))}
        </GlassCardContent>
      </GlassCard>

      {/* 測試 3: 案件連結清單 */}
      <GlassCard variant="gold">
        <GlassCardHeader>
          <GlassCardTitle>測試 3: 案件連結清單 (CaseLinksList)</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-6">
          {testCases.slice(0, 5).map((testCase, index) => (
            <div key={index} className="space-y-3">
              <h3 className="text-premier-gold font-semibold">{testCase.title}</h3>
              <p className="text-premier-pearl-gray text-sm">{testCase.text}</p>
              <CaseLinksList 
                text={testCase.text} 
                showJudiciary={true} 
                showLegalRef={true} 
              />
            </div>
          ))}
        </GlassCardContent>
      </GlassCard>

      {/* 支援的法院列表 */}
      <GlassCard variant="gold">
        <GlassCardHeader>
          <GlassCardTitle>支援的法院案件編號格式 (50+ 種)</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-premier-gold font-semibold mb-2">終審法院</h4>
              <ul className="space-y-1 text-sm text-premier-pearl-gray">
                <li>• FACV - 民事上訴</li>
                <li>• FACC - 刑事上訴</li>
                <li>• FAMV - 雜項訴訟</li>
              </ul>
            </div>
            <div>
              <h4 className="text-premier-gold font-semibold mb-2">高等法院</h4>
              <ul className="space-y-1 text-sm text-premier-pearl-gray">
                <li>• HCAL - 民事上訴</li>
                <li>• HCMA - 刑事上訴</li>
                <li>• HCA - 民事訴訟</li>
                <li>• HCMP - 雜項案件</li>
                <li>• HCPI - 人身傷害</li>
                <li>• HCCL - 公司清盤</li>
              </ul>
            </div>
            <div>
              <h4 className="text-premier-gold font-semibold mb-2">區域法院</h4>
              <ul className="space-y-1 text-sm text-premier-pearl-gray">
                <li>• DCCC - 刑事案件</li>
                <li>• DCCJ - 刑事案件（法官）</li>
                <li>• DCCV - 民事訴訟</li>
                <li>• DCPI - 人身傷害</li>
                <li>• DCEO - 僱員補償</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-premier-gold/20">
            <h4 className="text-premier-gold font-semibold mb-2">裁判法院</h4>
            <p className="text-sm text-premier-pearl-gray">
              ESCC, FLCC, KCCC, KTCC, KWCC, STTC, STCC, TMCC, WKCC 等
            </p>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* 技術說明 */}
      <GlassCard variant="mystery">
        <GlassCardHeader>
          <GlassCardTitle>🔧 技術說明</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-3 text-sm text-premier-pearl-gray">
          <p>
            <strong className="text-premier-gold">正則表達式:</strong> 
            {' '}<code className="bg-premier-black/50 px-2 py-1 rounded">/\b([A-Z]{'{2,6}'})\s*(\d+)\/(\d{'{4}'})\b/g</code>
          </p>
          <p>
            <strong className="text-premier-gold">HKLII 連結格式:</strong>
            {' '}https://www.hklii.hk/en/cases/[court]/[year]/[number]
          </p>
          <p>
            <strong className="text-premier-gold">司法機構搜尋:</strong>
            {' '}https://www.judiciary.hk/en/crt_services/case_search.html
          </p>
          <p>
            <strong className="text-premier-gold">自動提取功能:</strong>
            {' '}從任何文本中自動識別案件編號，無需手動標記
          </p>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
