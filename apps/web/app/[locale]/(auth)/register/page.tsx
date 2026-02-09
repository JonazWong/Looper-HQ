"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/layout/auth-layout"
import { PremierButton } from "@/components/ui/premier-button"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardFooter, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"
import { Shield, UserPlus, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Handle standard registration
  const handleStandardRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '註冊失敗')
        setIsLoading(false)
        return
      }

      // Registration successful, redirect to login
      router.push('/login?registered=true')
    } catch (error) {
      console.error('Registration error:', error)
      setError('發生意外錯誤')
      setIsLoading(false)
    }
  }

  // Redirect to Keycloak registration
  const handleKeycloakRegister = () => {
    setIsLoading(true)
    // Redirect to Keycloak registration page
    const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080"
    const realm = "looper-hq"
    const clientId = "looper-hq-web"
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/callback/keycloak`)
    
    const registrationUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/registrations?client_id=${clientId}&response_type=code&scope=openid%20email%20profile&redirect_uri=${redirectUri}`
    
    window.location.href = registrationUrl
  }

  const handleDemoAccount = () => {
    setIsLoading(true)
    router.push("/login?demo=true")
  }

  return (
    <AuthLayout>
      <GlassCard variant="gold" glow>
        <GlassCardHeader>
          <GlassCardTitle className="text-3xl text-gradient-gold text-center">免費註冊</GlassCardTitle>
          <GlassCardDescription className="text-center">
            註冊 Looper HQ 帳號，開始使用智能法律搜尋
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-950/30 border border-red-800/50 rounded-md">
              {error}
            </div>
          )}

          {/* Standard Registration Form */}
          <form onSubmit={handleStandardRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-premier-pearl">姓名</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="請輸入您的姓名"
                disabled={isLoading}
                required
                className="bg-premier-black-light border-premier-gold/20 text-premier-pearl placeholder:text-premier-pearl-gray/50 focus:border-premier-gold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-premier-pearl">電郵</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
                required
                className="bg-premier-black-light border-premier-gold/20 text-premier-pearl placeholder:text-premier-pearl-gray/50 focus:border-premier-gold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-premier-pearl">密碼</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 8 個字符"
                disabled={isLoading}
                required
                minLength={8}
                className="bg-premier-black-light border-premier-gold/20 text-premier-pearl focus:border-premier-gold"
              />
            </div>
            <PremierButton 
              type="submit" 
              className="w-full" 
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? "註冊中..." : "註冊"}
            </PremierButton>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-premier-gold/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-premier-black text-premier-pearl/50">或</span>
            </div>
          </div>

          {/* Keycloak SSO Registration (Alternative) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-premier-pearl/70">
              <Shield className="w-4 h-4 text-premier-gold" />
              <span>使用 Keycloak SSO 進行安全認證</span>
            </div>
            
            <PremierButton
              type="button"
              onClick={handleKeycloakRegister}
              disabled={isLoading}
              className="w-full group"
              variant="ghost"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {isLoading ? "重定向中..." : "使用 Keycloak SSO 註冊"}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </PremierButton>
          </div>

          {/* Demo Account Access */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-premier-pearl">試用示範帳號</h3>
            <div className="p-4 bg-premier-mystery/10 border border-premier-mystery/30 rounded-lg space-y-2">
              <p className="text-xs text-premier-pearl/70">使用以下憑證測試系統：</p>
              <div className="grid gap-1 text-xs font-mono">
                <div><span className="text-premier-gold">管理員:</span> admin@looper-hq.local / admin123</div>
                <div><span className="text-premier-gold">律師:</span> lawyer@looper-hq.local / lawyer123</div>
                <div><span className="text-premier-gold">客戶:</span> client@looper-hq.local / client123</div>
              </div>
            </div>
            <PremierButton
              type="button"
              onClick={handleDemoAccount}
              disabled={isLoading}
              className="w-full"
              variant="secondary"
            >
              使用示範帳號登入
            </PremierButton>
          </div>
        </GlassCardContent>
        <GlassCardFooter className="flex flex-col gap-2">
          <div className="text-sm text-premier-pearl-gray text-center">
            已有帳號？{" "}
            <Link href="/login" className="text-premier-gold hover:text-premier-gold-rose transition-colors">
              立即登入
            </Link>
          </div>
        </GlassCardFooter>
      </GlassCard>
    </AuthLayout>
  )
}
