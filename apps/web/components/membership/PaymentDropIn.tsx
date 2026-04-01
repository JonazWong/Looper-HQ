'use client'

/**
 * PaymentDropIn — wraps the Airwallex Drop-in payment element.
 * Uses the `dropIn` element type from @airwallex/components-sdk.
 * Initialises the SDK once, creates the element, and mounts it inline.
 */
import { useEffect, useRef, useState } from 'react'

type AirwallexLocale = 'en' | 'zh' | 'zh-HK' | 'ja' | 'ko' | 'ar' | 'fr' | 'es' | 'de' | 'it'

interface PaymentDropInProps {
  intentId: string
  clientSecret: string
  currency?: string
  locale?: AirwallexLocale
  onSuccess?: () => void
  onError?: (error: unknown) => void
  onClose?: () => void
}

export function PaymentDropIn({
  intentId,
  clientSecret,
  currency = 'HKD',
  locale = 'zh-HK',
  onSuccess,
  onError,
  onClose,
}: PaymentDropInProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!intentId || !clientSecret || mountedRef.current) return

    const env = (process.env.NEXT_PUBLIC_AIRWALLEX_ENV ?? 'demo') as 'demo' | 'prod' | 'staging'
    const containerId = `airwallex-drop-in-${intentId.replace(/[^a-zA-Z0-9-]/g, '')}`

    async function mount() {
      try {
        const { init, createElement } = await import('@airwallex/components-sdk')

        await init({ env, locale, enabledElements: ['dropIn'] })

        if (!containerRef.current) return
        containerRef.current.id = containerId

        // createElement returns a Promise for dropIn
        const element = await createElement('dropIn', {
          client_secret: clientSecret,
          currency,
          intent_id: intentId,
          appearance: {
            mode: 'dark',
          },
        } as Parameters<typeof createElement<'dropIn'>>[1])

        await element.mount(`#${containerId}`)
        mountedRef.current = true
        setStatus('ready')

        element.on('success', () => {
          setStatus('success')
          onSuccess?.()
        })

        element.on('error', (event: unknown) => {
          const msg = (event as { message?: string })?.message ?? '付款失敗，請重試'
          setStatus('error')
          setErrorMessage(msg)
          onError?.(event)
        })

        element.on('cancel', () => {
          onClose?.()
        })
      } catch (err) {
        console.error('[PaymentDropIn] mount error:', err)
        setStatus('error')
        setErrorMessage('無法載入付款介面，請重新整理頁面')
        onError?.(err)
      }
    }

    mount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intentId, clientSecret])

  if (status === 'success') {
    return (
      <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <p className="font-semibold text-emerald-400 text-lg">付款成功！</p>
        <p className="text-sm text-premier-pearl/60 mt-1">
          您的會員等級正在更新，請稍候片刻後重新整理頁面。
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-center">
        <div className="text-4xl mb-3">❌</div>
        <p className="font-semibold text-red-400 text-lg">付款失敗</p>
        <p className="text-sm text-premier-pearl/60 mt-1">{errorMessage}</p>
      </div>
    )
  }

  return (
    <div className="mt-4">
      {status === 'loading' && (
        <div className="flex items-center justify-center py-8 text-premier-pearl/60 text-sm gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-premier-gold border-t-transparent" />
          正在載入付款介面…
        </div>
      )}
      {/* Airwallex mounts the iframe into this div */}
      <div ref={containerRef} className="min-h-[200px]" />
    </div>
  )
}
