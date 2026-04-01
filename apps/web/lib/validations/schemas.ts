import { z } from 'zod'

// Shared category values (must stay in sync with Prisma CaseCategory enum)
const CASE_CATEGORY_VALUES = [
  'CIVIL',
  'CRIMINAL',
  'CRIMINAL_APPEAL',
  'CORPORATE',
  'FAMILY',
  'PROPERTY',
  'EMPLOYMENT',
  'INTELLECTUAL_PROPERTY',
  'ADMINISTRATIVE',
  'CONSTITUTIONAL',
  'IMMIGRATION',
  'PERSONAL_INJURY',
  'TORT',
  'CONTRACT',
  'BANKRUPTCY_INSOLVENCY',
  'SECURITIES',
  'ARBITRATION',
  'JUDICIAL_REVIEW',
  'HUMAN_RIGHTS',
  'COMPETITION',
  'TAX',
  'OTHER',
] as const

// Case validation schemas
export const caseSchema = z.object({
  // Bilingual fields
  title_zh: z.string().min(5, 'Chinese title must be at least 5 characters'),
  title_en: z.string().min(5, 'English title must be at least 5 characters'),
  description_zh: z.string().optional(),
  description_en: z.string().optional(),
  publicNote_zh: z.string().optional(),
  publicNote_en: z.string().optional(),
  
  category: z.enum(CASE_CATEGORY_VALUES),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['ACTIVE', 'PENDING', 'COMPLETED', 'ARCHIVED', 'CANCELLED']).default('ACTIVE'),
  clientId: z.string(),
  lawyerId: z.string().optional(),
  courtDate: z.string().datetime().optional(),
  estimatedValue: z.number().positive().optional(),
  isPublic: z.boolean().default(false),
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
  notes_zh: z.string().optional(),
  notes_en: z.string().optional(),
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

export const updateDocumentSchema = z.object({
  fileName: z.string().optional(),
  category: z.enum([
    'CONTRACT',
    'EVIDENCE',
    'COURT_FILING',
    'CORRESPONDENCE',
    'INVOICE',
    'OTHER',
  ]).optional(),
  description: z.string().optional(),
  isConfidential: z.boolean().optional(),
})

export const documentFilterSchema = z.object({
  caseId: z.string().optional(),
  category: z.enum([
    'CONTRACT',
    'EVIDENCE',
    'COURT_FILING',
    'CORRESPONDENCE',
    'INVOICE',
    'OTHER',
  ]).optional(),
  search: z.string().optional(),
})

export type DocumentInput = z.infer<typeof documentSchema>
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>
export type DocumentFilterInput = z.infer<typeof documentFilterSchema>

// Invoice validation schemas
export const invoiceSchema = z.object({
  caseId: z.string(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('HKD'),
  status: z.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).default('PENDING'),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime(),
  paidDate: z.string().datetime().optional(),
})

export const updateInvoiceSchema = z.object({
  amount: z.number().positive().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  paidDate: z.string().datetime().optional(),
})

export const invoiceFilterSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  caseId: z.string().optional(),
})

export type InvoiceInput = z.infer<typeof invoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
export type InvoiceFilterInput = z.infer<typeof invoiceFilterSchema>

// Time log validation schemas
export const timeLogSchema = z.object({
  caseId: z.string(),
  description: z.string().min(1, 'Description cannot be empty'),
  hours: z.number().positive('Hours must be positive'),
  hourlyRate: z.number().positive().optional(),
  billable: z.boolean().default(true),
  logDate: z.string().datetime(),
})

export const updateTimeLogSchema = z.object({
  description: z.string().min(1).optional(),
  hours: z.number().positive().optional(),
  hourlyRate: z.number().positive().optional(),
  billable: z.boolean().optional(),
  logDate: z.string().datetime().optional(),
})

export const timeLogFilterSchema = z.object({
  caseId: z.string().optional(),
  billable: z.coerce.boolean().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})

