import { z } from 'zod'

// Case validation schemas
export const caseCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['CIVIL', 'CRIMINAL', 'CORPORATE', 'FAMILY', 'PROPERTY', 'EMPLOYMENT', 'INTELLECTUAL_PROPERTY', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['DRAFT', 'OPEN', 'ACTIVE', 'IN_PROGRESS', 'PENDING', 'COMPLETED', 'CLOSED', 'ARCHIVED', 'CANCELLED']).default('DRAFT'),
  clientId: z.string(),
  lawyerId: z.string().optional(),
  firmId: z.string().optional(),
  budget: z.number().positive().optional(),
  deadline: z.date().optional(),
})

export const caseUpdateSchema = caseCreateSchema.partial().extend({
  id: z.string(),
})

// Client validation schemas
export const legalClientCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  firmId: z.string(),
})

export const legalClientUpdateSchema = legalClientCreateSchema.partial().extend({
  id: z.string(),
})

// Time entry validation schemas
export const timeEntryCreateSchema = z.object({
  caseId: z.string(),
  userId: z.string(),
  description: z.string().min(1, 'Description is required'),
  hours: z.number().positive('Hours must be positive'),
  rate: z.number().positive('Rate must be positive'),
  date: z.date(),
  billable: z.boolean().default(true),
})

export const timeEntryUpdateSchema = timeEntryCreateSchema.partial().extend({
  id: z.string(),
})

// Invoice validation schemas
export const invoiceCreateSchema = z.object({
  caseId: z.string(),
  firmId: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.date(),
  status: z.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).default('DRAFT'),
})

export const invoiceUpdateSchema = invoiceCreateSchema.partial().extend({
  id: z.string(),
})

// Firm validation schemas
export const firmCreateSchema = z.object({
  name: z.string().min(1, 'Firm name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  subscription: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM']).default('STARTER'),
})

export const firmUpdateSchema = firmCreateSchema.partial().extend({
  id: z.string(),
})

// Types inferred from schemas
export type CaseCreate = z.infer<typeof caseCreateSchema>
export type CaseUpdate = z.infer<typeof caseUpdateSchema>
export type LegalClientCreate = z.infer<typeof legalClientCreateSchema>
export type LegalClientUpdate = z.infer<typeof legalClientUpdateSchema>
export type TimeEntryCreate = z.infer<typeof timeEntryCreateSchema>
export type TimeEntryUpdate = z.infer<typeof timeEntryUpdateSchema>
export type InvoiceCreate = z.infer<typeof invoiceCreateSchema>
export type InvoiceUpdate = z.infer<typeof invoiceUpdateSchema>
export type FirmCreate = z.infer<typeof firmCreateSchema>
export type FirmUpdate = z.infer<typeof firmUpdateSchema>
