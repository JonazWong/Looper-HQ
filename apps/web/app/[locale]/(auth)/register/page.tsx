"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/layout/auth-layout"
import { PremierButton } from "@/components/ui/premier-button"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardFooter, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"
import { Shield, UserPlus, ArrowRight } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

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
          <GlassCardTitle>Create Account</GlassCardTitle>
          <GlassCardDescription>
            Sign up to access Looper HQ case management system
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-6">
          {/* Keycloak SSO Registration (Primary) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-premier-pearl/70 mb-4">
              <Shield className="w-4 h-4 text-premier-gold" />
              <span>Secure authentication via Keycloak SSO</span>
            </div>
            
            <PremierButton
              type="button"
              onClick={handleKeycloakRegister}
              disabled={isLoading}
              className="w-full group"
              variant="primary"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {isLoading ? "Redirecting..." : "Register with Keycloak SSO"}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </PremierButton>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-premier-gold/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-premier-black text-premier-pearl/50">OR</span>
            </div>
          </div>

          {/* Demo Account Access */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-premier-pearl">Try Demo Account</h3>
            <div className="p-4 bg-premier-mystery/10 border border-premier-mystery/30 rounded-lg space-y-2">
              <p className="text-xs text-premier-pearl/70">Use these credentials to test the system:</p>
              <div className="grid gap-1 text-xs font-mono">
                <div><span className="text-premier-gold">Admin:</span> admin@looper-hq.local / admin123</div>
                <div><span className="text-premier-gold">Lawyer:</span> lawyer@looper-hq.local / lawyer123</div>
                <div><span className="text-premier-gold">Client:</span> client@looper-hq.local / client123</div>
              </div>
            </div>
            <PremierButton
              type="button"
              onClick={handleDemoAccount}
              disabled={isLoading}
              className="w-full"
              variant="secondary"
            >
              Login with Demo Account
            </PremierButton>
          </div>
        </GlassCardContent>
        <GlassCardFooter className="flex flex-col gap-2">
          <div className="text-sm text-premier-pearl-gray">
            Already have an account?{" "}
            <Link href="/login" className="text-premier-gold hover:text-premier-gold-rose transition-colors">
              Sign in
            </Link>
          </div>
          <div className="text-xs text-premier-pearl/50 text-center">
            Registration is managed through Keycloak SSO for enhanced security
          </div>
        </GlassCardFooter>
      </GlassCard>
    </AuthLayout>
  )
}
