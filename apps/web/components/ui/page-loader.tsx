'use client'

/**
 * PageLoader - Full Page Loading Component
 * Premier Design System
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface PageLoaderProps {
  loading?: boolean
  className?: string
}

/**
 * PageLoader Component
 * 
 * @example
 * ```tsx
 * <PageLoader loading={isLoading} />
 * ```
 */
export function PageLoader({ loading = true, className }: PageLoaderProps) {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center',
            'bg-premier-black/90 backdrop-blur-lg',
            className
          )}
        >
          <div className="relative">
            {/* Outer ring */}
            <motion.div
              className="h-24 w-24 rounded-full border-4 border-premier-gold/20"
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            
            {/* Inner ring */}
            <motion.div
              className="absolute inset-0 h-24 w-24 rounded-full border-4 border-transparent border-t-premier-gold"
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            
            {/* Center glow */}
            <motion.div
              className="absolute inset-0 m-auto h-12 w-12 rounded-full bg-premier-gold/30 blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
          
          {/* Loading text */}
          <motion.p
            className="absolute bottom-1/3 text-premier-lg text-gradient-gold font-serif"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Loading...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
