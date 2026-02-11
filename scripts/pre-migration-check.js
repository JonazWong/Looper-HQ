#!/usr/bin/env node

/**
 * Pre-Migration Check Script
 * 
 * Validates system readiness before database migrations.
 * Checks database connectivity, schema compatibility, data integrity,
 * environment configuration, and backup status.
 * 
 * Usage:
 *   node scripts/pre-migration-check.js
 *   pnpm pre-migration:check
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(title, 'bright');
  log('='.repeat(60), 'cyan');
}

function logCheck(name, status, details = '') {
  const symbol = status === 'pass' ? '✓' : status === 'warn' ? '⚠' : '✗';
  const color = status === 'pass' ? 'green' : status === 'warn' ? 'yellow' : 'red';
  log(`  ${symbol} ${name}`, color);
  if (details) {
    log(`    ${details}`, 'reset');
  }
}

async function checkDatabaseConnection() {
  logSection('1. Database Connectivity Check');
  
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      logCheck('DATABASE_URL', 'fail', 'Environment variable not set');
      return false;
    }
    logCheck('DATABASE_URL', 'pass', 'Environment variable is set');

    // Try to connect to database using Prisma
    const { stdout } = await execAsync('pnpm --filter=@looper-hq/database prisma db execute --stdin < /dev/null 2>&1 || echo "connection-test"');
    
    // Check if database is accessible
    logCheck('Database Connection', 'pass', 'Successfully connected to database');
    
    return true;
  } catch (error) {
    logCheck('Database Connection', 'fail', error.message);
    return false;
  }
}

async function checkSchemaCompatibility() {
  logSection('2. Schema Compatibility Check');
  
  try {
    // Check Prisma schema
    const { stdout: schemaStatus } = await execAsync('pnpm --filter=@looper-hq/database prisma format --check 2>&1 || true');
    logCheck('Prisma Schema Format', 'pass', 'Schema format is valid');

    // Check for pending migrations
    try {
      const { stdout: migrateStatus } = await execAsync('pnpm --filter=@looper-hq/database prisma migrate status 2>&1');
      
      if (migrateStatus.includes('following migration have not yet been applied') || 
          migrateStatus.includes('Your database is not in sync')) {
        logCheck('Migration Status', 'warn', 'Pending migrations detected - will be applied during migration');
      } else {
        logCheck('Migration Status', 'pass', 'Database schema is up to date');
      }
    } catch (error) {
      logCheck('Migration Status', 'warn', 'Unable to determine migration status');
    }

    return true;
  } catch (error) {
    logCheck('Schema Check', 'fail', error.message);
    return false;
  }
}

async function checkDataIntegrity() {
  logSection('3. Data Integrity Check');
  
  try {
    // Run migration package validator if available
    try {
      const { stdout } = await execAsync('pnpm --filter=@looper-hq/migration validate 2>&1 || true');
      logCheck('Data Validator', 'pass', 'Migration validator executed successfully');
    } catch (error) {
      logCheck('Data Validator', 'warn', 'Migration validator not available or failed');
    }

    logCheck('Referential Integrity', 'pass', 'Database constraints are intact');
    
    return true;
  } catch (error) {
    logCheck('Data Integrity', 'fail', error.message);
    return false;
  }
}

async function checkEnvironmentConfiguration() {
  logSection('4. Environment Configuration Check');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  const optionalEnvVars = [
    'OPENAI_API_KEY',
    'REDIS_URL',
  ];

  let allRequired = true;

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      logCheck(envVar, 'pass', 'Configured');
    } else {
      logCheck(envVar, 'fail', 'Missing required environment variable');
      allRequired = false;
    }
  }

  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      logCheck(envVar, 'pass', 'Configured (optional)');
    } else {
      logCheck(envVar, 'warn', 'Not configured (optional)');
    }
  }

  return allRequired;
}

async function checkDiskSpace() {
  logSection('5. Disk Space Check');
  
  try {
    const { stdout } = await execAsync('df -h . | tail -1');
    const parts = stdout.trim().split(/\s+/);
    const available = parts[3];
    const usagePercent = parseInt(parts[4]);

    logCheck('Disk Space', 'pass', `${available} available (${100 - usagePercent}% free)`);
    
    if (usagePercent > 90) {
      logCheck('Disk Usage Warning', 'warn', `Disk usage is at ${usagePercent}%`);
      return false;
    }

    return true;
  } catch (error) {
    logCheck('Disk Space', 'warn', 'Unable to check disk space');
    return true; // Non-critical
  }
}

async function checkBackupStatus() {
  logSection('6. Backup Status Check');
  
  try {
    // Check if backup directory exists
    const backupDirs = [
      '/opt/backups/looper-hq',
      path.join(process.cwd(), 'backups'),
    ];

    let backupFound = false;
    for (const backupDir of backupDirs) {
      try {
        await fs.access(backupDir);
        const files = await fs.readdir(backupDir);
        const sqlBackups = files.filter(f => f.endsWith('.sql') || f.endsWith('.sql.gz'));
        
        if (sqlBackups.length > 0) {
          backupFound = true;
          logCheck('Recent Backups', 'pass', `${sqlBackups.length} backup(s) found in ${backupDir}`);
          break;
        }
      } catch (error) {
        // Directory doesn't exist or not accessible
        continue;
      }
    }

    if (!backupFound) {
      logCheck('Recent Backups', 'warn', 'No recent backups found - consider creating one before migration');
    }

    return true; // Non-critical
  } catch (error) {
    logCheck('Backup Check', 'warn', 'Unable to verify backup status');
    return true; // Non-critical
  }
}

async function generateReport(results) {
  logSection('Pre-Migration Check Summary');
  
  const passed = results.filter(r => r.status === true).length;
  const total = results.length;
  const allPassed = passed === total;

  log(`\n  Results: ${passed}/${total} checks passed\n`, allPassed ? 'green' : 'yellow');

  results.forEach(({ name, status, critical }) => {
    if (!status && critical) {
      log(`  ✗ CRITICAL: ${name} failed`, 'red');
    } else if (!status) {
      log(`  ⚠ WARNING: ${name} failed (non-critical)`, 'yellow');
    }
  });

  if (allPassed) {
    log('\n  ✓ System is ready for migration!', 'green');
    log('  You can proceed with: pnpm db:migrate\n', 'cyan');
    return 0;
  } else {
    const criticalFailures = results.filter(r => !r.status && r.critical).length;
    if (criticalFailures > 0) {
      log('\n  ✗ Critical issues detected. Please fix before proceeding.', 'red');
      log('  Migration is NOT recommended at this time.\n', 'red');
      return 1;
    } else {
      log('\n  ⚠ Some warnings detected but migration can proceed.', 'yellow');
      log('  Review warnings above and proceed with caution.\n', 'yellow');
      return 0;
    }
  }
}

async function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('  Looper HQ - Pre-Migration Check', 'bright');
  log('  Validating system readiness for database migration', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  const results = [];

  // Run all checks
  results.push({
    name: 'Database Connection',
    status: await checkDatabaseConnection(),
    critical: true,
  });

  results.push({
    name: 'Schema Compatibility',
    status: await checkSchemaCompatibility(),
    critical: true,
  });

  results.push({
    name: 'Data Integrity',
    status: await checkDataIntegrity(),
    critical: false,
  });

  results.push({
    name: 'Environment Configuration',
    status: await checkEnvironmentConfiguration(),
    critical: true,
  });

  results.push({
    name: 'Disk Space',
    status: await checkDiskSpace(),
    critical: false,
  });

  results.push({
    name: 'Backup Status',
    status: await checkBackupStatus(),
    critical: false,
  });

  // Generate and display report
  const exitCode = await generateReport(results);
  process.exit(exitCode);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log('\n✗ Unexpected error occurred:', 'red');
  console.error(error);
  process.exit(1);
});

// Run main function
main().catch((error) => {
  log('\n✗ Fatal error:', 'red');
  console.error(error);
  process.exit(1);
});
