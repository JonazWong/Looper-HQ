import { z } from 'zod'
import { CaseStatus, Priority, CaseCategory } from '@prisma/client'

// Legacy case schema (flexible to handle various legacy formats)
const LegacyCaseSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  title_zh: z.string().optional().nullable(),
  title_en: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  description_zh: z.string().optional().nullable(),
  description_en: z.string().optional().nullable(),
  status: z.string().optional().default('active'),
  priority: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  client_id: z.union([z.string(), z.number()]).optional().nullable(),
  clientId: z.union([z.string(), z.number()]).optional().nullable(),
  lawyer_id: z.union([z.string(), z.number()]).optional().nullable(),
  lawyerId: z.union([z.string(), z.number()]).optional().nullable(),
  created_at: z.union([z.string(), z.date()]).optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updated_at: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
  start_date: z.union([z.string(), z.date()]).optional().nullable(),
  startDate: z.union([z.string(), z.date()]).optional().nullable(),
  end_date: z.union([z.string(), z.date()]).optional().nullable(),
  endDate: z.union([z.string(), z.date()]).optional().nullable(),
  court_date: z.union([z.string(), z.date()]).optional().nullable(),
  courtDate: z.union([z.string(), z.date()]).optional().nullable(),
  is_public: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional().nullable(),
  public_note: z.string().optional().nullable(),
  publicNote: z.string().optional().nullable(),
  publicNote_zh: z.string().optional().nullable(),
  publicNote_en: z.string().optional().nullable(),
}).passthrough() // Allow additional fields

export type LegacyCase = z.infer<typeof LegacyCaseSchema>

// Client ID mapping cache
const clientIdMap = new Map<string, string>()

/**
 * Set client ID mapping for legacy to new ID conversion
 */
export function setClientIdMapping(legacyId: string, newId: string): void {
  clientIdMap.set(String(legacyId), newId)
}

/**
 * Map legacy status to new CaseStatus enum
 */
function mapStatus(legacyStatus: string): CaseStatus {
  const statusMap: Record<string, CaseStatus> = {
    'open': CaseStatus.ACTIVE,
    'active': CaseStatus.ACTIVE,
    'in_progress': CaseStatus.ACTIVE,
    'pending': CaseStatus.PENDING,
    'on_hold': CaseStatus.PENDING,
    'closed': CaseStatus.COMPLETED,
    'completed': CaseStatus.COMPLETED,
    'resolved': CaseStatus.COMPLETED,
    'archived': CaseStatus.ARCHIVED,
    'cancelled': CaseStatus.CANCELLED,
    'canceled': CaseStatus.CANCELLED,
    'dismissed': CaseStatus.CANCELLED,
  }
  
  const normalized = legacyStatus.toLowerCase().trim()
  return statusMap[normalized] || CaseStatus.ACTIVE
}

/**
 * Map legacy priority to new Priority enum
 */
function mapPriority(legacyPriority: string | null | undefined): Priority {
  if (!legacyPriority) return Priority.MEDIUM
  
  const priorityMap: Record<string, Priority> = {
    'low': Priority.LOW,
    '1': Priority.LOW,
    'normal': Priority.MEDIUM,
    'medium': Priority.MEDIUM,
    '2': Priority.MEDIUM,
    'high': Priority.HIGH,
    '3': Priority.HIGH,
    'urgent': Priority.URGENT,
    'critical': Priority.URGENT,
    '4': Priority.URGENT,
  }
  
  const normalized = String(legacyPriority).toLowerCase().trim()
  return priorityMap[normalized] || Priority.MEDIUM
}

/**
 * Map legacy category to new CaseCategory enum
 */
