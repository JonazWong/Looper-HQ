/**
 * Validation utilities
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Hong Kong mobile number
 */
export function isValidHKMobile(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // HK mobile: 8 digits starting with 5, 6, 7, or 9
  return /^[5679]\d{7}$/.test(cleaned);
}

/**
 * Validate Hong Kong phone number (mobile or landline)
 */
export function isValidHKPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // HK phone: 8 digits
  return /^\d{8}$/.test(cleaned);
}

/**
 * Validate Hong Kong ID card number (HKID)
 * Format: A123456(7) or AB123456(7)
 */
export function isValidHKID(hkid: string): boolean {
  const cleaned = hkid.toUpperCase().replace(/\s/g, '');
  const hkidRegex = /^[A-Z]{1,2}\d{6}\(\d\)$/;
  
  if (!hkidRegex.test(cleaned)) {
    return false;
  }
  
  // Validate check digit
  const letters = cleaned.match(/[A-Z]+/)?.[0] || '';
  const digits = cleaned.match(/\d+/g) || [];
  const mainDigits = digits[0];
  const mainDigits = digits[0] || '';
  const checkDigit = parseInt(digits[1]);
  
  let sum = 0;
  if (letters.length === 2) {
    sum += (letters.charCodeAt(0) - 64) * 9;
    sum += (letters.charCodeAt(1) - 64) * 8;
  } else {
    sum += 36 * 9; // Treat single letter as space + letter
    sum += (letters.charCodeAt(0) - 64) * 8;
  }
  
  for (let i = 0; i < mainDigits.length; i++) {
    sum += parseInt(mainDigits[i]) * (7 - i);
  }
  
  const remainder = sum % 11;
  const expectedCheck = remainder === 0 ? 0 : 11 - remainder;
  
  return expectedCheck === checkDigit;
}

/**
 * Validate Hong Kong business registration number
 * Format: 8 digits or 8 digits with hyphen (e.g., 12345678 or 12345678-000-01-23-4)
 */
export function isValidHKBusinessReg(brn: string): boolean {
  const cleaned = brn.replace(/\s/g, '');
  // Simple validation: 8 digits
  return /^\d{8}(-\d{3}-\d{2}-\d{2}-\d)?$/.test(cleaned);
}

/**
 * Validate case number format
 * Format: HK-YYYY-NNN (e.g., HK-2026-001)
 */
export function isValidCaseNumber(caseNumber: string): boolean {
  return /^HK-\d{4}-\d{3,}$/.test(caseNumber.toUpperCase());
}

/**
 * Validate invoice number format
 * Format: INV-YYYYMMDD-NNN (e.g., INV-20260201-001)
 */
export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  return /^INV-\d{8}-\d{3,}$/.test(invoiceNumber.toUpperCase());
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHTML(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Check if string is empty or whitespace
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Check if value is a valid number
 */
export function isNumeric(value: any): boolean {
  return !isNaN(parseFloat(value)) && isFinite(value);
}
