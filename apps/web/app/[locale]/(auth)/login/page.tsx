"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { AuthLayout } from "@/components/layout/auth-layout"
import { PremierButton } from "@/components/ui/premier-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardFooter, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const error = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(
    error === "CredentialsSignin" 
      ? "Invalid email or password" 
      : error 
      ? "An error occurred during sign in" 
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
        setLoginError("Invalid email or password")
        setIsLoading(false)
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } catch (error) {
      console.error("Login error:", error)
      setLoginError("An unexpected error occurred")
      setIsLoading(false)
    }
  }

  // Handle Keycloak OAuth login
  const handleKeycloakLogin = async () => {
    setIsLoading(true)
    setLoginError(null)

    try {
      await signIn("keycloak", {
        callbackUrl,
      })
    } catch (error) {
      console.error("Keycloak login error:", error)
      setLoginError("Failed to connect to Keycloak")
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <GlassCard variant="gold" glow>
        <GlassCardHeader>
          <GlassCardTitle>Login</GlassCardTitle>
          <GlassCardDescription>
            Sign in to your Looper HQ account
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
              <p className="text-sm font-medium text-premier-gold">Demo Accounts</p>
              <div className="grid gap-1 text-xs font-mono">
                <div><span className="text-premier-pearl/70">Admin:</span> admin@looperhq.com / demo123</div>
                <div><span className="text-premier-pearl/70">Lawyer:</span> sarah.chen@looperhq.com / demo123</div>
                <div><span className="text-premier-pearl/70">Client:</span> wong.client@example.com / demo123</div>
              </div>
            </div>
          )}

          {/* Keycloak SSO Login (Primary) */}
          <PremierButton
            type="button"
            onClick={handleKeycloakLogin}
            disabled={isLoading}
            className="w-full"
            variant="primary"
          >
            {isLoading ? "Signing in..." : "Sign in with Keycloak SSO"}
          </PremierButton>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-premier-gold/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-premier-black-light px-2 text-premier-pearl-gray">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Credentials Login Form (Fallback) */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-premier-pearl">Email</Label>
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
                <Label htmlFor="password" className="text-premier-pearl">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-premier-gold hover:text-premier-gold-rose transition-colors"
                >
                  Forgot password?
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
              variant="secondary"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in with Email"}
            </PremierButton>
          </form>
        </GlassCardContent>
        <GlassCardFooter className="flex flex-col gap-2">
          <div className="text-sm text-premier-pearl-gray">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-premier-gold hover:text-premier-gold-rose transition-colors">
              Sign up
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
