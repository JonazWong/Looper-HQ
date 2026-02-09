import { describe, it, expect } from 'vitest'
import { locales, defaultLocale } from '@/i18n'

describe('i18n Configuration', () => {
  it('should have correct locales defined', () => {
    expect(locales).toEqual(['zh', 'en'])
    expect(locales).toHaveLength(2)
  })

  it('should have zh as default locale', () => {
    expect(defaultLocale).toBe('zh')
  })

  it('should include both Traditional Chinese and English', () => {
    expect(locales).toContain('zh')
    expect(locales).toContain('en')
  })
})
