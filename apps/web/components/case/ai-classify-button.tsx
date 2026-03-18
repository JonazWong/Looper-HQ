'use client';

import { useState } from 'react';
import { Brain, Loader2 } from 'lucide-react';
import { PremierButton } from '@/components/ui/premier-button';
import { useToast } from '@/hooks/use-toast';
import { ClassificationResult } from '@/lib/services/ai-classifier';
import { CaseCategory } from '@looper-hq/database';

// Category name mapping for user-friendly display
const CATEGORY_NAMES: Record<CaseCategory, string> = {
  CIVIL: '民事',
  CRIMINAL: '刑事',
  CRIMINAL_APPEAL: '刑事上訴',
  CORPORATE: '公司',
  FAMILY: '家事',
  PROPERTY: '物業',
  EMPLOYMENT: '勞工',
  INTELLECTUAL_PROPERTY: '知識產權',
  ADMINISTRATIVE: '行政法',
  CONSTITUTIONAL: '憲法/基本法',
  IMMIGRATION: '入境事務',
  PERSONAL_INJURY: '人身傷害',
  TORT: '侵權法',
  CONTRACT: '合約法',
  BANKRUPTCY_INSOLVENCY: '破產/清盤',
  SECURITIES: '證券法',
  ARBITRATION: '仲裁',
  JUDICIAL_REVIEW: '司法覆核',
  HUMAN_RIGHTS: '人權法',
  COMPETITION: '競爭法',
  TAX: '稅務',
  OTHER: '其他',
};

interface Props {
  caseId: string;
  title: string;
  content: string;
  onClassified?: (result: ClassificationResult) => void;
}

export function AIClassifyButton({ caseId, title, content, onClassified }: Props) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClassify = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) throw new Error('分類失敗');

      const result: ClassificationResult = await response.json();
      
      const categoryName = CATEGORY_NAMES[result.category] || result.category;
      
      toast({
        title: 'AI 分類完成',
        description: `類別: ${categoryName}, 信心度: ${(result.confidence * 100).toFixed(0)}%`,
      });

      onClassified?.(result);
    } catch (error) {
      toast({
        title: '分類失敗',
        description: '請稍後再試',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremierButton
      variant="primary"
      icon={loading ? <Loader2 className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
      onClick={handleClassify}
      disabled={loading}
    >
      {loading ? 'AI 分析中...' : 'AI 智能分類'}
    </PremierButton>
  );
}
