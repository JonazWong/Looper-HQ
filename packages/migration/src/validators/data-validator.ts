import { PrismaClient } from '@prisma/client'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('data-validator')

export interface ValidationResult {
  success: boolean
  errors: string[]
  warnings: string[]
  summary: {
    totalCases: number
    totalClients: number
    totalUsers: number
    totalMemberships: number
    totalSearchHistory: number
    orphanedRecords: number
    missingRelations: number
    duplicateCaseNumbers: number
  }
}

/**
 * Validate migrated data for integrity and completeness
 */
export async function validateMigration(prisma: PrismaClient): Promise<ValidationResult> {
  logger.info('Starting migration validation...')
  
  const errors: string[] = []
  const warnings: string[] = []
  
  // Count totals
  const totalCases = await prisma.case.count()
  const totalClients = await prisma.client.count()
  const totalUsers = await prisma.user.count()
  const totalMemberships = await prisma.membership.count()
  const totalSearchHistory = await prisma.searchHistory.count()
  
  logger.info(`Totals: ${totalCases} cases, ${totalClients} clients, ${totalUsers} users`)
  
  // Check for orphaned cases (cases without clients)
  const orphanedCases = await prisma.case.findMany({
    where: {
      client: null
    }
  })
  
  if (orphanedCases.length > 0) {
    errors.push(`Found ${orphanedCases.length} cases without valid client references`)
  }
  
  // Check for cases with invalid client IDs
  const casesWithInvalidClient = await prisma.case.count({
    where: {
      clientId: {
        notIn: (await prisma.user.findMany({ select: { id: true } })).map(u => u.id)
      }
    }
  })
  
  if (casesWithInvalidClient > 0) {
    errors.push(`Found ${casesWithInvalidClient} cases with invalid client IDs`)
  }
  
  // Check for duplicate case numbers
  const caseNumbers = await prisma.case.groupBy({
    by: ['caseNumber'],
    _count: {
      caseNumber: true
    },
    having: {
      caseNumber: {
        _count: {
          gt: 1
        }
      }
    }
  })
  
  if (caseNumbers.length > 0) {
    errors.push(
      `Found ${caseNumbers.length} duplicate case numbers: ${caseNumbers.map(c => c.caseNumber).join(', ')}`
    )
  }
  
  // Check for duplicate user emails
  const userEmails = await prisma.user.groupBy({
    by: ['email'],
    _count: {
      email: true
    },
    having: {
      email: {
        _count: {
          gt: 1
        }
      }
    }
  })
  
  if (userEmails.length > 0) {
    errors.push(
      `Found ${userEmails.length} duplicate user emails`
    )
  }
  
  // Check for duplicate client emails
  const clientEmails = await prisma.client.groupBy({
    by: ['email'],
    _count: {
      email: true
    },
    having: {
      email: {
        _count: {
          gt: 1
        }
      }
    }
  })
  
  if (clientEmails.length > 0) {
    errors.push(
      `Found ${clientEmails.length} duplicate client emails`
    )
  }
  
  // Check for users without memberships (warning, not error)
  const usersWithoutMemberships = await prisma.user.count({
    where: {
      memberships: {
        none: {}
      },
      role: 'CLIENT'
    }
  })
  
  if (usersWithoutMemberships > 0) {
    warnings.push(
      `Found ${usersWithoutMemberships} client users without membership records`
    )
  }
  
  // Check data consistency
  if (totalUsers === 0 && totalCases > 0) {
    errors.push('Cases exist but no users found - data inconsistency')
  }
  
  if (totalClients === 0 && totalCases > 0) {
    errors.push('Cases exist but no clients found - data inconsistency')
  }
  
  const success = errors.length === 0
  
  const result: ValidationResult = {
    success,
    errors,
    warnings,
    summary: {
      totalCases,
      totalClients,
      totalUsers,
      totalMemberships,
      totalSearchHistory,
      orphanedRecords: orphanedCases.length,
      missingRelations: casesWithInvalidClient,
      duplicateCaseNumbers: caseNumbers.length
    }
  }
  
  // Log results
  if (success) {
    logger.info('✅ Validation passed')
  } else {
    logger.error('❌ Validation failed with errors:', errors)
  }
  
  if (warnings.length > 0) {
    logger.warn('⚠️  Validation warnings:', warnings)
  }
  
  return result
}

/**
 * Print validation results to console
 */
export function printValidationResults(result: ValidationResult): void {
  console.log('\n' + '='.repeat(70))
  console.log('📋 MIGRATION VALIDATION REPORT')
  console.log('='.repeat(70))
  console.log('\n📊 Summary:')
  console.log(`  Total Cases:            ${result.summary.totalCases}`)
  console.log(`  Total Clients:          ${result.summary.totalClients}`)
  console.log(`  Total Users:            ${result.summary.totalUsers}`)
  console.log(`  Total Memberships:      ${result.summary.totalMemberships}`)
  console.log(`  Total Search History:   ${result.summary.totalSearchHistory}`)
  
  console.log('\n🔍 Integrity Checks:')
  console.log(`  Orphaned Records:       ${result.summary.orphanedRecords}`)
  console.log(`  Missing Relations:      ${result.summary.missingRelations}`)
  console.log(`  Duplicate Case Numbers: ${result.summary.duplicateCaseNumbers}`)
  
  if (result.errors.length > 0) {
    console.log('\n❌ Errors:')
    result.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`)
    })
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:')
    result.warnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning}`)
    })
  }
  
  console.log('\n' + '='.repeat(70))
  console.log(`Status: ${result.success ? '✅ PASSED' : '❌ FAILED'}`)
  console.log('='.repeat(70) + '\n')
}

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const prisma = new PrismaClient()
  
  validateMigration(prisma)
    .then(result => {
      printValidationResults(result)
      return prisma.$disconnect()
    })
    .then(() => {
      process.exit(0)
    })
    .catch(error => {
      console.error('Validation error:', error)
      prisma.$disconnect().then(() => process.exit(1))
    })
}
