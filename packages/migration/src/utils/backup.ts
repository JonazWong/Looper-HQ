import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Create a PostgreSQL database backup
 * @returns Path to the backup file
 */
export async function createBackup(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
  const backupDir = path.join(__dirname, '../../data/backups')
  const backupFile = path.join(backupDir, `backup-${timestamp}.sql`)
  
  // Ensure backup directory exists
  await fs.mkdir(backupDir, { recursive: true })
  
  const dbUrl = process.env.DATABASE_URL
  
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  console.log(`📦 Creating database backup at: ${backupFile}`)
  
  try {
    // Use pg_dump to create backup
    const command = `pg_dump "${dbUrl}" > "${backupFile}"`
    await execAsync(command)
    
    console.log(`✅ Backup created successfully: ${backupFile}`)
    
    // Verify backup file was created and has content
    const stats = await fs.stat(backupFile)
    if (stats.size === 0) {
      throw new Error('Backup file is empty')
    }
    
    return backupFile
  } catch (error) {
    console.error('❌ Failed to create backup:', error)
    throw new Error(`Backup failed: ${error}`)
  }
}

/**
 * List all available backups
 * @returns Array of backup file paths
 */
export async function listBackups(): Promise<string[]> {
  const backupDir = path.join(__dirname, '../../data/backups')
  
  try {
    const files = await fs.readdir(backupDir)
    const backupFiles = files
      .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
      .map(f => path.join(backupDir, f))
      .sort()
      .reverse() // Most recent first
    
    return backupFiles
  } catch (error) {
    console.warn('No backups found')
    return []
  }
}

/**
 * Get the most recent backup file
 * @returns Path to most recent backup, or null if none exist
 */
export async function getLatestBackup(): Promise<string | null> {
  const backups = await listBackups()
  return backups.length > 0 ? backups[0] : null
}

/**
 * Restore database from a backup file
 * @param backupFile - Path to backup file to restore
 */
export async function restoreFromBackup(backupFile: string): Promise<void> {
  const dbUrl = process.env.DATABASE_URL
  
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  console.log(`🔄 Restoring database from: ${backupFile}`)
  
  try {
    // Verify backup file exists
    await fs.access(backupFile)
    
    // Use psql to restore backup
    const command = `psql "${dbUrl}" < "${backupFile}"`
    await execAsync(command)
    
    console.log('✅ Database restored successfully')
  } catch (error) {
    console.error('❌ Failed to restore database:', error)
    throw new Error(`Restore failed: ${error}`)
  }
}
