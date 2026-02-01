'use client'

/**
 * ParticleBackground - Ambient Floating Particles
 * Premier Design System
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface ParticleBackgroundProps {
  particleCount?: number
  className?: string
}

/**
 * ParticleBackground Component
 * Adds subtle floating particles for ambient effect
 * 
 * @example
 * ```tsx
 * <ParticleBackground particleCount={50} />
 * ```
 */
export function ParticleBackground({ 
  particleCount = 30,
  className 
}: ParticleBackgroundProps) {
  const particles = React.useMemo(
    () =>
      Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.1 + 0.05,
      })),
    [particleCount]
  )

  return (
    <div className={cn('fixed inset-0 pointer-events-none overflow-hidden', className)}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-premier-gold"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            filter: 'blur(1px)',
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
