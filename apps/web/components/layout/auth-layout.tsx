import { Scale } from "lucide-react"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Scale className="h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold">Looper HQ</h1>
          <p className="text-sm text-muted-foreground">
            Legal Case Management Platform
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
