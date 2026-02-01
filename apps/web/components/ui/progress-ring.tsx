'use client'

/**
 * ProgressRing - Circular Progress Chart
 * Premier Design System
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface ProgressSegment {
  label: string
  value: number
  color: string
}

export interface ProgressRingProps {
  segments: ProgressSegment[]
  size?: number
  strokeWidth?: number
  className?: string
  showPercentage?: boolean
  onClick?: (segment: ProgressSegment) => void
}

/**
 * ProgressRing Component
 * 
 * @example
 * ```tsx
 * <ProgressRing
 *   segments={[
 *     { label: 'Active', value: 15, color: '#D4AF37' },
 *     { label: 'Pending', value: 8, color: '#4A148C' },
 *     { label: 'Completed', value: 20, color: '#10b981' },
 *   ]}
 * />
 * ```
 */
export function ProgressRing({
  segments,
  size = 200,
  strokeWidth = 20,
  className,
  showPercentage = true,
  onClick,
}: ProgressRingProps) {
  const center = size / 2
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const total = segments.reduce((sum, seg) => sum + seg.value, 0)
  
  let currentOffset = 0

  return (
    <div className={cn('relative inline-flex flex-col items-center gap-4', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(212,175,55,0.1)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress segments */}
        {segments.map((segment, index) => {
          const percentage = (segment.value / total) * 100
          const dashLength = (percentage / 100) * circumference
          const offset = currentOffset
          currentOffset += dashLength

          return (
            <motion.circle
              key={segment.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${dashLength} ${circumference - dashLength}` }}
              transition={{ duration: 1, delay: index * 0.2, ease: 'easeOut' }}
              className="cursor-pointer transition-opacity hover:opacity-80"
              onClick={() => onClick?.(segment)}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.3))',
              }}
            />
          )
        })}
      </svg>

      {/* Center content */}
      {showPercentage && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <div className="text-4xl font-bold text-gradient-gold">
            {total}
          </div>
          <div className="text-sm text-premier-pearl-gray">
            Total Cases
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        {segments.map((segment) => (
          <motion.button
            key={segment.label}
            className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
            onClick={() => onClick?.(segment)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ 
                backgroundColor: segment.color,
                boxShadow: `0 0 8px ${segment.color}50`,
              }}
            />
            <span className="text-premier-pearl-gray">
              {segment.label} ({segment.value})
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
