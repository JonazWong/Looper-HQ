import Link from 'next/link'
import { Shield, Lock, Eye, Database, Clock, UserCog, Cookie, Users, Globe, RefreshCw, Mail } from 'lucide-react'

export const metadata = {
  title: '私隱政策 | Privacy Policy',
  description: '了解我們如何收集、使用及保護您的個人資料',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-premier-black via-premier-black-light to-premier-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-premier-gold/10 via-transparent to-transparent" />
        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-premier-gold/30 bg-premier-gold/10 px-4 py-2 text-sm text-premier-gold">
              <Shield className="h-4 w-4" />
              <span>隱私保護</span>
            </div>
            <h1 className="mb-4 text-4xl font-bold text-premier-pearl md:text-5xl">
              私隱政策
            </h1>
            <p className="mb-2 text-lg text-premier-pearl/60">Privacy Policy</p>
            <p className="text-sm text-premier-pearl/40">最後更新：2024年1月</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="space-y-8">
            {/* Introduction */}
            <div className="glass-card rounded-premier-lg border border-premier-gold/30 bg-premier-gold/5 p-6">
              <p className="text-premier-pearl/80">
                香港法律案件查詢系統（以下簡稱「本系統」）致力保護用戶的私隱。
                本私隱政策說明我們如何收集、使用、披露和保護您的個人資料。
                本政策符合香港《個人資料（私隱）條例》（第486章）的要求。
              </p>
            </div>

            {/* Section 1 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <Database className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">1. 收集的個人資料</h2>
              </div>
              <p className="mb-4 font-medium text-premier-gold/80">我們可能收集以下類型的個人資料：</p>
              
              <div className="space-y-4 text-premier-pearl/70">
                <div>
                  <p className="mb-2 font-medium text-premier-pearl/90">1.1 帳戶資料</p>
                  <ul className="ml-6 list-disc space-y-1">
                    <li>姓名</li>
                    <li>電郵地址</li>
                    <li>電話號碼</li>
                    <li>公司名稱（如適用）</li>
                    <li>登入憑證</li>
                  </ul>
                </div>

                <div>
                  <p className="mb-2 font-medium text-premier-pearl/90">1.2 使用資料</p>
                  <ul className="ml-6 list-disc space-y-1">
                    <li>搜尋查詢記錄</li>
                    <li>瀏覽的案件資訊</li>
                    <li>生成的文件記錄</li>
                    <li>登入時間和頻率</li>
                  </ul>
                </div>

                <div>
                  <p className="mb-2 font-medium text-premier-pearl/90">1.3 技術資料</p>
                  <ul className="ml-6 list-disc space-y-1">
                    <li>IP地址</li>
                    <li>瀏覽器類型和版本</li>
                    <li>設備資訊</li>
                    <li>Cookie及類似技術收集的資料</li>
                  </ul>
                </div>

                <div>
                  <p className="mb-2 font-medium text-premier-pearl/90">1.4 付款資料</p>
                  <ul className="ml-6 list-disc space-y-1">
                    <li>信用卡資料（通過第三方支付處理商處理，我們不直接儲存完整的信用卡資料）</li>
                    <li>交易記錄</li>
                    <li>帳單地址</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <Eye className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">2. 個人資料的使用目的</h2>
              </div>
              <p className="mb-4 text-premier-pearl/70">我們收集和使用您的個人資料用於以下目的：</p>
              <ul className="ml-6 list-disc space-y-2 text-premier-pearl/70">
                <li>提供、維護和改善我們的服務</li>
                <li>處理您的註冊和管理您的帳戶</li>
                <li>驗證您的身份和會員等級</li>
                <li>處理付款和防止欺詐</li>
                <li>回應您的查詢和提供客戶支援</li>
                <li>發送服務通知、更新和管理訊息</li>
                <li>進行數據分析以改善用戶體驗</li>
                <li>遵守法律義務和保護我們的合法權益</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <Users className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">3. 個人資料的披露</h2>
              </div>
              <p className="mb-4 text-premier-pearl/70">我們可能在以下情況下披露您的個人資料：</p>
              
              <div className="space-y-4 text-premier-pearl/70">
                <div>
                  <p className="font-medium text-premier-pearl/90">3.1 服務提供商</p>
                  <p className="ml-4 mt-1">
                    我們可能與協助我們提供服務的第三方服務提供商分享資料，
                    包括雲端存儲、支付處理、數據分析和客戶支援服務。
                  </p>
                </div>
                <div>
                  <p className="font-medium text-premier-pearl/90">3.2 法律要求</p>
                  <p className="ml-4 mt-1">
                    當法律要求或為保護我們的權利、財產或安全，或他人的權利、財產或安全時，
                    我們可能披露您的資料。
                  </p>
                </div>
                <div>
                  <p className="font-medium text-premier-pearl/90">3.3 業務轉讓</p>
                  <p className="ml-4 mt-1">
                    在合併、收購或資產出售的情況下，您的個人資料可能被轉讓。
                    我們會在轉讓前通知您。
                  </p>
                </div>
                <div>
                  <p className="font-medium text-premier-pearl/90">3.4 經您同意</p>
                  <p className="ml-4 mt-1">
                    在其他情況下，我們會在獲得您的同意後才披露您的個人資料。
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <Lock className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">4. 數據安全</h2>
              </div>
              <p className="mb-4 text-premier-pearl/70">
                我們採取適當的技術和組織措施來保護您的個人資料，防止未經授權的訪問、
                披露、修改或破壞。這些措施包括：
              </p>
              <ul className="ml-6 list-disc space-y-2 text-premier-pearl/70">
                <li>加密傳輸和存儲敏感資料</li>
                <li>定期安全評估和漏洞測試</li>
                <li>限制只有授權人員可以訪問個人資料</li>
                <li>實施嚴格的存取控制和身份驗證機制</li>
                <li>定期備份數據以防止數據丟失</li>
              </ul>
              <p className="mt-4 text-sm text-premier-pearl/50">
                然而，請注意沒有任何數據傳輸或存儲系統可以保證100%安全。
                如果您有理由相信您的帳戶安全受到威脅，請立即通知我們。
              </p>
            </div>

            {/* Section 5 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <Clock className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">5. 數據保留</h2>
              </div>
              <p className="mb-4 text-premier-pearl/70">
                我們只會在實現收集目的所需的期間內保留您的個人資料，
                或在法律要求的期間內保留。具體保留期如下：
              </p>
              <ul className="ml-6 list-disc space-y-2 text-premier-pearl/70">
                <li>帳戶資料：帳戶有效期內及關閉後7年</li>
                <li>交易記錄：交易完成後7年</li>
                <li>搜尋記錄：2年</li>
                <li>技術日誌：1年</li>
              </ul>
              <p className="mt-4 text-premier-pearl/70">
                在保留期屆滿後，我們會安全地刪除或匿名化您的個人資料。
              </p>
            </div>

            {/* Section 6 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <UserCog className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">6. 您的權利</h2>
              </div>
              <p className="mb-4 text-premier-pearl/70">根據《個人資料（私隱）條例》，您享有以下權利：</p>
              <ul className="ml-6 list-disc space-y-2 text-premier-pearl/70">
                <li><span className="font-medium text-premier-pearl/90">查閱權：</span>您有權查閱我們持有的關於您的個人資料</li>
                <li><span className="font-medium text-premier-pearl/90">更正權：</span>您有權要求更正不準確的個人資料</li>
                <li><span className="font-medium text-premier-pearl/90">刪除權：</span>在某些情況下，您有權要求刪除您的個人資料</li>
                <li><span className="font-medium text-premier-pearl/90">限制處理權：</span>在某些情況下，您有權要求限制處理您的個人資料</li>
                <li><span className="font-medium text-premier-pearl/90">反對權：</span>您有權反對處理您的個人資料</li>
                <li><span className="font-medium text-premier-pearl/90">數據可攜權：</span>您有權以結構化、常用和機器可讀的格式接收您的個人資料</li>
              </ul>
              <p className="mt-4 text-premier-pearl/70">
                如欲行使上述權利，請透過<Link href="/contact" className="text-premier-gold hover:underline">聯絡我們</Link>頁面與我們聯絡。
                我們會在30天內回應您的請求。
              </p>
            </div>

            {/* Section 7 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <Cookie className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">7. Cookie 政策</h2>
              </div>
              <p className="mb-4 text-premier-pearl/70">
                我們使用Cookie和類似技術來改善用戶體驗、分析網站使用情況和提供個性化內容。
              </p>
              <p className="mb-2 font-medium text-premier-pearl/90">我們使用以下類型的Cookie：</p>
              <ul className="ml-6 list-disc space-y-2 text-premier-pearl/70">
                <li><span className="font-medium text-premier-pearl/90">必要Cookie：</span>這些Cookie對網站運作至關重要，無法關閉</li>
                <li><span className="font-medium text-premier-pearl/90">功能Cookie：</span>這些Cookie用於記住您的偏好設置</li>
                <li><span className="font-medium text-premier-pearl/90">分析Cookie：</span>這些Cookie幫助我們了解訪客如何使用網站</li>
              </ul>
              <p className="mt-4 text-premier-pearl/70">
                您可以通過瀏覽器設置管理Cookie偏好。但請注意，禁用某些Cookie可能影響網站功能。
              </p>
            </div>

            {/* Section 8 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <Users className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">8. 兒童隱私</h2>
              </div>
              <p className="text-premier-pearl/70">
                本系統不針對18歲以下的兒童。我們不會故意收集18歲以下兒童的個人資料。
                如果您是家長或監護人，並發現您的孩子向我們提供了個人資料，請聯絡我們，
                我們將採取措施刪除該資料。
              </p>
            </div>

            {/* Section 9 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <Globe className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">9. 跨境數據傳輸</h2>
              </div>
              <p className="text-premier-pearl/70">
                您的個人資料可能被傳輸到香港特別行政區以外的地區進行處理和存儲。
                我們會確保這些傳輸符合適用的數據保護法律，並採取適當措施保護您的個人資料。
              </p>
            </div>

            {/* Section 10 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <RefreshCw className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">10. 政策更新</h2>
              </div>
              <p className="text-premier-pearl/70">
                我們可能不時更新本私隱政策。任何重大變更將在本頁面公布，
                並在適當情況下通過電郵通知您。我們建議您定期查閱本政策以了解最新資訊。
              </p>
            </div>

            {/* Section 11 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <Mail className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">11. 聯絡我們</h2>
              </div>
              <p className="mb-4 text-premier-pearl/70">
                如對本私隱政策或我們處理個人資料的方式有任何疑問或疑慮，
                或希望行使您的權利，請聯絡我們的數據保護主任：
              </p>
              <div className="ml-4 space-y-1 text-premier-pearl/70">
                <p>電郵：<a href="mailto:privacy@looper-hq.com" className="text-premier-gold hover:underline">privacy@looper-hq.com</a></p>
                <p>電話：+852 1234 5678</p>
                <p>地址：香港中環皇后大道中99號</p>
                <p>數據保護主任：法律及合規部</p>
              </div>
              <p className="mt-4 text-premier-pearl/70">
                如果您對我們處理您的投訴的方式不滿意，您有權向香港個人資料私隱專員公署投訴。
              </p>
            </div>

            {/* Footer Note */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 bg-premier-pearl/5 p-6 text-center">
              <p className="text-sm text-premier-pearl/50">
                本私隱政策最後更新於2024年1月。
                繼續使用本系統即表示您接受本私隱政策的條款。
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
