'use client'

/**
 * ActivityTimeline - Recent Activity Feed
 * Premier Design System
 */

import * as React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { LucideIcon, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { itemVariants } from '@/lib/animations'
import { formatDistanceToNow } from 'date-fns'

export interface Activity {
  id: string
  user: {
    name: string
    avatar?: string
    initials?: string
  }
  action: string
  description: string
  timestamp: Date | string
  icon?: LucideIcon
  href?: string
}

export interface ActivityTimelineProps {
  activities: Activity[]
  className?: string
  onActivityClick?: (activity: Activity) => void
  showLoadMore?: boolean
  onLoadMore?: () => void
}

/**
 * ActivityTimeline Component
 * 
 * @example
 * ```tsx
 * <ActivityTimeline
 *   activities={[
 *     {
 *       id: '1',
 *       user: { name: 'John Doe', initials: 'JD' },
 *       action: 'created',
 *       description: 'New case filed',
 *       timestamp: new Date(),
 *     }
 *   ]}
 * />
 * ```
 */
export function ActivityTimeline({
  activities,
  className,
  onActivityClick,
  showLoadMore = false,
  onLoadMore,
}: ActivityTimelineProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {activities.map((activity, index) => {
        const ActivityIcon = activity.icon || Clock
        const timestamp = typeof activity.timestamp === 'string' 
          ? new Date(activity.timestamp) 
          : activity.timestamp

        return (
          <motion.div
            key={activity.id}
            variants={itemVariants}
            initial="hidden"
            animate="show"
            transition={{ delay: index * 0.1 }}
            className={cn(
              'relative flex gap-4 group',
              'cursor-pointer hover:bg-premier-gold/5 -mx-4 px-4 py-2 rounded-premier-md',
              'transition-colors duration-200'
            )}
            onClick={() => onActivityClick?.(activity)}
          >
            {/* Timeline connector */}
            {index < activities.length - 1 && (
              <div className="absolute left-[1.875rem] top-12 bottom-0 w-px bg-gradient-to-b from-premier-gold/50 to-transparent" />
            )}

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-premier-gold to-premier-gold-rose flex items-center justify-center ring-2 ring-premier-gold/20 ring-offset-2 ring-offset-premier-black">
                {activity.user.avatar ? (
                  <Image
                    src={activity.user.avatar}
                    alt={activity.user.name}
                    width={40}
                    height={40}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-premier-black">
                    {activity.user.initials || activity.user.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Icon badge */}
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-premier-black-light border-2 border-premier-gold/30 flex items-center justify-center">
                <ActivityIcon className="h-3 w-3 text-premier-gold" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-premier-pearl">
                    {activity.user.name}
                    <span className="ml-1 text-premier-pearl-gray font-normal">
                      {activity.action}
                    </span>
                  </p>
                  <p className="text-sm text-premier-pearl-gray mt-1">
                    {activity.description}
                  </p>
                </div>
                <time className="flex-shrink-0 text-xs text-premier-pearl-gray/70">
                  {formatDistanceToNow(timestamp, { addSuffix: true })}
                </time>
              </div>
            </div>
          </motion.div>
        )
      })}

      {/* Load More Button */}
      {showLoadMore && (
        <motion.button
          className="w-full py-3 text-sm text-premier-gold hover:text-premier-gold-rose transition-colors rounded-premier-md hover:bg-premier-gold/5"
          onClick={onLoadMore}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Load more activities
        </motion.button>
      )}
    </div>
  )
}
