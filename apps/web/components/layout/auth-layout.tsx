import { Scale } from "lucide-react"
import { ParticleBackground } from "@/components/effects/particle-background"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-premier-black overflow-hidden">
      {/* Premier Background Effects */}
      <ParticleBackground particleCount={30} />
      <div className="absolute inset-0 bg-gradient-to-br from-premier-black via-premier-black-medium to-premier-black-light" />
      <div className="absolute inset-0 bg-premier-black/40" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md space-y-6 p-6">
        {/* Logo/Header */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-premier-gold blur-xl opacity-30" />
            <Scale className="relative h-16 w-16 text-premier-gold" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-premier-gold via-premier-gold-rose to-premier-gold bg-clip-text text-transparent">
            Looper HQ
          </h1>
          <p className="text-premier-pearl-gray text-sm">
            Premier Legal Case Management
          </p>
        </div>
        
        {children}
      </div>
    </div>
  )
}
