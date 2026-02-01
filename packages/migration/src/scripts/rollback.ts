import { PrismaClient } from '@prisma/client'
import { exec } from 'child_process'
import { promisify } from 'util'
import { getLatestBackup, restoreFromBackup } from '../utils/backup.js'
import { createLogger } from '../utils/logger.js'

const execAsync = promisify(exec)
const logger = createLogger('rollback')

/**
 * Rollback migration by restoring from backup
 */
export async function rollback(backupFile?: string) {
  logger.info('🔄 Starting migration rollback...')
  
  const prisma = new PrismaClient()
  
  try {
    // Determine which backup to use
    let backupToRestore = backupFile
    
    if (!backupToRestore) {
      logger.info('No backup file specified, looking for latest backup...')
      const latestBackup = await getLatestBackup()
      
      if (!latestBackup) {
        throw new Error('No backup files found. Cannot rollback.')
      }
      
      backupToRestore = latestBackup
      logger.info(`Using latest backup: ${latestBackup}`)
    }
    
    // Confirm rollback (in production, you might want a confirmation prompt)
    logger.warn('⚠️  WARNING: This will erase all current data and restore from backup')
    logger.info(`Backup file: ${backupToRestore}`)
    
    // Drop all tables in the public schema
    logger.info('Dropping all tables...')
    await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE;')
    await prisma.$executeRawUnsafe('CREATE SCHEMA public;')
    
    logger.info('Schema dropped and recreated')
    
    // Disconnect Prisma before restore
    await prisma.$disconnect()
    
    // Restore from backup
    await restoreFromBackup(backupToRestore)
    
    logger.info('✅ Rollback completed successfully')
    logger.info('You may need to run `prisma generate` to update the Prisma client')
    
    return { success: true, backupFile: backupToRestore }
  } catch (error: any) {
    logger.error('❌ Rollback failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Manual rollback - truncate all migrated data without restoring backup
 * This is useful for development/testing
 */
export async function manualRollback() {
  logger.info('🔄 Starting manual rollback (truncate only)...')
  
  const prisma = new PrismaClient()
  
  try {
    logger.info('Deleting all migrated data...')
    
    // Delete in reverse dependency order
    await prisma.activity.deleteMany({})
    logger.info('Deleted all activities')
    
    await prisma.searchHistory.deleteMany({})
    logger.info('Deleted all search history')
    
    await prisma.caseNote.deleteMany({})
    logger.info('Deleted all case notes')
    
    await prisma.invoice.deleteMany({})
    logger.info('Deleted all invoices')
    
    await prisma.timeLog.deleteMany({})
    logger.info('Deleted all time logs')
    
    await prisma.document.deleteMany({})
    logger.info('Deleted all documents')
    
    await prisma.case.deleteMany({})
    logger.info('Deleted all cases')
    
    await prisma.membership.deleteMany({})
    logger.info('Deleted all memberships')
    
    await prisma.client.deleteMany({})
    logger.info('Deleted all clients')
    
    await prisma.user.deleteMany({})
    logger.info('Deleted all users')
    
    logger.info('✅ Manual rollback completed successfully')
    
    return { success: true }
  } catch (error: any) {
    logger.error('❌ Manual rollback failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const backupFile = args[0]
  const manual = args.includes('--manual')
  
  const rollbackFn = manual ? manualRollback() : rollback(backupFile)
  
  rollbackFn
    .then(result => {
      console.log('Rollback result:', result)
      process.exit(0)
    })
    .catch(error => {
      console.error('Rollback error:', error)
      process.exit(1)
    })
}
