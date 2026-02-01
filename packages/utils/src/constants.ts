/**
 * Application constants
 */

export const APP_NAME = 'Looper HQ';
export const APP_DESCRIPTION = 'Unified Legal Case Management & Inquiry Platform for Hong Kong';

export const HONG_KONG_TIMEZONE = 'Asia/Hong_Kong';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const FILE_UPLOAD_MAX_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
];

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  LAWYER: 'LAWYER',
  CLIENT: 'CLIENT',
  STAFF: 'STAFF',
} as const;

export const CASE_STATUSES = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
  CANCELLED: 'CANCELLED',
} as const;

export const PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export const CASE_CATEGORIES = {
  CIVIL: 'CIVIL',
  CRIMINAL: 'CRIMINAL',
  CORPORATE: 'CORPORATE',
  FAMILY: 'FAMILY',
  PROPERTY: 'PROPERTY',
  EMPLOYMENT: 'EMPLOYMENT',
  INTELLECTUAL_PROPERTY: 'INTELLECTUAL_PROPERTY',
  OTHER: 'OTHER',
} as const;

export const MEMBERSHIP_TIERS = {
  BASIC: 'BASIC',
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM',
  PREMIER: 'PREMIER',
} as const;

export const MEMBERSHIP_SEARCH_LIMITS = {
  BASIC: 10,
  STANDARD: 50,
  PREMIUM: 200,
  PREMIER: -1, // Unlimited
} as const;

export const INVOICE_STATUSES = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;

export const DOCUMENT_CATEGORIES = {
  CONTRACT: 'CONTRACT',
  EVIDENCE: 'EVIDENCE',
  COURT_FILING: 'COURT_FILING',
  CORRESPONDENCE: 'CORRESPONDENCE',
  INVOICE: 'INVOICE',
  OTHER: 'OTHER',
} as const;

export const ACTIVITY_TYPES = {
  CASE_CREATED: 'CASE_CREATED',
  CASE_UPDATED: 'CASE_UPDATED',
  CASE_CLOSED: 'CASE_CLOSED',
  DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
  CLIENT_ADDED: 'CLIENT_ADDED',
  MEETING_SCHEDULED: 'MEETING_SCHEDULED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  NOTE_ADDED: 'NOTE_ADDED',
  STATUS_CHANGED: 'STATUS_CHANGED',
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
  RATE_LIMIT: 'Rate limit exceeded',
  SEARCH_LIMIT_EXCEEDED: 'Monthly search limit exceeded. Please upgrade your membership.',
} as const;

export const SUCCESS_MESSAGES = {
  CREATED: 'Successfully created',
  UPDATED: 'Successfully updated',
  DELETED: 'Successfully deleted',
  UPLOADED: 'Successfully uploaded',
} as const;
