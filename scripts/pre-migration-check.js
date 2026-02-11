#!/usr/bin/env node
/**
 * Pre-migration verification script
 * Checks if the system is ready for Digital Ocean migration
 * 
 * Usage: node scripts/pre-migration-check.js
 * Or: pnpm pre-migration-check
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running pre-migration checks for Looper HQ...\n');
console.log('=' .repeat(60));

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// Helper function to check file existence
function fileExists(filePath) {
  try {
    return fs.existsSync(path.join(__dirname, '..', filePath));
  } catch (err) {
    return false;
  }
}

// Helper function to read file content safely
function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
  } catch (err) {
    return '';
  }
}

// Check 1: Required files exist
console.log('\n1️⃣  Checking required files...');
const requiredFiles = [
  { path: '.do/app.yaml', critical: true },
  { path: 'package.json', critical: true },
  { path: 'pnpm-lock.yaml', critical: true },
  { path: '.env.example', critical: true },
  { path: 'apps/web/package.json', critical: true },
  { path: 'apps/web/next.config.js', critical: false },
  { path: 'packages/database/prisma/schema.prisma', critical: true },
  { path: 'turbo.json', critical: true },
  { path: 'docs/deployment/README.md', critical: false },
  { path: 'docs/deployment/migrate-from-agency.md', critical: false }
];

requiredFiles.forEach(file => {
  if (fileExists(file.path)) {
    console.log(`   ✅ ${file.path}`);
    checks.passed++;
  } else {
    if (file.critical) {
      console.log(`   ❌ ${file.path} - MISSING (CRITICAL)`);
      checks.failed++;
    } else {
      console.log(`   ⚠️  ${file.path} - MISSING (optional)`);
      checks.warnings++;
    }
  }
});

// Check 2: Environment variables documented
console.log('\n2️⃣  Checking environment variable documentation...');
const envExample = readFile('.env.example');
const requiredEnvVars = [
  { name: 'DATABASE_URL', critical: true },
  { name: 'NEXTAUTH_SECRET', critical: true },
  { name: 'NEXTAUTH_URL', critical: true },
  { name: 'OPENAI_API_KEY', critical: true },
  { name: 'OPENAI_BASE_URL', critical: false },
  { name: 'OPENAI_MODEL', critical: false },
  { name: 'NODE_ENV', critical: false }
];

requiredEnvVars.forEach(envVar => {
  if (envExample.includes(envVar.name)) {
    console.log(`   ✅ ${envVar.name}`);
    checks.passed++;
  } else {
    if (envVar.critical) {
      console.log(`   ❌ ${envVar.name} - Not documented (CRITICAL)`);
      checks.failed++;
    } else {
      console.log(`   ⚠️  ${envVar.name} - Not documented`);
      checks.warnings++;
    }
  }
});

// Check 3: Build configuration
console.log('\n3️⃣  Checking build configuration...');
const packageJson = JSON.parse(readFile('package.json'));

if (packageJson.scripts && packageJson.scripts.build) {
  console.log(`   ✅ Root build script exists: "${packageJson.scripts.build}"`);
  checks.passed++;
} else {
  console.log(`   ❌ Root build script missing`);
  checks.failed++;
}

if (packageJson.scripts && packageJson.scripts.dev) {
  console.log(`   ✅ Dev script exists: "${packageJson.scripts.dev}"`);
  checks.passed++;
} else {
  console.log(`   ⚠️  Dev script missing`);
  checks.warnings++;
}

// Check 4: Database configuration
console.log('\n4️⃣  Checking database configuration...');

if (fileExists('packages/database/prisma/schema.prisma')) {
  const schemaContent = readFile('packages/database/prisma/schema.prisma');
  
  if (schemaContent.includes('provider = "postgresql"')) {
    console.log(`   ✅ PostgreSQL provider configured`);
    checks.passed++;
  } else {
    console.log(`   ❌ PostgreSQL provider not found in schema`);
    checks.failed++;
  }
  
  // Check for important models
  const requiredModels = ['User', 'Case', 'Client'];
  requiredModels.forEach(model => {
    if (schemaContent.includes(`model ${model}`)) {
      console.log(`   ✅ ${model} model exists`);
      checks.passed++;
    } else {
      console.log(`   ⚠️  ${model} model not found`);
      checks.warnings++;
    }
  });
} else {
  console.log(`   ❌ Prisma schema not found`);
  checks.failed++;
}

// Check 5: Digital Ocean App Platform configuration
console.log('\n5️⃣  Checking Digital Ocean configuration...');

if (fileExists('.do/app.yaml')) {
  const appYaml = readFile('.do/app.yaml');
  
  if (appYaml.includes('name:')) {
    console.log(`   ✅ App Platform spec exists`);
    checks.passed++;
  } else {
    console.log(`   ⚠️  App Platform spec seems incomplete`);
    checks.warnings++;
  }
  
  if (appYaml.includes('database')) {
    console.log(`   ✅ Database configuration found`);
    checks.passed++;
  } else {
    console.log(`   ⚠️  Database configuration not in app.yaml`);
    checks.warnings++;
  }
} else {
  console.log(`   ❌ .do/app.yaml not found`);
  checks.failed++;
}

// Check 6: Package manager
console.log('\n6️⃣  Checking package manager configuration...');

if (fileExists('pnpm-lock.yaml')) {
  console.log(`   ✅ pnpm-lock.yaml exists`);
  checks.passed++;
} else {
  console.log(`   ❌ pnpm-lock.yaml missing (required for DO deployment)`);
  checks.failed++;
}

if (packageJson.packageManager) {
  console.log(`   ✅ Package manager specified: ${packageJson.packageManager}`);
  checks.passed++;
} else {
  console.log(`   ⚠️  Package manager not specified in package.json`);
  checks.warnings++;
}

// Check 7: TypeScript configuration
console.log('\n7️⃣  Checking TypeScript configuration...');

if (fileExists('tsconfig.json')) {
  console.log(`   ✅ Root tsconfig.json exists`);
  checks.passed++;
} else {
  console.log(`   ⚠️  Root tsconfig.json not found`);
  checks.warnings++;
}

if (fileExists('apps/web/tsconfig.json')) {
  console.log(`   ✅ Web app tsconfig.json exists`);
  checks.passed++;
} else {
  console.log(`   ❌ Web app tsconfig.json missing`);
  checks.failed++;
}

// Check 8: Monorepo configuration
console.log('\n8️⃣  Checking monorepo configuration...');

if (fileExists('pnpm-workspace.yaml')) {
  console.log(`   ✅ pnpm workspace configured`);
  checks.passed++;
} else {
  console.log(`   ❌ pnpm-workspace.yaml missing`);
  checks.failed++;
}

if (fileExists('turbo.json')) {
  const turboJson = JSON.parse(readFile('turbo.json'));
  if (turboJson.pipeline) {
    console.log(`   ✅ Turborepo pipeline configured`);
    checks.passed++;
  } else {
    console.log(`   ⚠️  Turborepo pipeline not configured`);
    checks.warnings++;
  }
} else {
  console.log(`   ❌ turbo.json missing`);
  checks.failed++;
}

// Check 9: Migration documentation
console.log('\n9️⃣  Checking migration documentation...');

const migrationDocs = [
  { path: 'docs/deployment/migrate-from-agency.md', name: 'Migration Guide' },
  { path: 'docs/deployment/environment-variables.md', name: 'Environment Variables Guide' },
  { path: 'docs/deployment/QUICK_REFERENCE.md', name: 'Quick Reference' }
];

migrationDocs.forEach(doc => {
  if (fileExists(doc.path)) {
    console.log(`   ✅ ${doc.name} exists`);
    checks.passed++;
  } else {
    console.log(`   ⚠️  ${doc.name} not found`);
    checks.warnings++;
  }
});

// Summary
console.log('\n' + '=' .repeat(60));
console.log('📊 Pre-Migration Check Summary:');
console.log('=' .repeat(60));
console.log(`   ✅ Passed:   ${checks.passed} checks`);
console.log(`   ❌ Failed:   ${checks.failed} checks`);
console.log(`   ⚠️  Warnings: ${checks.warnings} checks`);
console.log('=' .repeat(60));

// Final verdict
if (checks.failed === 0) {
  console.log('\n✨ System is ready for migration!');
  console.log('\n📖 Next steps:');
  console.log('   1. Review: docs/deployment/migrate-from-agency.md');
  console.log('   2. Backup your current Digital Ocean database');
  console.log('   3. Follow the migration guide step by step');
  console.log('   4. Run health checks after deployment');
  console.log('\n🚀 Good luck with the migration!');
  process.exit(0);
} else if (checks.failed <= 2) {
  console.log('\n⚠️  System has minor issues but may be ready for migration.');
  console.log('\n🔧 Recommendations:');
  console.log('   1. Review the failed checks above');
  console.log('   2. Fix critical issues if possible');
  console.log('   3. Proceed with caution');
  console.log('   4. Have a rollback plan ready');
  process.exit(0);
} else {
  console.log('\n❌ System is NOT ready for migration.');
  console.log('\n🔧 Required actions:');
  console.log('   1. Fix all failed checks above');
  console.log('   2. Run this script again: pnpm pre-migration-check');
  console.log('   3. Only proceed when all critical checks pass');
  console.log('\n📚 Need help? Check docs/deployment/README.md');
  process.exit(1);
}