function mapCategory(legacyCategory: string | null | undefined): CaseCategory {
  if (!legacyCategory) return CaseCategory.OTHER
  
  const categoryMap: Record<string, CaseCategory> = {
    'civil': CaseCategory.CIVIL,
    'criminal': CaseCategory.CRIMINAL,
    'corporate': CaseCategory.CORPORATE,
    'business': CaseCategory.CORPORATE,
    'family': CaseCategory.FAMILY,
    'divorce': CaseCategory.FAMILY,
    'property': CaseCategory.PROPERTY,
    'real_estate': CaseCategory.PROPERTY,
    'employment': CaseCategory.EMPLOYMENT,
    'labor': CaseCategory.EMPLOYMENT,
    'intellectual_property': CaseCategory.INTELLECTUAL_PROPERTY,
    'ip': CaseCategory.INTELLECTUAL_PROPERTY,
    'patent': CaseCategory.INTELLECTUAL_PROPERTY,
    'trademark': CaseCategory.INTELLECTUAL_PROPERTY,
  }
  
  const normalized = String(legacyCategory).toLowerCase().trim().replace(/\s+/g, '_')
  return categoryMap[normalized] || CaseCategory.OTHER
}

/**
 * Generate new case number in format HK-YYYY-XXXXXX
 */
function generateCaseNumber(legacyId: string | number): string {
  const year = new Date().getFullYear()
  const paddedId = String(legacyId).padStart(6, '0').slice(-6)
  return `HK-${year}-${paddedId}`
}

/**
 * Map legacy client ID to new client ID
 */
async function mapClientId(legacyClientId: string | number | null | undefined): Promise<string | null> {
  if (!legacyClientId) return null
  
  const legacyIdStr = String(legacyClientId)
  return clientIdMap.get(legacyIdStr) || null
}

/**
 * Parse date from various formats
 */
function parseDate(dateValue: string | Date | null | undefined): Date | null {
  if (!dateValue) return null
  
  if (dateValue instanceof Date) return dateValue
  
  try {
    const parsed = new Date(dateValue)
    return isNaN(parsed.getTime()) ? null : parsed
  } catch {
    return null
  }
}

/**
 * Determine if case should be public
 */
function determinePublicVisibility(legacyCase: LegacyCase): boolean {
  // Check is_public or isPublic field
  if (legacyCase.is_public !== undefined && legacyCase.is_public !== null) {
    return Boolean(legacyCase.is_public)
  }
  if (legacyCase.isPublic !== undefined && legacyCase.isPublic !== null) {
    return Boolean(legacyCase.isPublic)
  }
  
  // Default to false (private)
  return false
}

/**
 * Transform legacy case data to new schema
 */
export async function transformCase(legacyCase: unknown, sourceSystem: string = 'Unknown') {
  // Validate and parse legacy data
  const validated = LegacyCaseSchema.parse(legacyCase)
  
  // Determine client ID (support both snake_case and camelCase)
  const legacyClientId = validated.client_id || validated.clientId
  const clientId = await mapClientId(legacyClientId)
  
  if (!clientId) {
    throw new Error(`No client mapping found for legacy case ${validated.id}`)
  }
  
  // Determine lawyer ID
  const legacyLawyerId = validated.lawyer_id || validated.lawyerId
  const lawyerId = legacyLawyerId ? await mapClientId(legacyLawyerId) : null
  
  // Determine dates
  const createdDate = parseDate(validated.created_at || validated.createdAt) || new Date()
  const startDateValue = parseDate(validated.start_date || validated.startDate) || createdDate
  
  return {
    caseNumber: generateCaseNumber(validated.id),
    // Bilingual fields - use provided values or fallback to single title/description
    title_zh: validated.title_zh || validated.title,
    title_en: validated.title_en || validated.title,
    description_zh: validated.description_zh || validated.description || null,
    description_en: validated.description_en || validated.description || null,
    publicNote_zh: validated.publicNote_zh || validated.public_note || validated.publicNote || null,
    publicNote_en: validated.publicNote_en || validated.public_note || validated.publicNote || null,
    status: mapStatus(validated.status),
    priority: mapPriority(validated.priority),
    category: mapCategory(validated.category),
    clientId,
    lawyerId,
    startDate: startDateValue,
    endDate: parseDate(validated.end_date || validated.endDate),
    courtDate: parseDate(validated.court_date || validated.courtDate),
    isPublic: determinePublicVisibility(validated),
    createdAt: createdDate,
    updatedAt: parseDate(validated.updated_at || validated.updatedAt) || new Date(),
    // Store metadata for tracking
    metadata: {
      legacyId: validated.id,
      migratedAt: new Date().toISOString(),
      sourceSystem
    }
  }
}
