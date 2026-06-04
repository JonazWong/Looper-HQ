"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { AuthLayout } from "@/components/layout/auth-layout"
import { PremierButton } from "@/components/ui/premier-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardFooter, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"
import { Chrome, Github, Shield } from "lucide-react"

const keycloakEnabled = process.env.NEXT_PUBLIC_KEYCLOAK_ENABLED !== "false" && Boolean(process.env.NEXT_PUBLIC_KEYCLOAK_URL && process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID)

function getSafeCallbackUrl(rawCallbackUrl: string | null, locale: string) {
  if (!rawCallbackUrl) return `/${locale}/dashboard`

  try {
    const url = new URL(rawCallbackUrl, "http://local")
    if (url.origin !== "http://local") return `/${locale}/dashboard`
    if (!url.pathname.startsWith("/")) return `/${locale}/dashboard`
    if (url.pathname.startsWith("//")) return `/${locale}/dashboard`
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return `/${locale}/dashboard`
  }
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams()
  const locale = params.locale as string
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"), locale)
  const error = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(
    error === "CredentialsSignin" 
      ? "電郵或密碼不正確" 
      : error 
      ? "登入時發生錯誤" 
      : null
  )

  // Check for demo mode
  const isDemoMode = searchParams.get("demo") === "true"

  // Handle credentials login
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError(null)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setLoginError("電郵或密碼不正確")
        setIsLoading(false)
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } catch (error) {
      console.error("Login error:", error)
      setLoginError("發生意外錯誤")
      setIsLoading(false)
    }
  }

  // Handle OAuth login (Google/GitHub)
  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    setLoginError(null)

    try {
      await signIn(provider, {
        redirectTo: callbackUrl,
      })
    } catch (error) {
      console.error(`${provider} login error:`, error)
      setLoginError(`無法連接到 ${provider}`)
      setIsLoading(false)
    }
  }

  // Handle Keycloak OAuth login
  const handleKeycloakLogin = async () => {
    setIsLoading(true)
    setLoginError(null)

    try {
      await signIn("keycloak", {
        redirectTo: callbackUrl,
      })
    } catch (error) {
      console.error("Keycloak login error:", error)
      setLoginError("無法連接到 Keycloak")
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <GlassCard variant="gold" glow>
        <GlassCardHeader>
          <GlassCardTitle className="text-3xl text-gradient-gold text-center">會員登入</GlassCardTitle>
          <GlassCardDescription className="text-center">
            登入您的 Looper HQ 帳號
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          {loginError && (
            <div className="p-3 text-sm text-red-400 bg-red-950/30 border border-red-800/50 rounded-md">
              {loginError}
            </div>
          )}

          {isDemoMode && (
            <div className="p-4 bg-premier-mystery/10 border border-premier-mystery/30 rounded-lg space-y-2">
              <p className="text-sm font-medium text-premier-gold">示範帳號</p>
              <div className="grid gap-1 text-xs font-mono">
                <div><span className="text-premier-pearl/70">管理員:</span> admin@looperhq.hk / 任意密碼</div>
                <div><span className="text-premier-pearl/70">管理員:</span> admin@looperhq.com / 任意密碼</div>
                <div><span className="text-premier-pearl/70">律師:</span> sarah.chen@looperhq.com / 任意密碼</div>
                <div><span className="text-premier-pearl/70">客戶:</span> wong.client@example.com / 任意密碼</div>
              </div>
              <p className="text-[11px] text-premier-pearl/60">
                如帳號不存在，請執行 pnpm auth:ensure-demo-users
              </p>
            </div>
          )}

          {/* OAuth Login Options */}
          <div className="space-y-3">
            {keycloakEnabled && (
              <PremierButton
                type="button"
                onClick={handleKeycloakLogin}
                disabled={isLoading}
                className="w-full"
                variant="ghost"
              >
                <Shield className="h-4 w-4" />
                使用 Keycloak SSO 登入
              </PremierButton>
            )}
            <PremierButton
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
              className="w-full"
              variant="ghost"
            >
              <Chrome className="h-4 w-4" />
              使用 Google 登入
            </PremierButton>
            <PremierButton
              type="button"
              onClick={() => handleOAuthLogin('github')}
              disabled={isLoading}
              className="w-full"
              variant="ghost"
            >
              <Github className="h-4 w-4" />
              使用 GitHub 登入
            </PremierButton>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-premier-gold/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-premier-black-light px-2 text-premier-pearl-gray">
                或使用電郵
              </span>
            </div>
          </div>

          {/* Credentials Login Form (Fallback) */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-premier-pearl">電郵</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="bg-premier-black-light border-premier-gold/20 text-premier-pearl placeholder:text-premier-pearl-gray/50 focus:border-premier-gold"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-premier-pearl">密碼</Label>
                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-sm text-premier-gold hover:text-premier-gold-rose transition-colors"
                >
                  忘記密碼？
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="bg-premier-black-light border-premier-gold/20 text-premier-pearl focus:border-premier-gold"
              />
            </div>
            <PremierButton 
              type="submit" 
              className="w-full" 
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? "登入中..." : "登入"}
            </PremierButton>
          </form>
        </GlassCardContent>
        <GlassCardFooter className="flex flex-col gap-2">
          <div className="text-sm text-premier-pearl-gray text-center">
            還沒有帳號？{" "}
            <Link href={`/${locale}/register`} className="text-premier-gold hover:text-premier-gold-rose transition-colors">
              立即註冊
            </Link>
          </div>
        </GlassCardFooter>
      </GlassCard>
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <AuthLayout>
        <GlassCard variant="gold" glow>
          <GlassCardHeader>
            <GlassCardTitle>Loading...</GlassCardTitle>
          </GlassCardHeader>
        </GlassCard>
      </AuthLayout>
    }>
      <LoginForm />
    </Suspense>
  )
}
