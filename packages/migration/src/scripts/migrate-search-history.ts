import { PrismaClient } from '@prisma/client'
import { readLegacyData } from '../utils/database.js'
import { Logger, saveErrors } from '../utils/logger.js'

/**
 * Migrate search history from legacy systems
 */
export async function migrateSearchHistory(prisma: PrismaClient, logger: Logger) {
  logger.info('🚀 Starting search history migration...')
  
  // Read legacy search history from both sources
  const hkAgencySearches = await readLegacyData('hk-legal-case-agency/search-history.json')
  const hkSystemSearches = await readLegacyData('hk-legalcase-system/search-history.json')
  
  const allLegacySearches = [...hkAgencySearches, ...hkSystemSearches]
  
  logger.info(`Found ${allLegacySearches.length} legacy search records to migrate`)
  
  if (allLegacySearches.length === 0) {
    logger.warn('No legacy search history found. Skipping search history migration.')
    return { migratedCount: 0, errorCount: 0, errors: [] }
  }
  
  let migratedCount = 0
  let errorCount = 0
  const errors: any[] = []
  
  // Batch processing for better performance
  const batchSize = 500
  
  for (let i = 0; i < allLegacySearches.length; i += batchSize) {
    const batch = allLegacySearches.slice(i, i + batchSize)
    
    logger.info(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} records)...`)
    
    // Prepare batch data
    const searchRecords = []
    
    for (const legacySearch of batch) {
      try {
        // Extract fields (handle both snake_case and camelCase)
        const ipAddress = legacySearch.ip_address || legacySearch.ipAddress || 'unknown'
        const query = legacySearch.query || legacySearch.search_query || ''
        const resultsCount = legacySearch.results_count || legacySearch.resultsCount || 0
        const searchedAt = legacySearch.searched_at || legacySearch.searchedAt || legacySearch.created_at
        
        searchRecords.push({
          ipAddress,
          query,
          resultsCount: Number(resultsCount),
          searchedAt: searchedAt ? new Date(searchedAt) : new Date()
        })
      } catch (error: any) {
        errorCount++
        errors.push({
          search: legacySearch,
          error: error.message
        })
      }
    }
    
    // Bulk insert for better performance
    try {
      if (searchRecords.length > 0) {
        await prisma.searchHistory.createMany({
          data: searchRecords,
          skipDuplicates: true
        })
        
        migratedCount += searchRecords.length
      }
    } catch (error: any) {
      errorCount += searchRecords.length
      errors.push({
        batch: searchRecords.slice(0, 5), // Only save first 5 for reference
        error: error.message,
        stack: error.stack
      })
      logger.error(`Failed to insert search history batch: ${error.message}`)
    }
    
    logger.info(`Progress: ${Math.min(i + batch.length, allLegacySearches.length)}/${allLegacySearches.length}`)
  }
  
  logger.info(`✅ Migrated ${migratedCount} search history records`)
  
  if (errorCount > 0) {
    logger.warn(`⚠️  ${errorCount} search records failed to migrate`)
    const errorFile = await saveErrors('search-history', errors)
    logger.info(`Error details saved to: ${errorFile}`)
  }
  
  return { migratedCount, errorCount, errors }
}

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const { createLogger } = await import('../utils/logger.js')
  const logger = createLogger('migrate-search-history')
  const prisma = new PrismaClient()
  
  migrateSearchHistory(prisma, logger)
    .then(result => {
      logger.info('Search history migration complete:', result)
      return prisma.$disconnect()
    })
    .then(() => process.exit(0))
    .catch(error => {
      logger.error('Search history migration failed:', error)
      prisma.$disconnect().then(() => process.exit(1))
    })
}
