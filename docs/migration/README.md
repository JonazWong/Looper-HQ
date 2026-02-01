# Migration Guide

## Phase 4: Data Migration (Complete)

The data migration infrastructure is now in place to preserve all data from source repositories.

### From HK-Legal-Case-Agency
✅ Case records
✅ Client data
✅ Search functionality

### From hk-legalcase-system
✅ Legal cases
✅ Public search
✅ Membership tiers

## Migration Package

The migration package (`packages/migration`) provides comprehensive tools for data migration:

### Features
- **Automated Migration Scripts** - Full and individual migrations
- **Data Transformation** - Schema mapping and validation
- **Backup & Rollback** - Safety mechanisms for data protection
- **Validation & Integrity Checks** - Ensure data quality
- **Activity Logging** - Full audit trail

### Quick Start

1. **Prepare Legacy Data**
   ```bash
   # Create sample data for testing
   pnpm migrate:export-legacy --sample
   
   # Or place your real legacy data in:
   # - packages/migration/data/legacy/hk-legal-case-agency/
   # - packages/migration/data/legacy/hk-legalcase-system/
   ```

2. **Start Database**
   ```bash
   pnpm docker:up
   pnpm db:push
   ```

3. **Run Migration**
   ```bash
   # Full migration
   pnpm migrate:all
   
   # Or run individual migrations
   pnpm migrate:clients
   pnpm migrate:cases
   pnpm migrate:memberships
   ```

4. **Validate Results**
   ```bash
   pnpm migrate:validate
   ```

5. **Rollback if Needed**
   ```bash
   pnpm migrate:rollback
   ```

## Documentation

For detailed migration documentation, see:
- [Migration Package README](../packages/migration/README.md)
- Transformation rules and data mapping
- Troubleshooting guide

## Data Transformation

### Key Transformations
- **Case Numbers**: Legacy IDs → `HK-YYYY-XXXXXX` format
- **Status Mapping**: Legacy statuses → Prisma enums
- **Membership Tiers**: Legacy tiers → BASIC/STANDARD/PREMIUM/PREMIER
- **Email Deduplication**: Prevents duplicate user accounts

### Preserved Data
- All case relationships
- Client information
- Membership history
- Search analytics
- Timestamps and audit data

## Migration Safety

✅ **Automatic Backups** - Created before migration
✅ **Validation Checks** - Referential integrity verified
✅ **Error Logging** - Detailed error tracking
✅ **Rollback Capability** - Quick recovery from issues
✅ **Activity Logs** - Complete migration audit trail

