'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, Loader2, CheckCircle } from 'lucide-react'
import { PremierButton } from '@/components/ui/premier-button'
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card'

export default function AIClassifyPage() {
  const t = useTranslations('admin.aiClassify')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  const handleBatchClassify = async () => {
    setProcessing(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/ai/batch-classify', {
        method: 'POST',
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Batch classification error:', error)
      setResult({
        success: false,
        error: t('result.errorFallback'),
      })
    } finally {
      setProcessing(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-gold">
            {t('title')}
          </h1>
          <p className="text-premier-pearl-gray mt-2">
            {t('description')}
          </p>
        </div>
        
        <PremierButton
          variant="primary"
          icon={processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          onClick={handleBatchClassify}
          disabled={processing}
        >
          {processing ? t('button.processing') : t('button.start')}
        </PremierButton>
      </div>
      
      {result && (
        <GlassCard variant="gold" glow>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              {result.success ? t('result.success') : t('result.failure')}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {result.success ? (
              <div className="space-y-2 text-premier-pearl-gray">
                <p>✅ {t('result.processed', { count: result.processed })}</p>
                <p>📊 {t('result.total', { count: result.total })}</p>
                <p className="text-sm text-premier-pearl-gray/70 mt-4">
                  {result.message}
                </p>
              </div>
            ) : (
              <div className="text-red-400">
                <p>❌ {t('result.error')} {result.error || t('result.unknownError')}</p>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  )
}
