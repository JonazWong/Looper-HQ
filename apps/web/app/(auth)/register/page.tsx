"use client"

import { useState } from "react"
import Link from "next/link"
import { AuthLayout } from "@/components/layout/auth-layout"
import { PremierButton } from "@/components/ui/premier-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardFooter, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement registration with NextAuth.js
    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }
    console.log("Register:", { name, email, password })
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
            <div className="space-y-2">
              <Label htmlFor="name" className="text-premier-pearl">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
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
                className="bg-premier-black-light border-premier-gold/20 text-premier-pearl focus:border-premier-gold"
              />
            </div>
            <PremierButton type="submit" className="w-full" variant="primary">
              Create Account
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
