'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { PremierButton } from '@/components/ui/premier-button';

interface ClassifyButtonProps {
  publicCaseId: string;
  title: string;
  content?: string;
  onClassified?: (result: any) => void;
}

export function ClassifyButton({ 
  publicCaseId, 
  title, 
  content,
  onClassified 
}: ClassifyButtonProps) {
  const [loading, setLoading] = useState(false);
  
  const handleClassify = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicCaseId,
          title,
          content,
          autoUpdate: true,
        }),
      });
      
      if (!response.ok) throw new Error('Classification failed');
      
      const result = await response.json();
      
      // Simple notification
      alert(`分類成功！案例已分類為: ${result.data.category}`);
      
      onClassified?.(result.data);
    } catch (error) {
      alert('分類失敗，請稍後再試');
      console.error('Classification error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <PremierButton
      variant="primary"
      size="sm"
      icon={loading ? Loader2 : Sparkles}
      onClick={handleClassify}
      disabled={loading}
    >
      {loading ? 'AI 分類中...' : 'AI 智能分類'}
    </PremierButton>
  );
}
