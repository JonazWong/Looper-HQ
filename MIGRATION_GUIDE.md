# Bilingual Fields Migration Guide

## Overview

This guide explains how to migrate the Looper HQ database from single-language fields to bilingual fields for full i18n support.

## Prerequisites

- Database backup completed
- Development environment with database access
- pnpm 8+ installed
- Node 18+ installed

## Migration Steps

### 1. Backup Database

```bash
# Create a backup before migration
pg_dump -h localhost -U postgres -d looper_hq > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Generate and Review Migration

```bash
# Navigate to database package
cd packages/database

# Generate migration
pnpm prisma migrate dev --name add_bilingual_fields

# This will create a migration file in prisma/migrations/
```

### 3. Expected Migration SQL

The migration will perform the following operations:

```sql
-- Add bilingual fields to Case table
ALTER TABLE "cases" ADD COLUMN "title_zh" TEXT NOT NULL DEFAULT '';
ALTER TABLE "cases" ADD COLUMN "title_en" TEXT NOT NULL DEFAULT '';
ALTER TABLE "cases" ADD COLUMN "description_zh" TEXT;
ALTER TABLE "cases" ADD COLUMN "description_en" TEXT;
ALTER TABLE "cases" ADD COLUMN "publicNote_zh" TEXT;
ALTER TABLE "cases" ADD COLUMN "publicNote_en" TEXT;

-- Migrate existing data (copy from old fields to Chinese fields)
UPDATE "cases" SET "title_zh" = "title" WHERE "title" IS NOT NULL;
UPDATE "cases" SET "title_en" = "title" WHERE "title" IS NOT NULL;
UPDATE "cases" SET "description_zh" = "description" WHERE "description" IS NOT NULL;
UPDATE "cases" SET "description_en" = "description" WHERE "description" IS NOT NULL;
UPDATE "cases" SET "publicNote_zh" = "publicNote" WHERE "publicNote" IS NOT NULL;
UPDATE "cases" SET "publicNote_en" = "publicNote" WHERE "publicNote" IS NOT NULL;

-- Drop old single-language fields (optional - keep for rollback)
-- ALTER TABLE "cases" DROP COLUMN "title";
-- ALTER TABLE "cases" DROP COLUMN "description";
-- ALTER TABLE "cases" DROP COLUMN "publicNote";

-- Add bilingual fields to CaseNote table
ALTER TABLE "case_notes" ADD COLUMN "content_zh" TEXT NOT NULL DEFAULT '';
ALTER TABLE "case_notes" ADD COLUMN "content_en" TEXT NOT NULL DEFAULT '';

-- Migrate existing case note data
UPDATE "case_notes" SET "content_zh" = "content" WHERE "content" IS NOT NULL;
UPDATE "case_notes" SET "content_en" = "content" WHERE "content" IS NOT NULL;

-- Drop old content field (optional - keep for rollback)
-- ALTER TABLE "case_notes" DROP COLUMN "content";

-- Add bilingual fields to Client table
ALTER TABLE "clients" ADD COLUMN "notes_zh" TEXT;
ALTER TABLE "clients" ADD COLUMN "notes_en" TEXT;

-- Add bilingual fields to PublicCase table
ALTER TABLE "public_cases" ADD COLUMN "title_zh" TEXT NOT NULL DEFAULT '';
ALTER TABLE "public_cases" ADD COLUMN "title_en" TEXT NOT NULL DEFAULT '';
ALTER TABLE "public_cases" ADD COLUMN "description_zh" TEXT;
ALTER TABLE "public_cases" ADD COLUMN "description_en" TEXT;
ALTER TABLE "public_cases" ADD COLUMN "judgment_zh" TEXT;
ALTER TABLE "public_cases" ADD COLUMN "judgment_en" TEXT;

-- Migrate existing public case data
UPDATE "public_cases" SET "title_zh" = "title" WHERE "title" IS NOT NULL;
UPDATE "public_cases" SET "title_en" = "title" WHERE "title" IS NOT NULL;
UPDATE "public_cases" SET "description_zh" = "description" WHERE "description" IS NOT NULL;
UPDATE "public_cases" SET "description_en" = "description" WHERE "description" IS NOT NULL;
UPDATE "public_cases" SET "judgment_zh" = "judgment" WHERE "judgment" IS NOT NULL;
UPDATE "public_cases" SET "judgment_en" = "judgment" WHERE "judgment" IS NOT NULL;

