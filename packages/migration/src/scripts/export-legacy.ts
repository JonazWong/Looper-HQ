import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { createLogger } from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const logger = createLogger('export-legacy')

/**
 * Export data from HK-Legal-Case-Agency
 * In a real scenario, this would connect to the legacy system's database
 * For now, we'll create sample data structure
 */
export async function exportHKLegalCaseAgency() {
  logger.info('📤 Exporting data from HK-Legal-Case-Agency...')
  
  const outputDir = path.join(__dirname, '../../data/legacy/hk-legal-case-agency')
  await fs.mkdir(outputDir, { recursive: true })
  
  // Note: In production, this would query the actual legacy database
  // For now, we just ensure the directory structure exists
  
  logger.info(`Export directory ready: ${outputDir}`)
  logger.info('Place legacy data files in this directory:')
  logger.info('  - cases.json')
  logger.info('  - clients.json')
  logger.info('  - search-history.json (optional)')
  
  return { outputDir }
}

/**
 * Export data from hk-legalcase-system
 * In a real scenario, this would connect to the legacy system's database
 * For now, we'll create sample data structure
 */
export async function exportHKLegalCaseSystem() {
  logger.info('📤 Exporting data from hk-legalcase-system...')
  
  const outputDir = path.join(__dirname, '../../data/legacy/hk-legalcase-system')
  await fs.mkdir(outputDir, { recursive: true })
  
  // Note: In production, this would query the actual legacy database
  // For now, we just ensure the directory structure exists
  
  logger.info(`Export directory ready: ${outputDir}`)
  logger.info('Place legacy data files in this directory:')
  logger.info('  - cases.json')
  logger.info('  - clients.json')
  logger.info('  - memberships.json')
  logger.info('  - search-history.json (optional)')
  
  return { outputDir }
}

/**
 * Create sample legacy data for testing
 */
export async function createSampleData() {
  logger.info('📝 Creating sample legacy data for testing...')
  
  // Sample HK-Legal-Case-Agency data
  const hkAgencyDir = path.join(__dirname, '../../data/legacy/hk-legal-case-agency')
  await fs.mkdir(hkAgencyDir, { recursive: true })
  
  // Sample clients
  const sampleClients = [
    {
      id: 1,
      full_name: "John Doe",
      email: "john.doe@example.com",
      phone: "+852 9123 4567",
      type: "individual",
      created_at: "2023-01-15T10:00:00Z"
    },
    {
      id: 2,
      full_name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "+852 9234 5678",
      type: "individual",
      created_at: "2023-02-20T11:00:00Z"
    }
  ]
  
  await fs.writeFile(
    path.join(hkAgencyDir, 'clients.json'),
    JSON.stringify(sampleClients, null, 2)
  )
  logger.info('Created sample clients.json for HK-Legal-Case-Agency')
  
  // Sample cases
  const sampleCases = [
    {
      id: 1,
      title: "Contract Dispute Resolution",
      description: "Commercial contract dispute between two parties",
      status: "active",
      priority: "high",
      category: "civil",
      client_id: 1,
      created_at: "2023-03-01T09:00:00Z"
    },
    {
      id: 2,
      title: "Employment Rights Case",
      description: "Wrongful termination case",
      status: "pending",
      priority: "medium",
      category: "employment",
      client_id: 2,
      created_at: "2023-03-15T14:00:00Z"
    }
  ]
  
  await fs.writeFile(
    path.join(hkAgencyDir, 'cases.json'),
    JSON.stringify(sampleCases, null, 2)
  )
  logger.info('Created sample cases.json for HK-Legal-Case-Agency')
  
  // Sample HK-LegalCase-System data
  const hkSystemDir = path.join(__dirname, '../../data/legacy/hk-legalcase-system')
  await fs.mkdir(hkSystemDir, { recursive: true })
  
  // Sample clients for system
  const systemClients = [
    {
      id: 101,
      fullName: "ABC Corporation Ltd",
      companyName: "ABC Corporation Ltd",
      email: "contact@abccorp.com",
      phone: "+852 2123 4567",
      type: "company",
      tier: "premium",
      createdAt: "2023-01-10T08:00:00Z"
    }
  ]
  
  await fs.writeFile(
    path.join(hkSystemDir, 'clients.json'),
    JSON.stringify(systemClients, null, 2)
  )
  logger.info('Created sample clients.json for hk-legalcase-system')
  
  // Sample cases for system
  const systemCases = [
    {
      id: 201,
      title: "Corporate Merger Review",
      description: "Legal review for corporate merger",
      status: "active",
      category: "corporate",
      client_id: 101,
      is_public: true,
      createdAt: "2023-04-01T10:00:00Z"
    }
  ]
  
  await fs.writeFile(
    path.join(hkSystemDir, 'cases.json'),
    JSON.stringify(systemCases, null, 2)
  )
  logger.info('Created sample cases.json for hk-legalcase-system')
  
  // Sample memberships
  const sampleMemberships = [
    {
      id: 1,
      email: "contact@abccorp.com",
      tier: "premium",
      is_active: true,
      start_date: "2023-01-10T00:00:00Z",
      created_at: "2023-01-10T08:00:00Z"
    }
  ]
  
  await fs.writeFile(
    path.join(hkSystemDir, 'memberships.json'),
    JSON.stringify(sampleMemberships, null, 2)
  )
  logger.info('Created sample memberships.json for hk-legalcase-system')
  
  // Sample search history
  const sampleSearches = [
    {
      id: 1,
      ip_address: "192.168.1.1",
      query: "contract law",
      results_count: 15,
      searched_at: "2023-05-01T10:30:00Z"
    },
    {
      id: 2,
      ip_address: "192.168.1.2",
      query: "employment rights",
      results_count: 8,
      searched_at: "2023-05-02T14:20:00Z"
    }
  ]
  
  await fs.writeFile(
    path.join(hkAgencyDir, 'search-history.json'),
    JSON.stringify(sampleSearches, null, 2)
  )
  await fs.writeFile(
    path.join(hkSystemDir, 'search-history.json'),
    JSON.stringify(sampleSearches, null, 2)
  )
  logger.info('Created sample search-history.json')
  
  logger.info('✅ Sample data created successfully')
  
  return { success: true }
}

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const createSample = args.includes('--sample')
  
  Promise.all([
    exportHKLegalCaseAgency(),
    exportHKLegalCaseSystem(),
    createSample ? createSampleData() : Promise.resolve()
  ])
    .then(() => {
      logger.info('✅ Export complete')
      process.exit(0)
    })
    .catch(error => {
      logger.error('❌ Export failed:', error)
      process.exit(1)
    })
}
