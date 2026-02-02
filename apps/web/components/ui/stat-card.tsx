'use client'

/**
 * StatCard - Dashboard Statistics Card
 * Premier Design System
 */

import * as React from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard } from './glass-card'

export interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    trend: 'up' | 'down'
    label?: string
  }
  icon?: LucideIcon
  className?: string
  iconClassName?: string
  /**
   * Visual variant for the card. Applies different accent colors:
   * - 'default': Gold accent (premier-gold)
   * - 'success': Green accent for positive metrics
   * - 'warning': Yellow/amber accent for warnings
   * - 'danger': Red accent for critical metrics
   */
  variant?: 'success' | 'warning' | 'danger' | 'default'
}

/**
 * StatCard Component
 * 
 * @example
 * ```tsx
 * <StatCard
 *   title="Total Cases"
 *   value={42}
 *   change={{ value: 12, trend: 'up', label: 'from last month' }}
 *   icon={Briefcase}
 *   variant="success"
 * />
 * ```
 */
export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  className,
  iconClassName,
  variant = 'default',
}: StatCardProps) {
  const [displayValue, setDisplayValue] = React.useState(0)
  
  // Variant-specific colors
  const variantStyles = {
    default: {
      glow: 'from-premier-gold/20 to-premier-gold-rose/10 group-hover:from-premier-gold/30 group-hover:to-premier-gold-rose/20',
      icon: 'text-premier-gold',
      value: 'text-gradient-gold'
    },
    success: {
      glow: 'from-green-500/20 to-green-600/10 group-hover:from-green-500/30 group-hover:to-green-600/20',
      icon: 'text-green-400',
      value: 'text-green-400'
    },
    warning: {
      glow: 'from-amber-500/20 to-orange-500/10 group-hover:from-amber-500/30 group-hover:to-orange-500/20',
      icon: 'text-amber-400',
      value: 'text-amber-400'
    },
    danger: {
      glow: 'from-red-500/20 to-red-600/10 group-hover:from-red-500/30 group-hover:to-red-600/20',
      icon: 'text-red-400',
      value: 'text-red-400'
    }
  }
  
  const styles = variantStyles[variant]
  const controls = useAnimationControls()

  React.useEffect(() => {
    // Animate number counting
    const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0
    
    if (numericValue > 0) {
      const duration = 1500 // ms
      const steps = 60
      const increment = numericValue / steps
      const stepDuration = duration / steps
      let currentStep = 0

      const timer = setInterval(() => {
        currentStep++
        if (currentStep >= steps) {
          setDisplayValue(numericValue)
          clearInterval(timer)
        } else {
          setDisplayValue(Math.floor(increment * currentStep))
        }
      }, stepDuration)

      return () => clearInterval(timer)
    } else {
      setDisplayValue(numericValue)
    }
  }, [value])

  const TrendIcon = change?.trend === 'up' ? TrendingUp : TrendingDown
  const trendColor = change?.trend === 'up' ? 'text-green-400' : 'text-red-400'

  return (
    <GlassCard variant="gold" glow animated className={cn('group', className)}>
      <div className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-premier-pearl-gray">
            {title}
          </h3>
          {Icon && (
            <div className={cn(
              'rounded-lg p-2 bg-gradient-to-br',
              styles.glow,
              'transition-all duration-300',
              iconClassName
            )}>
              <Icon className={cn('h-4 w-4', styles.icon)} />
            </div>
          )}
        </div>
        <div className="mt-2">
          <motion.div
            className={cn('text-3xl font-bold', styles.value)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {typeof value === 'number' ? displayValue : value}
          </motion.div>
          {change && (
            <motion.p
              className="mt-2 flex items-center gap-1 text-xs text-premier-pearl-gray"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <TrendIcon className={cn('h-3 w-3', trendColor)} />
              <span className={trendColor}>
                {change.trend === 'up' ? '+' : '-'}{Math.abs(change.value)}%
              </span>
              {change.label && (
                <span className="ml-1">{change.label}</span>
              )}
            </motion.p>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
