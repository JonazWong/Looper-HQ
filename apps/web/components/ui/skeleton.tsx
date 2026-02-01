'use client'

/**
 * Skeleton - Loading State Component
 * Premier Design System
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular'
}

/**
 * Skeleton Loader Component
 * 
 * @example
 * ```tsx
 * <Skeleton className="h-12 w-full" />
 * <Skeleton variant="circular" className="h-12 w-12" />
 * ```
 */
export function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  const variantClasses = {
    default: 'rounded-premier-md',
    text: 'rounded-premier-sm h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-premier-lg',
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        'bg-premier-black-light/40',
        'before:absolute before:inset-0',
        'before:-translate-x-full',
        'before:bg-gradient-to-r',
        'before:from-transparent before:via-premier-gold/10 before:to-transparent',
        'before:animate-shimmer',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

/**
 * SkeletonText - Multiple text lines
 */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn('w-full', i === lines - 1 && 'w-3/4')}
        />
      ))}
    </div>
  )
}

/**
 * SkeletonCard - Card skeleton
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('glass-card p-6 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton variant="circular" className="h-10 w-10" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-4 w-48" />
    </div>
  )
}
