import { z } from 'zod'

// Case validation schemas
export const caseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  category: z.enum([
    'CIVIL',
    'CRIMINAL',
    'CORPORATE',
    'FAMILY',
    'PROPERTY',
    'EMPLOYMENT',
    'INTELLECTUAL_PROPERTY',
    'OTHER',
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['ACTIVE', 'PENDING', 'COMPLETED', 'ARCHIVED', 'CANCELLED']).default('ACTIVE'),
  clientId: z.string(),
  lawyerId: z.string().optional(),
  courtDate: z.string().datetime().optional(),
  estimatedValue: z.number().positive().optional(),
  isPublic: z.boolean().default(false),
  publicNote: z.string().optional(),
})

export const updateCaseSchema = caseSchema.partial()

export type CaseInput = z.infer<typeof caseSchema>
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>

// Client validation schemas
export const clientSchema = z.object({
  type: z.enum(['INDIVIDUAL', 'COMPANY']).default('INDIVIDUAL'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  companyName: z.string().optional(),
  idNumber: z.string().optional(),
  businessReg: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 characters'),
  address: z.string().optional(),
  membershipTier: z.enum(['BASIC', 'STANDARD', 'PREMIUM', 'PREMIER']).default('BASIC'),
})

export const updateClientSchema = clientSchema.partial()

export type ClientInput = z.infer<typeof clientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>

// Document validation schemas
export const documentSchema = z.object({
  caseId: z.string().optional(),
  fileName: z.string(),
  fileSize: z.number().positive(),
  fileType: z.string(),
  fileUrl: z.string().url(),
  category: z.enum([
    'CONTRACT',
    'EVIDENCE',
    'COURT_FILING',
    'CORRESPONDENCE',
    'INVOICE',
    'OTHER',
  ]),
  description: z.string().optional(),
  isConfidential: z.boolean().default(false),
})

export type DocumentInput = z.infer<typeof documentSchema>

// Case note validation schemas
export const caseNoteSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty'),
  isPrivate: z.boolean().default(false),
})

export type CaseNoteInput = z.infer<typeof caseNoteSchema>

// Search validation schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty'),
  category: z.enum([
    'CIVIL',
    'CRIMINAL',
    'CORPORATE',
    'FAMILY',
    'PROPERTY',
    'EMPLOYMENT',
    'INTELLECTUAL_PROPERTY',
    'OTHER',
  ]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'COMPLETED', 'ARCHIVED', 'CANCELLED']).optional(),
})

export type SearchInput = z.infer<typeof searchSchema>

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
})

export type PaginationInput = z.infer<typeof paginationSchema>

// Filter schemas
export const caseFilterSchema = z.object({
  status: z.enum(['ACTIVE', 'PENDING', 'COMPLETED', 'ARCHIVED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  category: z.enum([
    'CIVIL',
    'CRIMINAL',
    'CORPORATE',
    'FAMILY',
    'PROPERTY',
    'EMPLOYMENT',
    'INTELLECTUAL_PROPERTY',
    'OTHER',
  ]).optional(),
  clientId: z.string().optional(),
  lawyerId: z.string().optional(),
  search: z.string().optional(),
})

export type CaseFilterInput = z.infer<typeof caseFilterSchema>
