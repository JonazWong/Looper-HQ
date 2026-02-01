import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to Hong Kong timezone
 */
export function formatHKDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-HK', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/**
 * Format datetime to Hong Kong timezone
 */
export function formatHKDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-HK', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Format date in short format (DD/MM/YYYY)
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-GB').format(d)
}

/**
 * Format currency in HKD
 */
export function formatCurrency(amount: number, currency: string = 'HKD'): string {
  return new Intl.NumberFormat('en-HK', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Format Hong Kong phone number
 */
export function formatPhoneHK(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Format as XXXX XXXX for 8-digit numbers
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`
  }
  
  // Format as +852 XXXX XXXX for numbers with country code
  if (cleaned.length === 11 && cleaned.startsWith('852')) {
    return `+852 ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`
  }
  
  return phone
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate Hong Kong ID card number format (basic format check only)
 * Note: This validates the format but not the check digit algorithm
 * For full validation with check digit, use the validation package
 */
export function isValidHKIDFormat(hkid: string): boolean {
  // Remove spaces, parentheses and convert to uppercase
  const cleaned = hkid.replace(/[\s()]/g, '').toUpperCase()
  
  // HKID format: 1-2 letters + 6 digits + check digit (digit or 'A')
  const hkidRegex = /^[A-Z]{1,2}\d{6}[0-9A]$/
  
  return hkidRegex.test(cleaned)
}

// Alias for backwards compatibility
export const isValidHKID = isValidHKIDFormat

/**
 * Validate case number format (HK-YYYY-XXX)
 */
export function isValidCaseNumber(caseNumber: string): boolean {
  const caseNumberRegex = /^HK-\d{4}-\d{3}$/
  return caseNumberRegex.test(caseNumber)
}
