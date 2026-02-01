/**
 * Date utilities for Hong Kong timezone
 * All dates in the system should use Hong Kong timezone (Asia/Hong_Kong)
 */

import { format as dateFnsFormat, parseISO, addDays, addMonths, differenceInDays } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

const HONG_KONG_TZ = 'Asia/Hong_Kong';

/**
 * Get current date/time in Hong Kong timezone
 */
export function nowInHK(): Date {
  return toZonedTime(new Date(), HONG_KONG_TZ);
}

/**
 * Format date to Hong Kong timezone
 */
export function formatDateHK(date: Date | string, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, HONG_KONG_TZ, formatStr);
}

/**
 * Format date for display (short format)
 */
export function formatDateShort(date: Date | string): string {
  return formatDateHK(date, 'dd/MM/yyyy');
}

/**
 * Format date for display (long format)
 */
export function formatDateLong(date: Date | string): string {
  return formatDateHK(date, 'dd MMM yyyy, HH:mm');
}

/**
 * Format time only
 */
export function formatTime(date: Date | string): string {
  return formatDateHK(date, 'HH:mm');
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj < nowInHK();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj > nowInHK();
}

/**
 * Add business days (excluding weekends)
 */
export function addBusinessDays(date: Date, days: number): Date {
  let result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result = addDays(result, 1);
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      addedDays++;
    }
  }
  
  return result;
}

/**
 * Calculate due date (30 days from issue date)
 */
export function calculateDueDate(issueDate: Date): Date {
  return addDays(issueDate, 30);
}

/**
 * Get days until date
 */
export function daysUntil(date: Date | string): number {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return differenceInDays(dateObj, nowInHK());
}

/**
 * Check if invoice is overdue
 */
export function isOverdue(dueDate: Date | string, status: string): boolean {
  if (status === 'PAID' || status === 'CANCELLED') return false;
  return isPast(dueDate);
}
