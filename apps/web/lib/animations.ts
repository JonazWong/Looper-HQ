/**
 * Premier Design System - Animation Library
 * Framer Motion animation presets for consistent, elegant animations
 */

import { Transition, Variants } from 'framer-motion'

/**
 * Custom easing for premier feel
 */
export const premierEasing = [0.43, 0.13, 0.23, 0.96] as const

/**
 * Page transition variants
 */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

export const pageTransition: Transition = {
  duration: 0.4,
  ease: premierEasing
}

/**
 * Stagger children animation
 */
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

/**
 * Card hover animations
 */
export const cardHoverVariants = {
  initial: { y: 0 },
  hover: { 
    y: -4,
    transition: { duration: 0.3, ease: premierEasing }
  }
}

export const cardHoverShadow = '0 12px 48px rgba(212,175,55,0.25)'

/**
 * Button hover animations
 */
export const buttonHoverVariants = {
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
}

/**
 * Fade in animation
 */
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.5, ease: premierEasing }
  }
}

/**
 * Slide in from bottom
 */
export const slideInBottomVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: premierEasing }
  }
}

/**
 * Slide in from left
 */
export const slideInLeftVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5, ease: premierEasing }
  }
}

/**
 * Scale in animation
 */
export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: premierEasing }
  }
}

/**
 * Glow pulse animation
 */
export const glowPulseVariants: Variants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}
