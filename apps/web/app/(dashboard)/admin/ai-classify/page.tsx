'use client';

import { useState } from 'react';
import { Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { PremierButton } from '@/components/ui/premier-button';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';

export default function AIClassifyPage() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const handleBatchClassify = async () => {
    setProcessing(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/ai/batch-classify', {
        method: 'POST',
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Batch classification error:', error);
      setResult({
        success: false,
        error: 'Failed to process batch classification'
      });
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-gold">
            AI 智能批量分類
          </h1>
          <p className="text-premier-pearl-gray mt-2">
            自動分類未分類的法律案例
          </p>
        </div>
        
        <PremierButton
          variant="primary"
          icon={processing ? Loader2 : Sparkles}
          onClick={handleBatchClassify}
          disabled={processing}
        >
          {processing ? '處理中...' : '開始批量分類'}
        </PremierButton>
      </div>
      
      {result && (
        <GlassCard variant="gold" glow>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              {result.success ? '分類完成' : '分類失敗'}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {result.success ? (
              <div className="space-y-2 text-premier-pearl-gray">
                <p>✅ 已處理: {result.processed} 個案例</p>
                <p>📊 總計: {result.total} 個待分類案例</p>
                <p className="text-sm text-premier-pearl-gray/70 mt-4">
                  {result.message}
                </p>
              </div>
            ) : (
              <div className="text-red-400">
                <p>❌ 錯誤: {result.error || '未知錯誤'}</p>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}
