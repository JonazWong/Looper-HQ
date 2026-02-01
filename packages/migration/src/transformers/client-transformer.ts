import { z } from 'zod'
import { ClientType, MembershipTier, UserRole } from '@prisma/client'

// Legacy client schema
const LegacyClientSchema = z.object({
  id: z.union([z.string(), z.number()]),
  full_name: z.string().optional().nullable(),
  fullName: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  company_name: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  id_number: z.string().optional().nullable(),
  idNumber: z.string().optional().nullable(),
  business_reg: z.string().optional().nullable(),
  businessReg: z.string().optional().nullable(),
  membership_tier: z.string().optional().nullable(),
  membershipTier: z.string().optional().nullable(),
  tier: z.string().optional().nullable(),
  created_at: z.union([z.string(), z.date()]).optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
}).passthrough()

export type LegacyClient = z.infer<typeof LegacyClientSchema>

// Email deduplication cache
const emailCache = new Set<string>()

/**
 * Map legacy client type to new ClientType enum
 */
function mapClientType(legacyType: string | null | undefined, hasCompanyName: boolean): ClientType {
  if (!legacyType) {
    return hasCompanyName ? ClientType.COMPANY : ClientType.INDIVIDUAL
  }
  
  const typeMap: Record<string, ClientType> = {
    'individual': ClientType.INDIVIDUAL,
    'person': ClientType.INDIVIDUAL,
    'personal': ClientType.INDIVIDUAL,
    'company': ClientType.COMPANY,
    'corporate': ClientType.COMPANY,
    'business': ClientType.COMPANY,
    'organization': ClientType.COMPANY,
  }
  
  const normalized = String(legacyType).toLowerCase().trim()
  return typeMap[normalized] || ClientType.INDIVIDUAL
}

/**
 * Map legacy membership tier to new MembershipTier enum
 */
function mapMembershipTier(legacyTier: string | null | undefined): MembershipTier {
  if (!legacyTier) return MembershipTier.BASIC
  
  const tierMap: Record<string, MembershipTier> = {
    'basic': MembershipTier.BASIC,
    'free': MembershipTier.BASIC,
    'standard': MembershipTier.STANDARD,
    'regular': MembershipTier.STANDARD,
    'premium': MembershipTier.PREMIUM,
    'pro': MembershipTier.PREMIUM,
    'premier': MembershipTier.PREMIER,
    'enterprise': MembershipTier.PREMIER,
    'platinum': MembershipTier.PREMIER,
  }
  
  const normalized = String(legacyTier).toLowerCase().trim()
  return tierMap[normalized] || MembershipTier.BASIC
}

/**
 * Check if email already exists to prevent duplicates
 */
export function isEmailDuplicate(email: string): boolean {
  const normalized = email.toLowerCase().trim()
  return emailCache.has(normalized)
}

/**
 * Mark email as processed
 */
export function markEmailAsProcessed(email: string): void {
  const normalized = email.toLowerCase().trim()
  emailCache.add(normalized)
}

/**
 * Clear email cache (useful for testing)
 */
export function clearEmailCache(): void {
  emailCache.clear()
}

/**
 * Parse date from various formats
 */
function parseDate(dateValue: string | Date | null | undefined): Date {
  if (!dateValue) return new Date()
  
  if (dateValue instanceof Date) return dateValue
  
  try {
    const parsed = new Date(dateValue)
    return isNaN(parsed.getTime()) ? new Date() : parsed
  } catch {
    return new Date()
  }
}

/**
 * Generate a temporary Keycloak ID (to be synced later with actual Keycloak)
 */
function generateTempKeycloakId(email: string): string {
  // For now, return null as we'll sync with Keycloak in a later step
  return `temp-${email.split('@')[0]}-${Date.now()}`
}

/**
 * Transform legacy client data to new User and Client schema
 */
export async function transformClient(legacyClient: unknown, sourceSystem: string = 'Unknown') {
  // Validate and parse legacy data
  const validated = LegacyClientSchema.parse(legacyClient)
  
  // Check for duplicate email
  if (isEmailDuplicate(validated.email)) {
    throw new Error(`Duplicate email found: ${validated.email}`)
  }
  
  // Determine full name
  const fullName = validated.full_name || validated.fullName || validated.name || 'Unknown'
  const companyName = validated.company_name || validated.companyName || null
  const clientType = mapClientType(validated.type, !!companyName)
  
  // Determine membership tier
  const legacyTier = validated.membership_tier || validated.membershipTier || validated.tier
  const membershipTier = mapMembershipTier(legacyTier)
  
  // Determine ID number and business registration
  const idNumber = validated.id_number || validated.idNumber || null
  const businessReg = validated.business_reg || validated.businessReg || null
  
  // Parse dates
  const createdDate = parseDate(validated.created_at || validated.createdAt)
  
  // Mark email as processed
  markEmailAsProcessed(validated.email)
  
  // Return both User and Client data
  return {
    user: {
      email: validated.email.toLowerCase().trim(),
      name: fullName,
      role: UserRole.CLIENT,
      phone: validated.phone || null,
      createdAt: createdDate,
      updatedAt: new Date(),
      // Keycloak ID will be synced later
      keycloakId: null,
    },
    client: {
      type: clientType,
      fullName,
      companyName,
      email: validated.email.toLowerCase().trim(),
      phone: validated.phone || '',
      address: validated.address || null,
      idNumber,
      businessReg,
      membershipTier,
      createdAt: createdDate,
      updatedAt: new Date(),
    },
    metadata: {
      legacyId: validated.id,
      migratedAt: new Date().toISOString(),
      sourceSystem
    }
  }
}

/**
 * Transform legacy user data specifically (for staff/lawyers)
 */
export async function transformUser(legacyUser: any, role: UserRole = UserRole.CLIENT) {
  const email = legacyUser.email?.toLowerCase().trim()
  
  if (!email) {
    throw new Error('User email is required')
  }
  
  // Check for duplicate email
  if (isEmailDuplicate(email)) {
    throw new Error(`Duplicate email found: ${email}`)
  }
  
  const name = legacyUser.name || legacyUser.full_name || legacyUser.fullName || 'Unknown'
  
  markEmailAsProcessed(email)
  
  return {
    email,
    name,
    role,
    phone: legacyUser.phone || null,
    createdAt: parseDate(legacyUser.created_at || legacyUser.createdAt),
    updatedAt: new Date(),
    keycloakId: null, // Will be synced with Keycloak later
    metadata: {
      legacyId: legacyUser.id,
      migratedAt: new Date().toISOString()
    }
  }
}
