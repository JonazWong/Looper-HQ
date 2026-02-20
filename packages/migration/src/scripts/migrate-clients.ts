import { PrismaClient } from '@prisma/client'
import { transformClient, clearEmailCache, setClientIdMapping } from '../transformers/client-transformer.js'
import { readLegacyData } from '../utils/database.js'
import { Logger, saveErrors } from '../utils/logger.js'

/**
 * Migrate clients and create corresponding user records
 */
export async function migrateClients(prisma: PrismaClient, logger: Logger) {
  logger.info('🚀 Starting client migration...')
  
  // Clear email cache to start fresh
  clearEmailCache()
  
  // Read legacy clients from both sources
  const hkAgencyClients = await readLegacyData('hk-legal-case-agency/clients.json')
  const hkSystemClients = await readLegacyData('hk-legalcase-system/clients.json')
  
  const allLegacyClients = [...hkAgencyClients, ...hkSystemClients]
  
  logger.info(`Found ${allLegacyClients.length} legacy clients to migrate`)
  
  if (allLegacyClients.length === 0) {
    logger.warn('No legacy clients found. Skipping client migration.')
    return { migratedCount: 0, errorCount: 0, errors: [] }
  }
  
  let migratedCount = 0
  let errorCount = 0
  const errors: any[] = []
  
  // Process clients sequentially to handle duplicates properly
  for (let i = 0; i < allLegacyClients.length; i++) {
    const legacyClient = allLegacyClients[i]
    const sourceSystem = i < hkAgencyClients.length ? 'HK-Legal-Case-Agency' : 'hk-legalcase-system'
    
    try {
      // Transform legacy client
      const transformed = await transformClient(legacyClient, sourceSystem)
      
      // Create user first
      const user = await prisma.user.create({
        data: transformed.user
      })
      
      logger.info(`Created user: ${user.email} (ID: ${user.id})`)
      
      // Create client record linked to user
      const client = await prisma.client.create({
        data: {
          ...transformed.client,
          userId: user.id
        }
      })
      
      logger.info(`Created client: ${client.email} (ID: ${client.id})`)
      
      // Store mapping from legacy ID to new user ID for case migration
      setClientIdMapping(String(transformed.metadata.legacyId), user.id)
      
      // Log activity
      await prisma.activity.create({
        data: {
          userId: user.id,
          activityType: 'CLIENT_ADDED',
          action: 'Data Migration',
          description: `Migrated client from ${sourceSystem}`,
          metaData: transformed.metadata
        }
      })
      
      migratedCount++
      
      if ((i + 1) % 10 === 0) {
        logger.info(`Progress: ${i + 1}/${allLegacyClients.length}`)
      }
    } catch (error: any) {
      errorCount++
      const errorInfo = {
        legacyClient,
        sourceSystem,
        error: error.message,
        stack: error.stack
      }
      errors.push(errorInfo)
      logger.error(`Failed to migrate client: ${error.message}`, errorInfo)
    }
  }
  
  logger.info(`✅ Migrated ${migratedCount} clients`)
  
  if (errorCount > 0) {
    logger.warn(`⚠️  ${errorCount} clients failed to migrate`)
    const errorFile = await saveErrors('clients', errors)
    logger.info(`Error details saved to: ${errorFile}`)
  }
  
  return { migratedCount, errorCount, errors }
}

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const { createLogger } = await import('../utils/logger.js')
  const logger = createLogger('migrate-clients')
  const prisma = new PrismaClient()
  
  migrateClients(prisma, logger)
    .then(result => {
      logger.info('Client migration complete:', result)
      return prisma.$disconnect()
    })
    .then(() => process.exit(0))
    .catch(error => {
      logger.error('Client migration failed:', error)
      prisma.$disconnect().then(() => process.exit(1))
    })
}
