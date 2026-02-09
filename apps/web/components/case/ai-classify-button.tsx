'use client';

import { useState } from 'react';
import { Brain, Loader2 } from 'lucide-react';
import { PremierButton } from '@/components/ui/premier-button';
import { useToast } from '@/hooks/use-toast';

interface Props {
  caseId: string;
  title: string;
  content: string;
  onClassified?: (result: any) => void;
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

      const result = await response.json();
      
      toast({
        title: 'AI 分類完成',
        description: `類別: ${result.category}, 信心度: ${(result.confidence * 100).toFixed(0)}%`,
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
      icon={loading ? Loader2 : Brain}
      onClick={handleClassify}
      disabled={loading}
    >
      {loading ? 'AI 分析中...' : 'AI 智能分類'}
    </PremierButton>
  );
}
