import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Scale, Target, Users, TrendingUp, Shield, Award } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: '關於我們 | Looper HQ',
  description: '了解 Looper HQ 香港法律案件管理平台的使命、願景和核心價值觀',
}

const features = [
  {
    icon: Scale,
    title_zh: '專業可靠',
    title_en: 'Professional & Reliable',
    description_zh: '基於公開法律資料庫，提供準確可靠的案件資訊查詢服務',
    description_en: 'Accurate and reliable case information based on public legal databases',
  },
  {
    icon: Shield,
    title_zh: '安全保密',
    title_en: 'Secure & Confidential',
    description_zh: '採用銀行級加密技術，確保用戶資料和查詢記錄的安全性',
    description_en: 'Bank-level encryption to ensure security of user data and query records',
  },
  {
    icon: TrendingUp,
    title_zh: '及時更新',
    title_en: 'Real-time Updates',
    description_zh: '每日自動收集最新案件資訊，確保資料庫保持最新狀態',
    description_en: 'Daily automatic collection of latest case information',
  },
  {
    icon: Award,
    title_zh: '專業團隊',
    title_en: 'Expert Team',
    description_zh: '由資深法律專業人士和技術專家組成的團隊提供支援',
    description_en: 'Support from senior legal professionals and technical experts',
  },
]

const milestones = [
  {
    year: '2023',
    title_zh: '系統啟動',
    title_en: 'System Launch',
    description_zh: '香港法律案件查詢系統正式上線，開始為用戶提供專業服務',
    description_en: 'Hong Kong legal case system officially launched',
  },
  {
    year: '2024',
    title_zh: '功能擴展',
    title_en: 'Feature Expansion',
    description_zh: '新增案件分析、文件生成等進階功能，服務範圍全面提升',
    description_en: 'Added case analysis, document generation and advanced features',
  },
  {
    year: '2025',
    title_zh: 'AI 智能整合',
    title_en: 'AI Integration',
    description_zh: '引入 AI 智能分析，提供更深入的法律案例研究服務',
    description_en: 'Introduced AI-powered analysis for in-depth legal case research',
  },
  {
    year: '未來',
    title_zh: '持續創新',
    title_en: 'Continuous Innovation',
    description_zh: '持續優化平台功能，拓展更多法律科技應用場景',
    description_en: 'Continuously optimizing platform features and expanding legal tech applications',
  },
]