-- Drop old fields (optional - keep for rollback)
-- ALTER TABLE "public_cases" DROP COLUMN "title";
-- ALTER TABLE "public_cases" DROP COLUMN "description";
-- ALTER TABLE "public_cases" DROP COLUMN "judgment";
```

### 4. Apply Migration

```bash
# Apply migration to development database
pnpm db:push

# OR for production (creates migration files)
pnpm db:migrate

# Verify migration succeeded
pnpm --filter=@looper-hq/database prisma studio
```

### 5. Update Data (Manual Translation)

After migration, existing data will have:
- Chinese fields (`*_zh`) populated with original data
- English fields (`*_en`) populated with copy of original data (placeholder)

You should:
1. Review existing cases and update English translations
2. Update Chinese translations if original data was in English
3. Use AI translation API or manual translation as needed

Example update script:

```sql
-- Update specific case translations
UPDATE "cases" 
SET 
  "title_en" = 'Property Boundary Dispute',
  "description_en" = 'Boundary dispute regarding property at 123 Queen''s Road Central.'
WHERE "caseNumber" = 'HK-2026-001';
```

### 6. Seed Development Data

```bash
# Clear and reseed development database with bilingual examples
pnpm db:seed
```

### 7. Test Application

```bash
# Start development server
pnpm dev

# Test checklist:
# [ ] Create new case with bilingual data
# [ ] View case list in Chinese locale
# [ ] View case list in English locale
# [ ] Search cases in both languages
# [ ] Create case notes with bilingual content
# [ ] Edit existing case with new fields
```

### 8. Deploy to Production

```bash
# Generate production migration
pnpm --filter=@looper-hq/database prisma migrate deploy

# Run in production environment
# Database will be automatically migrated on deployment
```

## Rollback Strategy

If you need to rollback:

### Option 1: Restore from Backup

```bash
# Drop current database
dropdb looper_hq

# Restore from backup
createdb looper_hq
psql -U postgres -d looper_hq < backup_YYYYMMDD_HHMMSS.sql
```

### Option 2: Manual Rollback (if old fields kept)

```sql
-- Revert Case table
UPDATE "cases" SET "title" = "title_zh" WHERE "title_zh" IS NOT NULL;
UPDATE "cases" SET "description" = "description_zh" WHERE "description_zh" IS NOT NULL;
UPDATE "cases" SET "publicNote" = "publicNote_zh" WHERE "publicNote_zh" IS NOT NULL;

ALTER TABLE "cases" DROP COLUMN "title_zh";
ALTER TABLE "cases" DROP COLUMN "title_en";
ALTER TABLE "cases" DROP COLUMN "description_zh";
ALTER TABLE "cases" DROP COLUMN "description_en";
ALTER TABLE "cases" DROP COLUMN "publicNote_zh";
ALTER TABLE "cases" DROP COLUMN "publicNote_en";

-- Similar for other tables...
```

## Post-Migration Checklist

- [ ] All existing cases display correctly in both locales
- [ ] New case creation works with bilingual inputs
- [ ] Search functionality works in both languages
- [ ] Case notes display correctly in both locales
- [ ] Public cases display correctly
- [ ] API responses include bilingual fields
- [ ] No TypeScript errors
- [ ] All tests passing

## Troubleshooting

### Error: Column "title" does not exist

**Cause**: Old code trying to access deprecated single-language fields

**Solution**: Ensure all code has been updated to use bilingual fields (`title_zh`, `title_en`)

### Error: NOT NULL constraint failed

**Cause**: Trying to create record without required bilingual fields

**Solution**: Update validation schemas and forms to require both language fields

### Search not working in one language

**Cause**: Search queries not updated to include both language fields

**Solution**: Verify API routes include both `title_zh` and `title_en` in search OR clause

## Support

For issues or questions:
1. Check GitHub Issues: https://github.com/JonazWong/Looper-HQ/issues
2. Review Prisma documentation: https://www.prisma.io/docs/
3. Check application logs for detailed error messages
