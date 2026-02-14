/**
 * Premier Exclusive Search Card
 * High-tier membership exclusive feature
 * Only visible to PREMIUM and PREMIER members
 */

'use client'

import { motion } from "framer-motion"
import Link from "next/link"
import { useLocale } from 'next-intl'
import { Search, Sparkles, Crown, ArrowRight, Shield, Zap } from "lucide-react"
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card"
import { itemVariants } from "@/lib/animations"

interface PremierSearchCardProps {
  membershipTier: 'PREMIUM' | 'PREMIER'
}

export function PremierSearchCard({ membershipTier }: PremierSearchCardProps) {
  const locale = useLocale()
  const isPremier = membershipTier === 'PREMIER'
  
  return (
    <motion.div variants={itemVariants}>
      <Link href={`/${locale}/public-cases`} className="block group">
        <GlassCard 
          variant="gold" 
          glow
          className="relative overflow-hidden border-2 border-premier-gold/50 hover:border-premier-gold transition-all duration-500 hover:shadow-premier-2xl"
        >
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-premier-gold/10 via-premier-mystery-violet/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Crown Badge - Only for PREMIER */}
          {isPremier && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-premier-gold/20 border border-premier-gold/30 backdrop-blur-sm">
              <Crown className="h-3.5 w-3.5 text-premier-gold animate-pulse" />
              <span className="text-xs font-semibold text-premier-gold">PREMIER</span>
            </div>
          )}
          
          <GlassCardHeader className="relative z-10">
            <div className="flex items-start gap-4">
              {/* Icon Container with Glow Effect */}
              <div className="relative">
                <motion.div
                  className="h-16 w-16 rounded-2xl bg-gradient-to-br from-premier-gold via-premier-gold-rose to-premier-gold-dark flex items-center justify-center shadow-premier-lg group-hover:shadow-premier-xl transition-shadow duration-500"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Search className="h-8 w-8 text-premier-black" />
                </motion.div>
                
                {/* Sparkle Effect */}
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Sparkles className="h-5 w-5 text-premier-gold" />
                </motion.div>
              </div>
              
              <div className="flex-1 min-w-0">
                <GlassCardTitle className="text-2xl flex items-center gap-2 mb-2">
                  <span className="bg-gradient-to-r from-premier-gold via-premier-gold-champagne to-premier-gold bg-clip-text text-transparent">
                    Public Case Intelligence
                  </span>
                </GlassCardTitle>
                
                <p className="text-sm text-premier-pearl-gray leading-relaxed">
                  AI-powered legal case search with real-time tracking from Hong Kong courts and news sources
                </p>
              </div>
            </div>
          </GlassCardHeader>
          
          <GlassCardContent className="relative z-10 space-y-4">
            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-premier-black/30 border border-premier-gold/10 group-hover:border-premier-gold/30 transition-colors">
                <div className="h-8 w-8 rounded-full bg-premier-gold/20 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-premier-gold" />
                </div>
                <span className="text-xs text-premier-pearl-gray text-center">50+ Court Formats</span>
              </div>
              
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-premier-black/30 border border-premier-gold/10 group-hover:border-premier-gold/30 transition-colors">
                <div className="h-8 w-8 rounded-full bg-premier-gold/20 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-premier-gold" />
                </div>
                <span className="text-xs text-premier-pearl-gray text-center">Auto-Linking</span>
              </div>
              
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-premier-black/30 border border-premier-gold/10 group-hover:border-premier-gold/30 transition-colors">
                <div className="h-8 w-8 rounded-full bg-premier-gold/20 flex items-center justify-center">
                  <Search className="h-4 w-4 text-premier-gold" />
                </div>
                <span className="text-xs text-premier-pearl-gray text-center">Real-Time Data</span>
              </div>
            </div>
            
            {/* Exclusive Badge */}
            <div className="flex items-center justify-between pt-4 border-t border-premier-gold/20">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-premier-gold animate-pulse" />
                <span className="text-xs font-medium text-premier-gold">
                  {isPremier ? 'PREMIER EXCLUSIVE' : 'PREMIUM FEATURE'}
                </span>
              </div>
              
              <motion.div
                className="flex items-center gap-1 text-premier-gold group-hover:text-premier-gold-champagne transition-colors"
                whileHover={{ x: 5 }}
              >
                <span className="text-sm font-medium">Explore</span>
                <ArrowRight className="h-4 w-4" />
              </motion.div>
            </div>
          </GlassCardContent>
          
          {/* Hover Glow Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-radial from-premier-gold/10 via-transparent to-transparent" />
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  )
}
