"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/layout/auth-layout"
import { PremierButton } from "@/components/ui/premier-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardFooter, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error?.message || "Registration failed")
        return
      }

      // Registration successful, redirect to login
      alert(data.data?.message || "Account created successfully! Please sign in.")
      router.push("/login")
    } catch (err) {
      setError("Something went wrong. Please try again.")
      console.error("Registration error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <GlassCard variant="gold" glow>
        <GlassCardHeader>
          <GlassCardTitle>Create Account</GlassCardTitle>
          <GlassCardDescription>
            Sign up to start managing your legal cases
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-950/30 border border-red-800/50 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-premier-pearl">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                className="bg-premier-black-light border-premier-gold/20 text-premier-pearl placeholder:text-premier-pearl-gray/50 focus:border-premier-gold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-premier-pearl">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-premier-black-light border-premier-gold/20 text-premier-pearl placeholder:text-premier-pearl-gray/50 focus:border-premier-gold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-premier-pearl">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-premier-black-light border-premier-gold/20 text-premier-pearl focus:border-premier-gold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-premier-pearl">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-premier-black-light border-premier-gold/20 text-premier-pearl focus:border-premier-gold"
              />
            </div>
            <PremierButton type="submit" className="w-full" variant="primary" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </PremierButton>
          </form>
        </GlassCardContent>
        <GlassCardFooter className="flex flex-col gap-2">
          <div className="text-sm text-premier-pearl-gray">
            Already have an account?{" "}
            <Link href="/login" className="text-premier-gold hover:text-premier-gold-rose transition-colors">
              Sign in
            </Link>
          </div>
        </GlassCardFooter>
      </GlassCard>
    </AuthLayout>
  )
}