export type TimeLogInput = z.infer<typeof timeLogSchema>
export type UpdateTimeLogInput = z.infer<typeof updateTimeLogSchema>
export type TimeLogFilterInput = z.infer<typeof timeLogFilterSchema>

// Case note validation schemas
export const caseNoteSchema = z.object({
  // Bilingual fields
  content_zh: z.string().min(1, 'Chinese note content cannot be empty'),
  content_en: z.string().min(1, 'English note content cannot be empty'),
  isPrivate: z.boolean().default(false),
})

export type CaseNoteInput = z.infer<typeof caseNoteSchema>

// Search validation schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty'),
  category: z.enum(CASE_CATEGORY_VALUES).optional(),
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
  category: z.enum(CASE_CATEGORY_VALUES).optional(),
  clientId: z.string().optional(),
  lawyerId: z.string().optional(),
  search: z.string().optional(),
})

export type CaseFilterInput = z.infer<typeof caseFilterSchema>

// AI Pipeline validation schemas

export const embeddingSearchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, 'Query cannot be empty')
    .max(2000, 'Query cannot exceed 2000 characters'),
  limit: z.number().int().positive().max(100).optional().default(10),
  threshold: z.number().min(0).max(1).optional().default(0.5),
})

export type EmbeddingSearchInput = z.infer<typeof embeddingSearchSchema>

export const summarizeSchema = z.object({
  publicCaseId: z.string().optional(),
  text: z.string().min(1).optional(),
}).refine((data) => data.publicCaseId || data.text, {
  message: 'Either publicCaseId or text must be provided',
})

export type SummarizeInput = z.infer<typeof summarizeSchema>

export const pipelineSchema = z.object({
  publicCaseId: z.string().min(1, 'publicCaseId is required'),
  steps: z
    .array(z.enum(['embed', 'classify', 'translate', 'summarize']))
    .optional()
    .default(['embed', 'classify', 'translate', 'summarize']),
})

export type PipelineInput = z.infer<typeof pipelineSchema>

// ============================================
// Airwallex Payment Schemas
// ============================================

export const membershipTierSchema = z.enum(['BASIC', 'STANDARD', 'PREMIUM', 'PREMIER'])
export type MembershipTier = z.infer<typeof membershipTierSchema>

export const paymentStatusSchema = z.enum(['PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED'])
export type PaymentStatus = z.infer<typeof paymentStatusSchema>

/** POST /api/payments/create-intent */
export const createPaymentIntentSchema = z.object({
  planTier: z.enum(['STANDARD', 'PREMIUM', 'PREMIER']).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().default('HKD'),
  description: z.string().optional(),
}).refine((d) => d.planTier || d.amount, {
  message: 'Either planTier or amount must be provided',
})

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>

/** POST /api/admin/payments/create-intent */
export const adminCreatePaymentIntentSchema = z.object({
  userId: z.string().min(1),
  tier: z.enum(['STANDARD', 'PREMIUM', 'PREMIER']),
  amount: z.number().positive(),
  currency: z.string().default('HKD'),
  description: z.string().optional(),
})

export type AdminCreatePaymentIntentInput = z.infer<typeof adminCreatePaymentIntentSchema>

/** PUT /api/admin/payments/plans/[id] */
export const updateMembershipPlanSchema = z.object({
  name_zh: z.string().min(1).optional(),
  name_en: z.string().min(1).optional(),
  description_zh: z.string().optional(),
  description_en: z.string().optional(),
  amount: z.number().nonnegative().nullable().optional(),
  currency: z.string().optional(),
  period: z.string().optional(),
  searchLimit: z.number().int().optional(),
  caseLimit: z.number().int().nullable().optional(),
  isActive: z.boolean().optional(),
  isCustom: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

export type UpdateMembershipPlanInput = z.infer<typeof updateMembershipPlanSchema>

