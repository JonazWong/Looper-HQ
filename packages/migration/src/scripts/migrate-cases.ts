import { PrismaClient } from '@prisma/client'
import { transformCase } from '../transformers/case-transformer.js'
import { readLegacyData } from '../utils/database.js'
import { Logger, saveErrors } from '../utils/logger.js'

/**
 * Migrate cases from legacy systems
 */
export async function migrateCases(prisma: PrismaClient, logger: Logger) {
  logger.info('🚀 Starting case migration...')
  
  // Read legacy cases from both sources
  const hkAgencyCases = await readLegacyData('hk-legal-case-agency/cases.json')
  const hkSystemCases = await readLegacyData('hk-legalcase-system/cases.json')
  
  const allLegacyCases = [...hkAgencyCases, ...hkSystemCases]
  
  logger.info(`Found ${allLegacyCases.length} legacy cases to migrate`)
  
  if (allLegacyCases.length === 0) {
    logger.warn('No legacy cases found. Skipping case migration.')
    return { migratedCount: 0, errorCount: 0, errors: [] }
  }
  
  let migratedCount = 0
  let errorCount = 0
  const errors: any[] = []
  
  // Batch processing
  const batchSize = 100
  
  for (let i = 0; i < allLegacyCases.length; i += batchSize) {
    const batch = allLegacyCases.slice(i, i + batchSize)
    const sourceSystemOffset = hkAgencyCases.length
    
    logger.info(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} cases)...`)
    
    // Transform all cases in batch
    const transformedCases = await Promise.allSettled(
      batch.map((legacyCase, idx) => {
        const globalIdx = i + idx
        const sourceSystem = globalIdx < sourceSystemOffset 
          ? 'HK-Legal-Case-Agency' 
          : 'hk-legalcase-system'
        return transformCase(legacyCase, sourceSystem)
      })
    )
    
    // Insert successful transformations
    for (let j = 0; j < transformedCases.length; j++) {
      const result = transformedCases[j]
      const legacyCase = batch[j]
      
      if (result.status === 'fulfilled') {
        try {
          const caseData = result.value
          
          // Create case
          const createdCase = await prisma.case.create({
            data: {
              caseNumber: caseData.caseNumber,
              title: caseData.title,
              description: caseData.description,
              status: caseData.status,
              priority: caseData.priority,
              category: caseData.category,
              clientId: caseData.clientId,
              lawyerId: caseData.lawyerId,
              startDate: caseData.startDate,
              endDate: caseData.endDate,
              courtDate: caseData.courtDate,
              isPublic: caseData.isPublic,
              publicNote: caseData.publicNote,
              createdAt: caseData.createdAt,
              updatedAt: caseData.updatedAt
            }
          })
          
          migratedCount++
          
          // Log activity
          await prisma.activity.create({
            data: {
              userId: caseData.clientId,
              caseId: createdCase.id,
              type: 'CASE_CREATED',
              action: 'Data Migration',
              description: `Migrated case from legacy system`,
              metadata: caseData.metadata
            }
          })
          
          if (migratedCount % 50 === 0) {
            logger.info(`Migrated ${migratedCount} cases so far...`)
          }
        } catch (error: any) {
          errorCount++
          errors.push({
            case: result.value,
            legacyCase,
            error: error.message,
            stack: error.stack
          })
          logger.error(`Failed to insert case: ${error.message}`)
        }
      } else {
        errorCount++
        errors.push({
          legacyCase,
          error: result.reason?.message || result.reason,
          transformationFailed: true
        })
        logger.error(`Failed to transform case: ${result.reason}`)
      }
    }
    
    logger.info(`Progress: ${Math.min(i + batch.length, allLegacyCases.length)}/${allLegacyCases.length}`)
  }
  
  logger.info(`✅ Migrated ${migratedCount} cases`)
  
  if (errorCount > 0) {
    logger.warn(`⚠️  ${errorCount} cases failed to migrate`)
    const errorFile = await saveErrors('cases', errors)
    logger.info(`Error details saved to: ${errorFile}`)
  }
  
  return { migratedCount, errorCount, errors }
}

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const { createLogger } = await import('../utils/logger.js')
  const logger = createLogger('migrate-cases')
  const prisma = new PrismaClient()
  
  migrateCases(prisma, logger)
    .then(result => {
      logger.info('Case migration complete:', result)
      return prisma.$disconnect()
    })
    .then(() => process.exit(0))
    .catch(error => {
      logger.error('Case migration failed:', error)
      prisma.$disconnect().then(() => process.exit(1))
    })
}
