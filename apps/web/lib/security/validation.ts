import { NextRequest, NextResponse } from 'next/server';

/**
 * Input validation utilities
 */

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate input against schema
 */
export function validateInput(data: unknown, schema: ValidationSchema): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof data !== 'object' || data === null) {
    errors.push({
      field: 'root',
      message: 'Input must be an object',
    });
    return errors;
  }

  const obj = data as Record<string, unknown>;

  for (const [field, rule] of Object.entries(schema)) {
    const value = obj[field];

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field,
        message: `Field "${field}" is required`,
      });
      continue;
    }

    // Skip validation if not required and empty
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Check type
    if (rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type) {
        errors.push({
          field,
          message: `Field "${field}" must be of type ${rule.type}, got ${actualType}`,
        });
        continue;
      }
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push({
          field,
          message: `Field "${field}" must be at least ${rule.minLength} characters long`,
        });
      }

      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push({
          field,
          message: `Field "${field}" must be at most ${rule.maxLength} characters long`,
        });
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field,
          message: `Field "${field}" has invalid format`,
        });
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field,
          message: `Field "${field}" must be at least ${rule.min}`,
        });
      }

      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field,
          message: `Field "${field}" must be at most ${rule.max}`,
        });
      }
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        const message = typeof result === 'string' ? result : `Field "${field}" failed validation`;
        errors.push({
          field,
          message,
        });
      }
    }
  }

  return errors;
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  phone: /^\+?[\d\s-()]+$/,
};