const values = [
  {
    title_zh: '專業性',
    title_en: 'Professionalism',
    description_zh: '堅持提供專業、準確的法律案件資訊，協助用戶做出明智決策',
    description_en: 'Committed to providing professional and accurate legal case information',
  },
  {
    title_zh: '透明度',
    title_en: 'Transparency',
    description_zh: '清晰透明的服務條款和定價，讓用戶明確了解所獲得的服務',
    description_en: 'Clear and transparent terms of service and pricing',
  },
  {
    title_zh: '創新性',
    title_en: 'Innovation',
    description_zh: '持續創新技術和服務，為用戶提供更優質的使用體驗',
    description_en: 'Continuous innovation in technology and services',
  },
  {
    title_zh: '責任感',
    title_en: 'Responsibility',
    description_zh: '嚴格遵守法律法規，保護用戶隱私，承擔社會責任',
    description_en: 'Strictly comply with laws and regulations, protect user privacy',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-premier-black to-premier-black-light">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-premier-gold/20 bg-premier-gold/10 px-4 py-2 text-sm text-premier-gold">
            <Users className="h-4 w-4" />
            <span>關於我們</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-premier-pearl">關於我們</h1>
          <p className="text-premier-pearl-gray">About Us</p>
        </div>

        {/* Mission */}
        <Card className="mb-8 glass-card border-premier-gold/20">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-premier-gold/10 p-4 mt-1">
                <Target className="h-8 w-8 text-premier-gold" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-4 text-premier-pearl">我們的使命</h2>
                <p className="text-lg text-premier-pearl-gray leading-relaxed mb-4">
                  Looper HQ 致力於為香港法律專業人士、企業及保險機構提供全面、
                  準確、及時的法律案件資訊管理平台。
                </p>
                <p className="text-lg text-premier-pearl-gray leading-relaxed">
                  我們相信，透過提供智能化的案件管理工具，能夠協助用戶更好地了解香港法律環境，
                  做出更明智的商業決策，並有效管理法律風險。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center text-premier-pearl">核心優勢</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={index}
                  className="group glass-card border-premier-gold/10 transition-all hover:border-premier-gold/30 hover:shadow-premier-glow-sm"
                >
                  <CardHeader>
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-premier-gold/10 text-premier-gold group-hover:bg-premier-gold/20 transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl text-premier-pearl">{feature.title_zh}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-premier-pearl-gray">{feature.description_zh}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Milestones */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center text-premier-pearl">發展歷程</h2>
          <div className="space-y-6">
            {milestones.map((milestone, index) => (
              <Card
                key={index}
                className="glass-card border-premier-gold/10 transition-all hover:border-premier-gold/20"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-premier-gold/10 text-premier-gold font-bold">
                        {milestone.year}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold mb-2 text-premier-pearl">{milestone.title_zh}</h3>
                      <p className="text-premier-pearl-gray">{milestone.description_zh}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center text-premier-pearl">核心價值觀</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {values.map((value, index) => (
              <Card
                key={index}
                className="glass-card border-premier-gold/10 transition-all hover:border-premier-gold/20 hover:shadow-premier-glow-sm"
              >
                <CardHeader>
                  <CardTitle className="text-xl text-premier-pearl">{value.title_zh}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-premier-pearl-gray">{value.description_zh}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Service Targets */}
        <Card className="mb-8 glass-card border-premier-gold/10">
          <CardHeader>
            <CardTitle className="text-2xl text-premier-pearl">服務對象</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <h3 className="font-semibold text-lg mb-2 text-premier-gold">企業用戶</h3>
                <p className="text-sm text-premier-pearl-gray">
                  協助企業進行商業盡職調查，了解合作夥伴或目標公司的訴訟風險，
                  做出更明智的商業決策。
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-premier-gold">法律專業人士</h3>
                <p className="text-sm text-premier-pearl-gray">
                  為律師、法律顧問提供便捷的案例查詢服務，
                  快速檢索相關法律案例，提升工作效率。
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-premier-gold">金融保險機構</h3>
                <p className="text-sm text-premier-pearl-gray">
                  協助保險公司、承保人進行風險評估，
                  提供批量數據分析服務，支援業務決策。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Sources */}
        <Card className="mb-8 glass-card border-premier-gold/10">
          <CardHeader>
            <CardTitle className="text-2xl text-premier-pearl">資料來源</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-premier-pearl-gray mb-4">
              我們的案件資料主要來源於以下公開渠道：
            </p>
            <ul className="list-disc list-inside space-y-2 text-premier-pearl-gray ml-4">
              <li>香港法律資訊網站（Hong Kong Legal Information Institute - HKLII）</li>
              <li>香港司法機構官方網站</li>
              <li>主要新聞媒體的法律版面報導</li>
              <li>法院公告及判決書</li>
            </ul>
            <p className="text-premier-pearl-gray mt-4">
              我們的系統每日自動收集和更新案件資訊，並經過專業團隊的驗證和整理，
              確保提供給用戶的資料準確可靠。
            </p>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="border-premier-gold/30 bg-gradient-to-br from-premier-gold/10 to-premier-mystery-violet/10">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4 text-premier-pearl">加入我們</h2>
              <p className="text-lg text-premier-pearl-gray mb-6">
                立即註冊成為會員，體驗專業的法律案件管理服務
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button asChild className="bg-premier-gold hover:bg-premier-gold-rose text-premier-black">
                  <Link href="/membership">查看會員方案</Link>
                </Button>
                <Button asChild variant="outline" className="border-premier-gold/30 text-premier-gold hover:bg-premier-gold/10">
                  <Link href="/contact">聯絡我們</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
