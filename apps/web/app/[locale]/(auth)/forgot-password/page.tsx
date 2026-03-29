"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { AuthLayout } from "@/components/layout/auth-layout"
import { PremierButton } from "@/components/ui/premier-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardFooter,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui/glass-card"
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const params = useParams()
  const locale = params.locale as string

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isZh = locale === "zh"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      // TODO: Implement actual password reset API endpoint
      // For now, simulate submission
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIsSubmitted(true)
    } catch {
      setError(isZh ? "發送重設電郵時發生錯誤，請稍後再試。" : "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <GlassCard variant="gold" glow>
        <GlassCardHeader>
          <GlassCardTitle className="text-3xl text-gradient-gold text-center">
            {isZh ? "忘記密碼" : "Forgot Password"}
          </GlassCardTitle>
          <GlassCardDescription className="text-center">
            {isZh
              ? "輸入您的電郵地址，我們將發送密碼重設連結。"
              : "Enter your email address and we'll send you a password reset link."}
          </GlassCardDescription>
        </GlassCardHeader>

        <GlassCardContent className="space-y-4">
          {isSubmitted ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle2 className="h-12 w-12 text-green-400" />
              <div className="text-center space-y-2">
                <p className="font-medium text-premier-pearl">
                  {isZh ? "重設連結已發送" : "Reset link sent"}
                </p>
                <p className="text-sm text-premier-pearl-gray">
                  {isZh
                    ? `我們已將密碼重設連結發送至 ${email}。請查看您的電郵。`
                    : `We've sent a password reset link to ${email}. Please check your email.`}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-400 bg-red-950/30 border border-red-800/50 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{isZh ? "電郵地址" : "Email Address"}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-premier-pearl-gray" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={isZh ? "your@email.com" : "your@email.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <PremierButton
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading || !email.trim()}
              >
                {isLoading
                  ? (isZh ? "發送中..." : "Sending...")
                  : (isZh ? "發送重設連結" : "Send Reset Link")}
              </PremierButton>
            </form>
          )}
        </GlassCardContent>

        <GlassCardFooter className="flex justify-center">
          <Link
            href={`/${locale}/login`}
            className="flex items-center gap-2 text-sm text-premier-pearl-gray hover:text-premier-gold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {isZh ? "返回登入" : "Back to Login"}
          </Link>
        </GlassCardFooter>
      </GlassCard>
    </AuthLayout>
  )
}
