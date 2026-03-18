'use client'

import { Check, Sparkles, Crown, Building2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const tiers = [
  {
    id: 'basic',
    name: '基本版',
    nameEn: 'Basic',
    price: '免費',
    priceEn: 'Free',
    icon: Sparkles,
    color: 'text-blue-400',
    popular: false,
    features: [
      '每日10次搜尋',
      '基本案件資訊查閱',
      '公開判決書瀏覽',
      '新聞整合閱讀',
    ],
    limitations: [
      '無法下載文件',
      '無法生成證明書',
      '不包含API訪問',
    ],
  },
  {
    id: 'professional',
    name: '專業版',
    nameEn: 'Professional',
    price: 'HK$299/月',
    priceEn: 'HK$299/mo',
    icon: Crown,
    color: 'text-purple-400',
    popular: false,
    features: [
      '每日100次搜尋',
      '完整案件詳情',
      '判決書下載',
      '基本證明書生成',
      '電郵通知訂閱',
    ],
    limitations: [
      '每月5份證明書限額',
      '標準客服支援',
    ],
  },
  {
    id: 'premium',
    name: '高端版',
    nameEn: 'Premium',
    price: 'HK$799/月',
    priceEn: 'HK$799/mo',
    icon: Crown,
    color: 'text-premier-gold',
    popular: true,
    features: [
      '無限次搜尋',
      '完整案件及法官資料',
      '批量下載功能',
      '無限證明書生成',
      '優先數據更新',
      'API訪問權限',
      '專屬客戶經理',
    ],
    limitations: [],
  },
  {
    id: 'enterprise',
    name: '企業版',
    nameEn: 'Enterprise',
    price: '聯繫我們',
    priceEn: 'Contact Us',
    icon: Building2,
    color: 'text-emerald-400',
    popular: false,
    features: [
      '所有高端版功能',
      '批量數據導出',
      '自定義API配額',
      'SLA服務保證',
      '專屬技術支援',
      '定制數據分析',
      '多用戶管理',
    ],
    limitations: [],
  },
]

export default function MembershipPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-premier-black via-premier-black-light to-premier-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-premier-gold/10 via-transparent to-transparent" />
        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-premier-gold/30 bg-premier-gold/10 px-4 py-2 text-sm text-premier-gold">
              <Crown className="h-4 w-4" />
              <span>尊享服務</span>
            </div>
            <h1 className="mb-4 text-4xl font-bold text-premier-pearl md:text-5xl">
              會員方案
            </h1>
            <p className="text-lg text-premier-pearl/60">
              選擇最適合您需求的專業法律資訊服務方案
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => {
              const Icon = tier.icon
              return (
                <div
                  key={tier.id}
                  className={`glass-card relative flex flex-col rounded-premier-lg border p-6 transition-all hover:shadow-lg hover:shadow-premier-gold/10 ${
                    tier.popular
                      ? 'border-premier-gold/40 shadow-lg shadow-premier-gold/10'
                      : 'border-premier-pearl/10 hover:border-premier-gold/20'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-gradient-to-r from-premier-gold to-premier-gold-rose px-4 py-1 text-xs font-semibold text-premier-black shadow-lg">
                        最受歡迎
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-6">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-premier-sm bg-premier-gold/10 ${tier.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-1 text-xl font-bold text-premier-pearl">
                      {tier.name}
                    </h3>
                    <p className="text-sm text-premier-pearl/50">{tier.nameEn}</p>
                    <p className="mt-4 text-3xl font-bold text-premier-pearl">
                      {tier.price}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="mb-6 flex-1 space-y-4">
                    <div>
                      <p className="mb-2 text-sm font-semibold text-premier-gold/80">功能特色</p>
                      <ul className="space-y-2">
                        {tier.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-premier-gold" />
                            <span className="text-premier-pearl/70">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {tier.limitations.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-semibold text-premier-pearl/50">限制</p>
                        <ul className="space-y-2">
                          {tier.limitations.map((limitation, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-premier-pearl/40">
                              <span className="mt-0.5 h-4 w-4 flex-shrink-0 text-center">•</span>
                              <span>{limitation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <div>
                    {tier.id === 'basic' ? (
                      <Link
                        href="/register"
                        className="flex w-full items-center justify-center gap-2 rounded-premier-sm bg-gradient-to-r from-premier-gold to-premier-gold-rose px-4 py-3 font-semibold text-premier-black transition-all hover:shadow-lg hover:shadow-premier-gold/30"
                      >
                        免費註冊
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : tier.id === 'enterprise' ? (
                      <Link
                        href="/contact"
                        className="flex w-full items-center justify-center gap-2 rounded-premier-sm border border-premier-gold/30 bg-transparent px-4 py-3 font-semibold text-premier-gold transition-all hover:bg-premier-gold/10"
                      >
                        聯繫我們
                      </Link>
                    ) : (
                      <button
                        className={`flex w-full items-center justify-center gap-2 rounded-premier-sm px-4 py-3 font-semibold transition-all ${
                          tier.popular
                            ? 'bg-gradient-to-r from-premier-gold to-premier-gold-rose text-premier-black hover:shadow-lg hover:shadow-premier-gold/30'
                            : 'border border-premier-pearl/20 bg-transparent text-premier-pearl hover:border-premier-gold/30 hover:bg-premier-gold/10'
                        }`}
                        onClick={() => alert(`請聯繫客服升級至${tier.name}`)}
                      >
                        立即升級
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Enterprise CTA */}
          <div className="mt-16">
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-8 text-center">
              <h3 className="mb-4 text-2xl font-bold text-premier-pearl">
                需要企業定制方案？
              </h3>
              <p className="mb-6 text-premier-pearl/60">
                我們為保險公司、承保人及官方機構提供專屬的數據購買方案，
                包括批量數據導出、API接口訪問及自定義數據分析服務。
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-premier-sm border border-premier-gold/30 bg-transparent px-8 py-3 font-semibold text-premier-gold transition-all hover:bg-premier-gold/10"
              >
                聯繫銷售團隊
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h3 className="mb-8 text-center text-2xl font-bold text-premier-pearl">
              常見問題
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  q: '如何升級會員方案？',
                  a: '登入後在帳戶設置中選擇「升級方案」，按指示完成付款即可即時生效。',
                },
                {
                  q: '可以隨時取消訂閱嗎？',
                  a: '可以。您可以隨時在帳戶設置中取消訂閱，取消後將不會自動續費，但當前付費週期內仍可使用。',
                },
                {
                  q: '支援哪些付款方式？',
                  a: '我們支援信用卡（Visa、MasterCard）、PayMe、FPS 及銀行轉帳等多種付款方式。',
                },
                {
                  q: '企業版有哪些額外優惠？',
                  a: '企業版提供多用戶折扣、專屬技術支援及可協商的服務級別協議（SLA），詳情請與銷售團隊聯繫。',
                },
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6"
                >
                  <h4 className="mb-2 font-semibold text-premier-pearl">{faq.q}</h4>
                  <p className="text-sm text-premier-pearl/60">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
