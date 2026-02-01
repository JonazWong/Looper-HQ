'use client'

/**
 * GlassCard - Primary Card Component with Glassmorphism
 * Premier Design System
 */

import * as React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { cardHoverVariants } from '@/lib/animations'

export interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: 'default' | 'gold' | 'mystery' | 'frosted'
  glow?: boolean
  animated?: boolean
  children: React.ReactNode
  className?: string
}

/**
 * GlassCard Component
 * 
 * @example
 * ```tsx
 * <GlassCard variant="gold" glow animated>
 *   <h3>Premium Content</h3>
 * </GlassCard>
 * ```
 */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = 'default', glow = false, animated = true, className, children, ...props }, ref) => {
    const variantClasses = {
      default: 'glass-card',
      gold: 'glass-gold',
      mystery: 'glass-mystery',
      frosted: 'glass-frosted',
    }

    if (animated) {
      return (
        <motion.div
          ref={ref}
          className={cn(
            'rounded-premier-lg transition-all duration-300',
            variantClasses[variant],
            glow && 'shadow-premier-glow hover:shadow-premier-glow-lg',
            className
          )}
          initial="initial"
          whileHover="hover"
          variants={cardHoverVariants}
          whileTap={{ scale: 0.99 }}
          {...props}
        >
          {children}
        </motion.div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-premier-lg transition-all duration-300',
          variantClasses[variant],
          glow && 'shadow-premier-glow hover:shadow-premier-glow-lg',
          className
        )}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {children}
      </div>
    )
  }
)

GlassCard.displayName = 'GlassCard'

export const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
GlassCardHeader.displayName = 'GlassCardHeader'

export const GlassCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-premier-lg font-semibold leading-none tracking-tight',
      'text-gradient-gold',
      className
    )}
    {...props}
  />
))
GlassCardTitle.displayName = 'GlassCardTitle'

export const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-premier-pearl-gray', className)}
    {...props}
  />
))
GlassCardDescription.displayName = 'GlassCardDescription'

export const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
GlassCardContent.displayName = 'GlassCardContent'

export const GlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
GlassCardFooter.displayName = 'GlassCardFooter'
