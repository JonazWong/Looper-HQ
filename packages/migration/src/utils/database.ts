import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Read legacy data from JSON file
 * @param relativePath - Path relative to data/legacy/
 * @returns Parsed JSON data
 */
export async function readLegacyData(relativePath: string): Promise<any[]> {
  const filePath = path.join(__dirname, '../../data/legacy', relativePath)
  
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(content)
    
    // Handle both array and object with data property
    return Array.isArray(data) ? data : (data.data || [])
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}:`, error)
    return []
  }
}

/**
 * Write transformed data to JSON file
 * @param relativePath - Path relative to data/transformed/
 * @param data - Data to write
 */
export async function writeTransformedData(relativePath: string, data: any[]): Promise<void> {
  const filePath = path.join(__dirname, '../../data/transformed', relativePath)
  const dir = path.dirname(filePath)
  
  // Ensure directory exists
  await fs.mkdir(dir, { recursive: true })
  
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

/**
 * Read CSV data from file
 * @param relativePath - Path relative to data/legacy/
 * @returns Parsed CSV data
 */
export async function readLegacyCSV(relativePath: string): Promise<any[]> {
  const { parse } = await import('csv-parse/sync')
  const filePath = path.join(__dirname, '../../data/legacy', relativePath)
  
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })
    
    return records
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}:`, error)
    return []
  }
}

/**
 * Write data to CSV file
 * @param relativePath - Path relative to data/transformed/
 * @param data - Data to write
 */
export async function writeCSV(relativePath: string, data: any[]): Promise<void> {
  const { stringify } = await import('csv-stringify/sync')
  const filePath = path.join(__dirname, '../../data/transformed', relativePath)
  const dir = path.dirname(filePath)
  
  // Ensure directory exists
  await fs.mkdir(dir, { recursive: true })
  
  const csv = stringify(data, {
    header: true,
    quoted: true
  })
  
  await fs.writeFile(filePath, csv, 'utf-8')
}

/**
 * Get database connection string from environment
 */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  
  return url
}
