'use client'

/**
 * PremierButton - Luxury Action Button
 * Premier Design System
 */

import * as React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { LucideIcon, Loader2 } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { buttonHoverVariants } from '@/lib/animations'

const premierButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-premier-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premier-gold disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-premier-gold to-premier-gold-rose text-premier-black shadow-premier-glow hover:shadow-premier-glow-lg',
        secondary: 'glass-card text-premier-pearl hover:bg-premier-gold/10 border border-premier-gold/30',
        ghost: 'text-premier-gold hover:bg-premier-gold/10',
        outline: 'border-2 border-premier-gold text-premier-gold hover:bg-premier-gold hover:text-premier-black',
        mystery: 'bg-gradient-to-r from-premier-mystery-violet to-premier-mystery-purple text-premier-pearl shadow-premier-md hover:shadow-premier-lg',
      },
      size: {
        default: 'h-10 px-6 py-2',
        sm: 'h-8 px-4 text-xs',
        lg: 'h-12 px-8 text-base',
        xl: 'h-14 px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

type MotionButtonProps = Omit<HTMLMotionProps<'button'>, 'ref' | 'children'>

export interface PremierButtonProps
  extends MotionButtonProps,
    VariantProps<typeof premierButtonVariants> {
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  children?: React.ReactNode
}

/**
 * PremierButton Component
 * 
 * @example
 * ```tsx
 * <PremierButton variant="primary" icon={Plus}>
 *   New Case
 * </PremierButton>
 * ```
 */
export const PremierButton = React.forwardRef<HTMLButtonElement, PremierButtonProps>(
  ({ className, variant, size, icon: Icon, iconPosition = 'left', loading, children, ...props }, ref) => {
    return (
      <motion.button
        className={cn(premierButtonVariants({ variant, size, className }))}
        ref={ref}
        whileHover="hover"
        whileTap="tap"
        variants={buttonHoverVariants}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && Icon && iconPosition === 'left' && <Icon className="h-4 w-4" />}
        {children}
        {!loading && Icon && iconPosition === 'right' && <Icon className="h-4 w-4" />}
      </motion.button>
    )
  }
)

PremierButton.displayName = 'PremierButton'
