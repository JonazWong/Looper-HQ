import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatFileSize,
  formatPhoneHK,
  formatHKDate,
  formatHKDateTime,
  formatDateShort,
  isValidEmail,
  isValidHKID,
  isValidCaseNumber,
  cn,
} from '@/lib/utils'

describe('Formatting Utilities', () => {
  describe('formatCurrency', () => {
    it('should format HKD currency by default', () => {
      expect(formatCurrency(1000)).toBe('HK$1,000.00')
      expect(formatCurrency(1234.56)).toBe('HK$1,234.56')
    })

    it('should format with specified currency', () => {
      expect(formatCurrency(1000, 'USD')).toContain('1,000.00')
    })

    it('should handle zero amount', () => {
      expect(formatCurrency(0)).toBe('HK$0.00')
    })

    it('should handle negative amounts', () => {
      const result = formatCurrency(-500)
      expect(result).toContain('500')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(500)).toBe('500 Bytes')
    })

    it('should format KB correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(2048)).toBe('2 KB')
    })

    it('should format MB correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB')
    })

    it('should format GB correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })

    it('should handle decimal values', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
    })
  })

  describe('formatPhoneHK', () => {
    it('should format 8-digit HK phone numbers', () => {
      expect(formatPhoneHK('12345678')).toBe('1234 5678')
      expect(formatPhoneHK('91234567')).toBe('9123 4567')
    })

    it('should format numbers with country code', () => {
      expect(formatPhoneHK('85212345678')).toBe('+852 1234 5678')
    })

    it('should handle already formatted numbers', () => {
      expect(formatPhoneHK('1234 5678')).toBe('1234 5678')
    })

    it('should handle numbers with special characters', () => {
      expect(formatPhoneHK('+852-1234-5678')).toBe('+852 1234 5678')
    })

    it('should return original if format is not recognized', () => {
      expect(formatPhoneHK('123')).toBe('123')
    })
  })

  describe('formatHKDate', () => {
    it('should format Date object to HK format', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = formatHKDate(date)
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })

    it('should format date string to HK format', () => {
      const formatted = formatHKDate('2024-01-15')
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })
  })

  describe('formatHKDateTime', () => {
    it('should format datetime with time', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = formatHKDateTime(date)
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })

    it('should handle string input', () => {
      const formatted = formatHKDateTime('2024-01-15T10:30:00Z')
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })
  })

  describe('formatDateShort', () => {
    it('should format date in DD/MM/YYYY format', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDateShort(date)
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })

    it('should handle string input', () => {
      const formatted = formatDateShort('2024-12-25')
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })
  })
})

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('user+tag@example.com')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('invalid@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('isValidHKID', () => {
    it('should validate HKID format', () => {
      // Test basic format validation
      expect(isValidHKID('A1234567')).toBe(true) // Valid format
      expect(isValidHKID('AB1234567')).toBe(true) // Valid format with 2 letters
    })

    it('should handle HKID with spaces and parentheses', () => {
      expect(isValidHKID('A 123456 (7)')).toBe(true)
      expect(isValidHKID('A123456(7)')).toBe(true)
    })

    it('should handle lowercase letters', () => {
      expect(isValidHKID('a1234567')).toBe(true)
      expect(isValidHKID('ab1234567')).toBe(true)
    })

    it('should reject invalid HKID formats', () => {
      expect(isValidHKID('123456789')).toBe(false) // No letters
      expect(isValidHKID('ABC1234567')).toBe(false) // Too many letters
      expect(isValidHKID('')).toBe(false)
      expect(isValidHKID('A12345')).toBe(false) // Too short
    })
  })

  describe('isValidCaseNumber', () => {
    it('should validate correct case number format', () => {
      expect(isValidCaseNumber('HK-2024-001')).toBe(true)
      expect(isValidCaseNumber('HK-2023-999')).toBe(true)
    })

    it('should reject invalid case number formats', () => {
      expect(isValidCaseNumber('HK-24-001')).toBe(false)
      expect(isValidCaseNumber('HK-2024-1')).toBe(false)
      expect(isValidCaseNumber('2024-001')).toBe(false)
      expect(isValidCaseNumber('HK2024001')).toBe(false)
      expect(isValidCaseNumber('')).toBe(false)
    })
  })
})

describe('CSS Utilities', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('should merge Tailwind classes correctly', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4')
    })

    it('should handle undefined and null', () => {
      expect(cn('foo', undefined, 'bar', null)).toBe('foo bar')
    })
  })
})
