'use client'

/**
 * Language Switcher Component with Premier Design
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Locale, locales, localeNames } from '@/lib/i18n'

interface LanguageSwitcherProps {
  currentLocale: Locale
  onLocaleChange: (locale: Locale) => void
}

export function LanguageSwitcher({ currentLocale, onLocaleChange }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-premier-md bg-gradient-to-br from-premier-gold/10 to-premier-gold-rose/5 border border-premier-gold/20 text-premier-pearl hover:from-premier-gold/20 hover:to-premier-gold-rose/10 transition-all group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Globe className="h-4 w-4 text-premier-gold group-hover:rotate-12 transition-transform" />
        <span className="text-sm font-medium">{localeNames[currentLocale]}</span>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              className="absolute right-0 top-full mt-2 w-48 glass-card border border-premier-gold/20 rounded-premier-md shadow-premier-glow overflow-hidden z-50"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-2">
                {locales.map((locale) => (
                  <motion.button
                    key={locale}
                    onClick={() => {
                      onLocaleChange(locale)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                      locale === currentLocale
                        ? "bg-gradient-to-br from-premier-gold/20 to-premier-gold-rose/10 text-premier-gold"
                        : "text-premier-pearl-gray hover:bg-premier-gold/10 hover:text-premier-pearl"
                    )}
                    whileHover={{ x: 2 }}
                  >
                    <span>{localeNames[locale]}</span>
                    {locale === currentLocale && (
                      <Check className="h-4 w-4 text-premier-gold" />
                    )}
                  </motion.button>
                ))}
              </div>
              
              {/* Decorative border */}
              <div className="h-px bg-gradient-to-r from-transparent via-premier-gold/50 to-transparent" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
