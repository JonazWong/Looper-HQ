'use client'

/**
 * MembershipPlans — interactive pricing cards with inline Airwallex Drop-in.
 * Clicking a paid plan card triggers a Payment Intent API call and expands
 * the Drop-in UI below the card with a smooth height animation.
 */
import { useState } from 'react'
import { CheckCircle2, ArrowRight, Loader2, X } from 'lucide-react'
import { PaymentDropIn } from './PaymentDropIn'

interface Plan {
  id: string
  tier: string
  name_zh: string
  name_en: string
  description_zh: string | null
  description_en: string | null
  amount: number | null
  currency: string
  isCustom: boolean
  features_zh: string[]
  features_en: string[]
}

interface MembershipPlansProps {
  plans: Plan[]
  locale: string
}

type IntentData = {
  intentId: string
  clientSecret: string
  amount: number
  currency: string
}

export function MembershipPlans({ plans, locale }: MembershipPlansProps) {
  const isEn = locale === 'en'
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [intentData, setIntentData] = useState<IntentData | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorTier, setErrorTier] = useState<string | null>(null)  // which card errored

  async function handleSelectPlan(plan: Plan) {
    // Enterprise / custom plan — redirect to contact
    if (plan.isCustom || plan.amount === null) {
      window.location.href = `/${locale}/contact`
      return
    }

    // Free tier — redirect to register
    if (plan.amount === 0 || plan.tier === 'BASIC') {
      window.location.href = `/${locale}/register`
      return
    }

    // Toggle off if already selected
    if (selectedTier === plan.tier) {
      setSelectedTier(null)
      setIntentData(null)
      setError(null)
      setErrorTier(null)
      return
    }

    setLoading(plan.tier)
    setError(null)
    setErrorTier(null)
    setSelectedTier(null)
    setIntentData(null)

    try {
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planTier: plan.tier }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        if (res.status === 401) {
          window.location.href = `/${locale}/login?callbackUrl=/${locale}`
          return
        }
        throw new Error(json.error?.message ?? '無法建立付款，請稍後再試')
      }

      if (!json.data?.clientSecret) {
        throw new Error('伺服器未返回付款密鑰，請稍後再試')
      }

      setIntentData({
        intentId: json.data.intentId,
        clientSecret: json.data.clientSecret as string,
        amount: json.data.amount,
        currency: json.data.currency,
      })
      setSelectedTier(plan.tier)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '發生錯誤，請重試'
      setError(msg)
      setErrorTier(plan.tier)   // ← track which card failed
    } finally {
      setLoading(null)
    }
  }

  function handleCloseDropIn() {
    setSelectedTier(null)
    setIntentData(null)
    setError(null)
    setErrorTier(null)
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
      {plans.map((plan) => {
        const isSelected = selectedTier === plan.tier
        const isLoading = loading === plan.tier
        const isFree = plan.amount === null && !plan.isCustom ? false : plan.amount === 0 || plan.tier === 'BASIC'
        const isPaid = plan.amount !== null && plan.amount > 0
        const isEnterprise = plan.isCustom

        const cardVariantClass = plan.tier === 'PREMIUM'
          ? 'border-2 border-premier-gold/30 shadow-lg shadow-premier-gold/10'
          : plan.tier === 'PREMIER'
          ? 'border border-premier-mystery-violet/30'
          : 'border border-premier-pearl/10'

        const cardSelectedClass = isSelected
          ? 'ring-2 ring-premier-gold/60'
          : ''

        return (
          <div key={plan.tier} className="flex flex-col">
            {/* Plan Card */}
            <div
              className={`glass-card rounded-premier-lg p-6 flex flex-col transition-all duration-200 ${cardVariantClass} ${cardSelectedClass} hover:shadow-lg hover:shadow-premier-gold/10`}
            >
              {plan.tier === 'PREMIUM' && (
                <div className="text-xs font-semibold text-premier-gold uppercase tracking-wider mb-1">
                  {isEn ? 'Most Popular' : '最受歡迎'}
                </div>
              )}

              <h3 className="text-xl font-bold text-premier-pearl mb-1">
                {isEn ? plan.name_en : plan.name_zh}
              </h3>

              <div className="text-3xl font-bold mt-3 mb-1">
                {plan.amount === null && !plan.isCustom ? (
                  <span className="text-premier-pearl">{isEn ? 'Free' : '免費'}</span>
                ) : plan.isCustom || plan.amount === null ? (
                  <span className="text-premier-mystery-violet">{isEn ? 'Custom' : '按需報價'}</span>
                ) : (
                  <span className={plan.tier === 'PREMIUM' ? 'text-premier-gold' : 'text-premier-pearl'}>
                    HK${plan.amount.toLocaleString()}
                    <span className="text-base font-normal text-premier-pearl-gray">
                      /{isEn ? 'mo' : '月'}
                    </span>
                  </span>
                )}
              </div>

              <p className="text-sm text-premier-pearl/50 mb-4">
                {isEn ? plan.description_en : plan.description_zh}
              </p>

              {/* Features */}
              <ul className="space-y-1.5 mb-6 flex-1">
                {(isEn ? plan.features_en : plan.features_zh).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-premier-pearl-gray">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${plan.tier === 'PREMIER' ? 'text-premier-mystery-violet' : 'text-premier-gold'}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {isFree ? (
                <a
                  href={`/${locale}/case-search`}
                  className="flex w-full items-center justify-center gap-2 rounded-premier-sm border border-premier-pearl/20 bg-transparent px-4 py-3 text-sm font-semibold text-premier-pearl transition-all hover:border-premier-gold/30 hover:bg-premier-gold/10"
                >
                  {isEn ? 'Try Now' : '立即體驗'}
                </a>
              ) : isEnterprise ? (
                <a
                  href={`/${locale}/contact`}
                  className="flex w-full items-center justify-center gap-2 rounded-premier-sm border border-premier-mystery-violet/40 bg-transparent px-4 py-3 text-sm font-semibold text-premier-mystery-violet transition-all hover:bg-premier-mystery-violet/10"
                >
                  {isEn ? 'Contact Us' : '聯絡我們'}
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : (
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isLoading}
                  className={`flex w-full items-center justify-center gap-2 rounded-premier-sm px-4 py-3 text-sm font-semibold transition-all disabled:opacity-70 ${
                    plan.tier === 'PREMIUM'
                      ? 'bg-gradient-to-r from-premier-gold to-premier-gold-rose text-premier-black hover:shadow-lg hover:shadow-premier-gold/30'
                      : 'border border-premier-pearl/20 bg-transparent text-premier-pearl hover:border-premier-gold/30 hover:bg-premier-gold/10'
                  } ${isSelected ? 'opacity-80' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isEn ? 'Loading...' : '載入中…'}
                    </>
                  ) : isSelected ? (
                    <>
                      <X className="h-4 w-4" />
                      {isEn ? 'Close' : '關閉'}
                    </>
                  ) : (
                    <>
                      {isEn ? 'Subscribe' : '立即訂閱'}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Inline Drop-in — expands below the card */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                isSelected && intentData ? 'max-h-[800px] opacity-100 mt-2' : 'max-h-0 opacity-0'
              }`}
            >
              {isSelected && intentData && (
                <div className="glass-card rounded-premier-lg border border-premier-gold/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-premier-gold">
                      {isEn ? 'Complete Payment' : '完成付款'}
                      {' — '}
                      HK${intentData.amount.toLocaleString()}/{ isEn ? 'month' : '月'}
                    </p>
                    <button
                      onClick={handleCloseDropIn}
                      className="text-premier-pearl/40 hover:text-premier-pearl transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <PaymentDropIn
                    intentId={intentData.intentId}
                    clientSecret={intentData.clientSecret}
                    currency={intentData.currency}
                    locale={locale === 'en' ? 'en' : 'zh-HK'}
                    onSuccess={() => {
                      // Keep showing success state; don't auto-close
                    }}
                    onError={() => setError(isEn ? 'Payment failed. Please try again.' : '付款失敗，請重試')}
                    onClose={handleCloseDropIn}
                  />
                </div>
              )}
            </div>

            {/* Error panel — shown inline below the card when API call fails */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                errorTier === plan.tier && error ? 'max-h-[200px] opacity-100 mt-2' : 'max-h-0 opacity-0'
              }`}
            >
              {errorTier === plan.tier && error && (
                <div className="glass-card rounded-premier-lg border border-red-500/30 bg-red-500/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 text-lg">⚠️</span>
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                    <button
                      onClick={handleCloseDropIn}
                      className="text-premier-pearl/40 hover:text-premier-pearl transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {error.includes('登入') || error.includes('login') || error.includes('Unauthorized') ? (
                    <a
                      href={`/${locale}/login`}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-premier-sm border border-premier-gold/30 bg-premier-gold/10 px-4 py-2 text-sm font-semibold text-premier-gold transition-all hover:bg-premier-gold/20"
                    >
                      {isEn ? 'Log in to continue' : '登入後繼續'}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
