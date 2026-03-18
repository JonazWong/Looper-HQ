'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mail, MapPin, Phone, Clock, Send } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const contactInfo = [
  {
    icon: Phone,
    title: '電話',
    content: '+852 1234 5678',
    link: 'tel:+85212345678',
  },
  {
    icon: Mail,
    title: '電郵',
    content: 'support@looperhq.hk',
    link: 'mailto:support@looperhq.hk',
  },
  {
    icon: MapPin,
    title: '地址',
    content: '香港中環皇后大道中99號',
    link: null,
  },
  {
    icon: Clock,
    title: '辦公時間',
    content: '星期一至五 9:00 - 18:00',
    link: null,
  },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // TODO: Implement actual form submission to backend API
    setTimeout(() => {
      toast.success('訊息已成功發送！我們會儘快回覆您。')
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      })
      setIsSubmitting(false)
    }, 1000)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-premier-black to-premier-black-light">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-premier-gold/20 bg-premier-gold/10 px-4 py-2 text-sm text-premier-gold">
            <Mail className="h-4 w-4" />
            <span>聯絡我們</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-premier-pearl">聯絡我們</h1>
          <p className="text-premier-pearl-gray">Contact Us</p>
          <p className="mt-2 text-lg text-premier-pearl-gray">
            有任何疑問或需要協助？歡迎隨時聯絡我們的專業團隊
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid gap-8 md:grid-cols-4 mb-8">
          {contactInfo.map((info, index) => {
            const Icon = info.icon
            return (
              <Card
                key={index}
                className="group glass-card border-premier-gold/10 transition-all hover:border-premier-gold/30 hover:shadow-premier-glow-sm"
              >
                <CardHeader>
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-premier-gold/10 text-premier-gold group-hover:bg-premier-gold/20 transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg text-premier-pearl">{info.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {info.link ? (
                    <a
                      href={info.link}
                      className="text-premier-pearl-gray hover:text-premier-gold transition-colors"
                    >
                      {info.content}
                    </a>
                  ) : (
                    <p className="text-premier-pearl-gray">{info.content}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Contact Form */}
          <Card className="glass-card border-premier-gold/10">
            <CardHeader>
              <CardTitle className="text-premier-pearl">發送訊息</CardTitle>
              <CardDescription className="text-premier-pearl-gray">
                填寫以下表格，我們的團隊會儘快回覆您
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-premier-pearl">姓名 *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="請輸入您的姓名"
                    required
                    className="bg-premier-black/50 border-premier-gold/20 text-premier-pearl placeholder:text-premier-pearl-gray/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-premier-pearl">電郵地址 *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    required
                    className="bg-premier-black/50 border-premier-gold/20 text-premier-pearl placeholder:text-premier-pearl-gray/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-premier-pearl">電話號碼</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+852 1234 5678"
                    className="bg-premier-black/50 border-premier-gold/20 text-premier-pearl placeholder:text-premier-pearl-gray/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-premier-pearl">主題 *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="請簡述您的查詢主題"
                    required
                    className="bg-premier-black/50 border-premier-gold/20 text-premier-pearl placeholder:text-premier-pearl-gray/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-premier-pearl">訊息內容 *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="請詳細描述您的問題或需求..."
                    rows={6}
                    required
                    className="bg-premier-black/50 border-premier-gold/20 text-premier-pearl placeholder:text-premier-pearl-gray/50"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-premier-gold hover:bg-premier-gold-rose text-premier-black"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    '發送中...'
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      發送訊息
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className="glass-card border-premier-gold/10">
            <CardHeader>
              <CardTitle className="text-premier-pearl">常見問題</CardTitle>
              <CardDescription className="text-premier-pearl-gray">
                查看我們的常見問題，也許能找到您需要的答案
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2 text-premier-pearl">如何升級會員等級？</h3>
                <p className="text-sm text-premier-pearl-gray">
                  登入後前往<Link href="/membership" className="text-premier-gold hover:underline">會員方案</Link>頁面，
                  選擇適合您的方案並完成付款即可升級。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-premier-pearl">證明書需要多久才能生成？</h3>
                <p className="text-sm text-premier-pearl-gray">
                  未經核證的證明書可即時生成。核證版證明書需要3-5個工作天處理。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-premier-pearl">如何查詢特定公司的案件？</h3>
                <p className="text-sm text-premier-pearl-gray">
                  前往<Link href="/case-search" className="text-premier-gold hover:underline">案件查詢</Link>頁面，
                  在搜尋框輸入公司名稱或使用篩選功能即可查詢。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-premier-pearl">資料更新頻率如何？</h3>
                <p className="text-sm text-premier-pearl-gray">
                  我們的系統每日自動從HKLII及主要媒體收集最新案件資訊，確保資料及時更新。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-premier-pearl">提供技術支援嗎？</h3>
                <p className="text-sm text-premier-pearl-gray">
                  是的，我們提供全天候技術支援。專業版及以上會員享有優先支援服務。
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-premier-pearl">可以申請退款嗎？</h3>
                <p className="text-sm text-premier-pearl-gray">
                  會員費用一經支付，除非我們未能提供承諾的服務，否則不予退款。
                  詳情請參閱我們的<Link href="/terms" className="text-premier-gold hover:underline">服務條款</Link>。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Contact */}
        <Card className="mt-8 glass-card border-premier-gold/20 bg-gradient-to-br from-premier-gold/5 to-premier-mystery-violet/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-premier-gold/10 p-3">
                <Mail className="h-6 w-6 text-premier-gold" />
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-premier-pearl">需要緊急協助？</h3>
                <p className="text-sm text-premier-pearl-gray mb-3">
                  如需緊急技術支援或有重要事項，請直接致電我們的熱線：
                </p>
                <a
                  href="tel:+85212345678"
                  className="inline-flex items-center gap-2 text-premier-gold hover:underline font-medium"
                >
                  <Phone className="h-4 w-4" />
                  +852 1234 5678
                </a>
                <p className="text-sm text-premier-pearl-gray mt-2">
                  （服務時間：星期一至五 9:00 - 18:00）
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
