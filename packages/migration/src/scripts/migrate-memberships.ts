import { PrismaClient, MembershipTier } from '@prisma/client'
import { readLegacyData } from '../utils/database.js'
import { Logger, saveErrors } from '../utils/logger.js'

/**
 * Map legacy tier to search limit
 */
function getSearchLimit(tier: MembershipTier): number {
  const searchLimits: Record<MembershipTier, number> = {
    [MembershipTier.BASIC]: 10,
    [MembershipTier.STANDARD]: 50,
    [MembershipTier.PREMIUM]: 200,
    [MembershipTier.PREMIER]: -1 // Unlimited
  }
  
  return searchLimits[tier]
}

/**
 * Map legacy tier to case limit
 */
function getCaseLimit(tier: MembershipTier): number | null {
  const caseLimits: Record<MembershipTier, number | null> = {
    [MembershipTier.BASIC]: 1,
    [MembershipTier.STANDARD]: 5,
    [MembershipTier.PREMIUM]: 20,
    [MembershipTier.PREMIER]: null // Unlimited
  }
  
  return caseLimits[tier]
}

/**
 * Migrate memberships and create default memberships for clients without them
 */
export async function migrateMemberships(prisma: PrismaClient, logger: Logger) {
  logger.info('🚀 Starting membership migration...')
  
  // Read legacy memberships
  const hkSystemMemberships = await readLegacyData('hk-legalcase-system/memberships.json')
  
  logger.info(`Found ${hkSystemMemberships.length} legacy memberships to migrate`)
  
  let migratedCount = 0
  let errorCount = 0
  const errors: any[] = []
  
  // Get all users who need memberships
  const allUsers = await prisma.user.findMany({
    where: {
      role: 'CLIENT'
    },
    include: {
      memberships: true
    }
  })
  
  logger.info(`Found ${allUsers.length} client users`)
  
  // Track which users have memberships
  const usersWithMemberships = new Set<string>()
  
  // Migrate existing membership records
  for (const legacyMembership of hkSystemMemberships) {
    try {
      // Find user by email or legacy ID
      const user = allUsers.find(u => 
        u.email === legacyMembership.email ||
        u.email === legacyMembership.user_email
      )
      
      if (!user) {
        logger.warn(`User not found for membership: ${legacyMembership.email || legacyMembership.user_email}`)
        errorCount++
        errors.push({
          membership: legacyMembership,
          error: 'User not found'
        })
        continue
      }
      
      // Map tier
      const tierMap: Record<string, MembershipTier> = {
        'basic': MembershipTier.BASIC,
        'free': MembershipTier.BASIC,
        'standard': MembershipTier.STANDARD,
        'regular': MembershipTier.STANDARD,
        'premium': MembershipTier.PREMIUM,
        'pro': MembershipTier.PREMIUM,
        'premier': MembershipTier.PREMIER,
        'enterprise': MembershipTier.PREMIER
      }
      
      const tier = tierMap[legacyMembership.tier?.toLowerCase()] || MembershipTier.BASIC
      const searchLimit = getSearchLimit(tier)
      const caseLimit = getCaseLimit(tier)
      
      // Parse dates
      const startDate = legacyMembership.start_date 
        ? new Date(legacyMembership.start_date) 
        : new Date()
      const endDate = legacyMembership.end_date 
        ? new Date(legacyMembership.end_date) 
        : null
      
      // Create membership
      await prisma.membership.create({
        data: {
          userId: user.id,
          tier,
          startDate,
          endDate,
          isActive: legacyMembership.is_active !== false, // Default to true
          searchLimit,
          caseLimit,
          createdAt: legacyMembership.created_at 
            ? new Date(legacyMembership.created_at) 
            : new Date(),
          updatedAt: new Date()
        }
      })
      
      usersWithMemberships.add(user.id)
      migratedCount++
      
      if (migratedCount % 10 === 0) {
        logger.info(`Progress: ${migratedCount}/${hkSystemMemberships.length}`)
      }
    } catch (error: any) {
      errorCount++
      errors.push({
        membership: legacyMembership,
        error: error.message,
        stack: error.stack
      })
      logger.error(`Failed to migrate membership: ${error.message}`)
    }
  }
  
  logger.info(`✅ Migrated ${migratedCount} memberships from legacy data`)
  
  // Create default BASIC memberships for users without memberships
  const usersNeedingMemberships = allUsers.filter(u => !usersWithMemberships.has(u.id))
  
  logger.info(`Creating default memberships for ${usersNeedingMemberships.length} users...`)
  
  let defaultCreatedCount = 0
  
  for (const user of usersNeedingMemberships) {
    try {
      await prisma.membership.create({
        data: {
          userId: user.id,
          tier: MembershipTier.BASIC,
          startDate: new Date(),
          isActive: true,
          searchLimit: getSearchLimit(MembershipTier.BASIC),
          caseLimit: getCaseLimit(MembershipTier.BASIC)
        }
      })
      
      defaultCreatedCount++
    } catch (error: any) {
      logger.error(`Failed to create default membership for user ${user.id}: ${error.message}`)
    }
  }
  
  logger.info(`✅ Created ${defaultCreatedCount} default memberships`)
  
  if (errorCount > 0) {
    logger.warn(`⚠️  ${errorCount} memberships failed to migrate`)
    const errorFile = await saveErrors('memberships', errors)
    logger.info(`Error details saved to: ${errorFile}`)
  }
  
  return { 
    migratedCount, 
    defaultCreatedCount,
    errorCount, 
    errors 
  }
}

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const { createLogger } = await import('../utils/logger.js')
  const logger = createLogger('migrate-memberships')
  const prisma = new PrismaClient()
  
  migrateMemberships(prisma, logger)
    .then(result => {
      logger.info('Membership migration complete:', result)
      return prisma.$disconnect()
    })
    .then(() => process.exit(0))
    .catch(error => {
      logger.error('Membership migration failed:', error)
      prisma.$disconnect().then(() => process.exit(1))
    })
}
