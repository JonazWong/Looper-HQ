'use client'

/**
 * GradientBorder - Animated Border Component
 * Premier Design System
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface GradientBorderProps {
  children: React.ReactNode
  className?: string
  borderWidth?: number
  speed?: number
  glowIntensity?: 'low' | 'medium' | 'high'
}

/**
 * GradientBorder Component
 * Creates an animated rotating gradient border
 * 
 * @example
 * ```tsx
 * <GradientBorder>
 *   <div className="p-6">
 *     <h3>Premium Content</h3>
 *   </div>
 * </GradientBorder>
 * ```
 */
export function GradientBorder({
  children,
  className,
  borderWidth = 2,
  speed = 3,
  glowIntensity = 'medium',
}: GradientBorderProps) {
  const glowSizes = {
    low: '4px',
    medium: '8px',
    high: '12px',
  }

  return (
    <div className={cn('relative rounded-premier-lg', className)}>
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 rounded-premier-lg opacity-75"
        style={{
          background: `conic-gradient(
            from 0deg,
            #D4AF37 0deg,
            #B8860B 90deg,
            #4A148C 180deg,
            #6A1B9A 270deg,
            #D4AF37 360deg
          )`,
          padding: `${borderWidth}px`,
          filter: `blur(${glowSizes[glowIntensity]})`,
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Content container */}
      <div 
        className="relative bg-premier-black rounded-premier-lg overflow-hidden"
        style={{
          margin: `${borderWidth}px`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
