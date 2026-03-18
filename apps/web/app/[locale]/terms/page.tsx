import { Scale, FileText, Users, ShieldCheck, AlertTriangle, Lock, RefreshCw, Gavel, Mail } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: '服務條款 | Terms of Service',
  description: '香港法律案件查詢系統的服務條款及使用規範',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-premier-black via-premier-black-light to-premier-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-premier-gold/10 via-transparent to-transparent" />
        <div className="container relative z-10 mx-auto px-4">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-premier-gold/30 bg-premier-gold/10 px-4 py-2 text-sm text-premier-gold">
              <Scale className="h-4 w-4" />
              <span>法律文件</span>
            </div>
            <h1 className="mb-4 text-4xl font-bold text-premier-pearl md:text-5xl">
              服務條款
            </h1>
            <p className="mb-2 text-lg text-premier-pearl/60">Terms of Service</p>
            <p className="text-sm text-premier-pearl/40">最後更新：2024年1月</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="space-y-8">
            {/* Section 1 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <FileText className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">1. 服務範圍</h2>
              </div>
              <div className="space-y-4 text-premier-pearl/70">
                <p>
                  香港法律案件查詢系統（以下簡稱「本系統」）提供香港法律案件資訊查詢、分析及文件生成服務。
                  本系統旨在協助用戶了解香港法律案件資訊，但不構成任何法律意見或建議。
                </p>
                <p>
                  本系統收集的案件資料來源於公開渠道，包括但不限於香港法律資訊網站（HKLII）及主要新聞媒體。
                  我們致力於提供準確及時的資訊，但不保證資訊的完整性、準確性或時效性。
                </p>
              </div>
            </div>

            {/* Section 2 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <Users className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">2. 用戶責任</h2>
              </div>
              <p className="mb-4 font-medium text-premier-gold/80">用戶在使用本系統時，同意並承諾：</p>
              <ul className="ml-6 list-disc space-y-2 text-premier-pearl/70">
                <li>提供真實、準確的註冊資訊</li>
                <li>妥善保管帳戶密碼，對帳戶活動負責</li>
                <li>不得濫用系統資源或進行未經授權的訪問</li>
                <li>不得將本系統用於任何非法或未經授權的目的</li>
                <li>尊重他人的知識產權和隱私權</li>
                <li>遵守香港特別行政區的所有適用法律法規</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <ShieldCheck className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">3. 會員服務</h2>
              </div>
              <div className="space-y-4 text-premier-pearl/70">
                <p>
                  本系統提供不同等級的會員服務，包括基本版、專業版、高端版及數據購買版。
                  各等級會員享有不同的服務權限及功能。
                </p>
                <p>
                  會員費用一經支付，除非本系統未能提供承諾的服務，否則不予退款。
                  會員可以隨時取消訂閱，但已支付的費用不會按比例退還。
                </p>
                <p>
                  本系統保留隨時修改會員計劃、功能及價格的權利，但會提前至少30天通知現有會員。
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <Scale className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">4. 知識產權</h2>
              </div>
              <div className="space-y-4 text-premier-pearl/70">
                <p>
                  本系統的所有內容，包括但不限於文字、圖形、標誌、圖像、軟件及數據編譯，
                  均屬本系統或其內容提供者所有，受香港及國際版權法保護。
                </p>
                <p>
                  用戶可以為個人非商業用途查看、下載及打印本系統內容，
                  但不得修改、複製、分發、傳輸、展示、出版、出售或利用本系統內容進行任何商業用途。
                </p>
              </div>
            </div>

            {/* Section 5 - Disclaimer */}
            <div className="glass-card rounded-premier-lg border border-amber-500/30 bg-amber-500/5 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-amber-500/20">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">5. 免責聲明</h2>
              </div>
              <div className="space-y-4 text-premier-pearl/70">
                <p className="font-semibold text-amber-400">
                  本系統提供的資訊僅供參考，不構成法律意見或建議。
                </p>
                <p>
                  用戶應就其特定情況尋求專業法律顧問的意見。本系統及其營運者對因使用或依賴本系統資訊而導致的任何損失或損害不承擔責任。
                </p>
                <p>
                  本系統生成的無訴訟紀錄證明書僅基於系統數據庫中的記錄。
                  未經核證的證明書不具法律效力，僅供參考。核證版證明書的法律效力以相關法律法規為準。
                </p>
              </div>
            </div>

            {/* Section 6 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <Lock className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">6. 隱私保護</h2>
              </div>
              <p className="text-premier-pearl/70">
                本系統重視用戶隱私，承諾按照《個人資料（私隱）條例》（香港法例第486章）處理用戶個人資料。
                詳情請參閱我們的<Link href="/privacy" className="text-premier-gold hover:underline">私隱政策</Link>。
              </p>
            </div>

            {/* Section 7 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <RefreshCw className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">7. 服務變更及終止</h2>
              </div>
              <div className="space-y-4 text-premier-pearl/70">
                <p>
                  本系統保留隨時修改、暫停或終止全部或部分服務的權利，無需事先通知。
                  對於服務的修改、暫停或終止，本系統不對用戶或任何第三方承擔責任。
                </p>
                <p>
                  本系統有權在不通知的情況下，隨時終止違反本服務條款的用戶帳戶。
                </p>
              </div>
            </div>

            {/* Section 8 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <Gavel className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">8. 適用法律及爭議解決</h2>
              </div>
              <div className="space-y-4 text-premier-pearl/70">
                <p>
                  本服務條款受香港特別行政區法律管轄並按其解釋。
                  因本服務條款引起的或與之相關的任何爭議，應首先通過友好協商解決。
                </p>
                <p>
                  如協商不成，雙方同意將爭議提交香港法院進行裁決。
                </p>
              </div>
            </div>

            {/* Section 9 */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-premier-sm bg-premier-gold/10">
                  <Mail className="h-5 w-5 text-premier-gold" />
                </div>
                <h2 className="text-xl font-bold text-premier-pearl">9. 聯絡方式</h2>
              </div>
              <p className="mb-4 text-premier-pearl/70">
                如對本服務條款有任何疑問，請通過以下方式聯絡我們：
              </p>
              <div className="ml-4 space-y-1 text-premier-pearl/70">
                <p>電郵：<a href="mailto:support@looper-hq.com" className="text-premier-gold hover:underline">support@looper-hq.com</a></p>
                <p>電話：+852 1234 5678</p>
                <p>地址：香港中環皇后大道中99號</p>
              </div>
            </div>

            {/* Footer Note */}
            <div className="glass-card rounded-premier-lg border border-premier-pearl/10 bg-premier-pearl/5 p-6 text-center">
              <p className="text-sm text-premier-pearl/50">
                本服務條款最後更新於2024年1月。本系統保留隨時修改本服務條款的權利。
                修改後的條款將在本頁面公布，請定期查閱。繼續使用本系統即表示您接受修改後的條款。
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
