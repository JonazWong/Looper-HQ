import { PrismaClient } from '@prisma/client'
import { createLogger } from './utils/logger.js'
import { createBackup } from './utils/backup.js'
import { migrateClients } from './scripts/migrate-clients.js'
import { migrateCases } from './scripts/migrate-cases.js'
import { migrateMemberships } from './scripts/migrate-memberships.js'
import { migrateSearchHistory } from './scripts/migrate-search-history.js'
import { validateMigration, printValidationResults } from './validators/data-validator.js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()
const logger = createLogger('migration-master')

/**
 * Main migration function
 */
async function runMigration() {
  const startTime = Date.now()
  
  try {
    logger.info('🚀 Starting Looper HQ data migration...')
    logger.info('='.repeat(70))
    
    // Step 1: Create backup
    logger.info('\n📦 Step 1: Creating database backup...')
    let backupFile: string | null = null
    try {
      backupFile = await createBackup()
      logger.info(`✅ Backup created: ${backupFile}`)
    } catch (error: any) {
      logger.warn(`⚠️  Backup failed: ${error.message}`)
      logger.warn('Continuing without backup (not recommended for production)')
    }
    
    // Step 2: Migrate users and clients
    logger.info('\n👥 Step 2: Migrating users and clients...')
    const clientsResult = await migrateClients(prisma, logger)
    logger.info(`✅ Clients migration: ${clientsResult.migratedCount} migrated, ${clientsResult.errorCount} errors`)
    
    // Step 3: Migrate cases
    logger.info('\n📋 Step 3: Migrating cases...')
    const casesResult = await migrateCases(prisma, logger)
    logger.info(`✅ Cases migration: ${casesResult.migratedCount} migrated, ${casesResult.errorCount} errors`)
    
    // Step 4: Migrate memberships
    logger.info('\n💎 Step 4: Migrating memberships...')
    const membershipsResult = await migrateMemberships(prisma, logger)
    logger.info(`✅ Memberships migration: ${membershipsResult.migratedCount} migrated, ${membershipsResult.defaultCreatedCount} defaults created, ${membershipsResult.errorCount} errors`)
    
    // Step 5: Migrate search history
    logger.info('\n🔍 Step 5: Migrating search history...')
    const searchResult = await migrateSearchHistory(prisma, logger)
    logger.info(`✅ Search history migration: ${searchResult.migratedCount} migrated, ${searchResult.errorCount} errors`)
    
    // Step 6: Validate migration
    logger.info('\n✅ Step 6: Validating migrated data...')
    const validation = await validateMigration(prisma)
    
    // Print validation results
    printValidationResults(validation)
    
    if (!validation.success) {
      logger.error('❌ Migration validation failed')
      logger.info('🔄 Consider running rollback: pnpm rollback')
      throw new Error('Migration validation failed')
    }
    
    // Step 7: Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    
    logger.info('\n' + '='.repeat(70))
    logger.info('🎉 Migration completed successfully!')
    logger.info('='.repeat(70))
    logger.info('\n📊 Migration Summary:')
    logger.info(`  Duration:              ${duration}s`)
    logger.info(`  Backup File:           ${backupFile || 'N/A'}`)
    logger.info('\n  Migrated Records:`)
    logger.info(`  ├─ Clients:            ${clientsResult.migratedCount}`)
    logger.info(`  ├─ Cases:              ${casesResult.migratedCount}`)
    logger.info(`  ├─ Memberships:        ${membershipsResult.migratedCount + membershipsResult.defaultCreatedCount}`)
    logger.info(`  └─ Search History:     ${searchResult.migratedCount}`)
    logger.info('\n  Errors:')
    logger.info(`  ├─ Clients:            ${clientsResult.errorCount}`)
    logger.info(`  ├─ Cases:              ${casesResult.errorCount}`)
    logger.info(`  ├─ Memberships:        ${membershipsResult.errorCount}`)
    logger.info(`  └─ Search History:     ${searchResult.errorCount}`)
    logger.info('\n  Database Statistics:')
    logger.info(`  ├─ Total Users:        ${validation.summary.totalUsers}`)
    logger.info(`  ├─ Total Clients:      ${validation.summary.totalClients}`)
    logger.info(`  ├─ Total Cases:        ${validation.summary.totalCases}`)
    logger.info(`  ├─ Total Memberships:  ${validation.summary.totalMemberships}`)
    logger.info(`  └─ Total Searches:     ${validation.summary.totalSearchHistory}`)
    logger.info('='.repeat(70))
    
    return {
      success: true,
      duration,
      backupFile,
      results: {
        clients: clientsResult,
        cases: casesResult,
        memberships: membershipsResult,
        searchHistory: searchResult
      },
      validation
    }
  } catch (error: any) {
    logger.error('❌ Migration failed:', error)
    logger.error('Stack trace:', error.stack)
    logger.info('\n🔄 To rollback the migration, run: pnpm rollback')
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(result => {
      console.log('\n✅ Migration completed successfully')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Migration failed:', error.message)
      process.exit(1)
    })
}

export { runMigration }
