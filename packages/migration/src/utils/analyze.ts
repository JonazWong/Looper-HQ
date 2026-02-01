import { readLegacyData, readLegacyCSV } from './database.js'
import { createLogger } from './logger.js'

const logger = createLogger('data-analyzer')

export interface AnalysisReport {
  source: string
  totalRecords: number
  validRecords: number
  invalidRecords: number
  duplicates: number
  missingFields: Record<string, number>
  dataTypeIssues: string[]
  recommendations: string[]
}

/**
 * Analyze legacy data for quality issues
 * @param source - Source identifier (e.g., 'hk-legal-case-agency/cases.json')
 * @param requiredFields - Array of required field names
 * @returns Analysis report
 */
export async function analyzeData(
  source: string,
  requiredFields: string[] = []
): Promise<AnalysisReport> {
  logger.info(`Analyzing data from: ${source}`)
  
  // Read data (try JSON first, then CSV)
  let data: any[]
  if (source.endsWith('.json')) {
    data = await readLegacyData(source)
  } else if (source.endsWith('.csv')) {
    data = await readLegacyCSV(source)
  } else {
    throw new Error(`Unsupported file format: ${source}`)
  }
  
  const report: AnalysisReport = {
    source,
    totalRecords: data.length,
    validRecords: 0,
    invalidRecords: 0,
    duplicates: 0,
    missingFields: {},
    dataTypeIssues: [],
    recommendations: []
  }
  
  // Track unique IDs for duplicate detection
  const seenIds = new Set<string>()
  
  // Analyze each record
  for (const record of data) {
    let isValid = true
    
    // Check required fields
    for (const field of requiredFields) {
      if (!record[field] || record[field] === '') {
        isValid = false
        report.missingFields[field] = (report.missingFields[field] || 0) + 1
      }
    }
    
    // Check for duplicates by ID
    if (record.id) {
      const idStr = String(record.id)
      if (seenIds.has(idStr)) {
        report.duplicates++
        isValid = false
      }
      seenIds.add(idStr)
    }
    
    if (isValid) {
      report.validRecords++
    } else {
      report.invalidRecords++
    }
  }
  
  // Generate recommendations
  if (report.duplicates > 0) {
    report.recommendations.push(
      `Found ${report.duplicates} duplicate records. Consider deduplication strategy.`
    )
  }
  
  if (Object.keys(report.missingFields).length > 0) {
    report.recommendations.push(
      'Some records have missing required fields. These may need default values or manual review.'
    )
  }
  
  if (report.validRecords === 0 && report.totalRecords > 0) {
    report.recommendations.push(
      'No valid records found. Check data format and required fields.'
    )
  }
  
  if (report.totalRecords === 0) {
    report.recommendations.push(
      'No records found in source file. Verify file path and format.'
    )
  }
  
  return report
}

/**
 * Print analysis report to console
 */
export function printAnalysisReport(report: AnalysisReport): void {
  console.log('\n' + '='.repeat(60))
  console.log(`📊 Data Analysis Report: ${report.source}`)
  console.log('='.repeat(60))
  console.log(`Total Records:       ${report.totalRecords}`)
  console.log(`Valid Records:       ${report.validRecords} (${((report.validRecords/report.totalRecords)*100).toFixed(1)}%)`)
  console.log(`Invalid Records:     ${report.invalidRecords}`)
  console.log(`Duplicates:          ${report.duplicates}`)
  
  if (Object.keys(report.missingFields).length > 0) {
    console.log('\nMissing Fields:')
    for (const [field, count] of Object.entries(report.missingFields)) {
      console.log(`  - ${field}: ${count} records`)
    }
  }
  
  if (report.dataTypeIssues.length > 0) {
    console.log('\nData Type Issues:')
    report.dataTypeIssues.forEach(issue => console.log(`  - ${issue}`))
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:')
    report.recommendations.forEach(rec => console.log(`  • ${rec}`))
  }
  
  console.log('='.repeat(60) + '\n')
}

/**
 * Run analysis on all legacy data sources
 */
export async function analyzeAllSources(): Promise<AnalysisReport[]> {
  const sources = [
    { file: 'hk-legal-case-agency/cases.json', required: ['id', 'title', 'client_id'] },
    { file: 'hk-legal-case-agency/clients.json', required: ['id', 'email'] },
    { file: 'hk-legalcase-system/cases.json', required: ['id', 'title'] },
    { file: 'hk-legalcase-system/memberships.json', required: ['id', 'user_id', 'tier'] }
  ]
  
  const reports: AnalysisReport[] = []
  
  for (const source of sources) {
    try {
      const report = await analyzeData(source.file, source.required)
      reports.push(report)
      printAnalysisReport(report)
    } catch (error) {
      logger.error(`Failed to analyze ${source.file}:`, error)
    }
  }
  
  return reports
}

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeAllSources()
    .then(() => {
      console.log('✅ Analysis complete')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Analysis failed:', error)
      process.exit(1)
    })
}
