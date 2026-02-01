# Looper HQ Data Migration

This package contains scripts and utilities for migrating legacy data from **HK-Legal-Case-Agency** and **hk-legalcase-system** into the unified Looper HQ database.

## 📋 Overview

The migration process transfers:
- **Clients & Users** from both legacy systems
- **Cases** with preserved relationships
- **Memberships** with tier mappings
- **Search History** for analytics

All data transformations preserve data integrity and create audit trails via activity logs.

## 🚀 Quick Start

### Prerequisites

1. **Database Running**
   ```bash
   pnpm docker:up
   ```

2. **Environment Variables**
   Ensure `DATABASE_URL` is set in your `.env` file at the project root.

3. **Legacy Data**
   Place legacy data exports in:
   - `packages/migration/data/legacy/hk-legal-case-agency/`
   - `packages/migration/data/legacy/hk-legalcase-system/`

### Create Sample Data (For Testing)

```bash
cd packages/migration
pnpm export:legacy --sample
```

This creates sample legacy data files for testing the migration.

### Run Full Migration

```bash
cd packages/migration
pnpm migrate:all
```

This will:
1. Create a database backup
2. Migrate clients and users
3. Migrate cases
4. Migrate memberships
5. Migrate search history
6. Validate all migrated data
7. Display migration summary

## 📦 Individual Migration Scripts

You can run migrations individually in the correct dependency order:

```bash
# Migrate clients first (required for cases)
pnpm migrate:clients

# Migrate cases (requires clients)
pnpm migrate:cases

# Migrate memberships
pnpm migrate:memberships

# Migrate search history
pnpm migrate:search-history
```

## 🔍 Data Validation

Validate migrated data for integrity:

```bash
pnpm validate
```

This checks for:
- Orphaned records
- Duplicate case numbers
- Duplicate emails
- Missing relationships
- Data consistency

## 📊 Data Analysis

Analyze legacy data before migration:

```bash
pnpm analyze
```

This generates reports on:
- Total record counts
- Valid vs invalid records
- Missing required fields
- Duplicate detection
- Data quality recommendations

## 💾 Backup & Rollback

### Create Backup

```bash
pnpm backup
```

Creates a PostgreSQL dump in `data/backups/`.

### Rollback Migration

If migration fails or you need to revert:

```bash
# Restore from latest backup
pnpm rollback

# Restore from specific backup
pnpm rollback data/backups/backup-2026-01-15.sql

# Manual rollback (truncate without restore)
tsx src/scripts/rollback.ts --manual
```

## 📁 Data Sources

### Expected File Structure

```
data/legacy/
├── hk-legal-case-agency/
│   ├── cases.json
│   ├── clients.json
│   └── search-history.json (optional)
└── hk-legalcase-system/
    ├── cases.json
    ├── clients.json
    ├── memberships.json
    └── search-history.json (optional)
```

### Data Formats

All files should be JSON arrays. Example:

**clients.json:**
```json
[
  {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+852 9123 4567",
    "type": "individual",
    "created_at": "2023-01-15T10:00:00Z"
  }
]
```

**cases.json:**
```json
[
  {
    "id": 1,
    "title": "Contract Dispute",
    "description": "Commercial contract dispute",
    "status": "active",
    "priority": "high",
    "category": "civil",
    "client_id": 1,
    "created_at": "2023-03-01T09:00:00Z"
  }
]
```

## 🔄 Transformation Rules

### Status Mapping

| Legacy Status | New Status   |
|--------------|--------------|
| open         | ACTIVE       |
| active       | ACTIVE       |
| pending      | PENDING      |
| closed       | COMPLETED    |
| archived     | ARCHIVED     |
| cancelled    | CANCELLED    |

### Priority Mapping

| Legacy Priority | New Priority |
|----------------|--------------|
| low / 1        | LOW          |
| medium / 2     | MEDIUM       |
| high / 3       | HIGH         |
| urgent / 4     | URGENT       |

### Category Mapping

| Legacy Category | New Category             |
|----------------|--------------------------|
| civil          | CIVIL                    |
| criminal       | CRIMINAL                 |
| corporate      | CORPORATE                |
| family         | FAMILY                   |
| property       | PROPERTY                 |
| employment     | EMPLOYMENT               |
| ip             | INTELLECTUAL_PROPERTY    |

### Membership Tier Mapping

| Legacy Tier | New Tier  | Search Limit | Case Limit |
|-------------|-----------|--------------|------------|
| basic/free  | BASIC     | 10           | 1          |
| standard    | STANDARD  | 50           | 5          |
| premium/pro | PREMIUM   | 200          | 20         |
| premier     | PREMIER   | Unlimited    | Unlimited  |

### Case Number Generation

Legacy case IDs are transformed into new case numbers:
- **Format:** `HK-YYYY-XXXXXX`
- **Example:** Legacy ID `123` → `HK-2026-000123`

## 📝 Logs

Migration logs are stored in `logs/`:
- `migration-master-*.log` - Full migration logs
- `error-*.log` - Error-specific logs
- `errors-*.json` - Detailed error data for failed records

## ⚙️ Environment Variables

Required environment variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/looper_hq"
LOG_LEVEL="info"  # Optional: debug, info, warn, error
```

## 🧪 Testing

To test the migration:

1. Create sample data:
   ```bash
   pnpm export:legacy --sample
   ```

2. Run migration:
   ```bash
   pnpm migrate:all
   ```

3. Validate results:
   ```bash
   pnpm validate
   ```

4. Rollback if needed:
   ```bash
   pnpm rollback
   ```

## 🐛 Troubleshooting

### "No client mapping found"
- **Cause:** Case references a client that wasn't migrated
- **Solution:** Ensure clients are migrated before cases

### "Duplicate email found"
- **Cause:** Same email exists in both legacy systems
- **Solution:** Manually deduplicate or remove duplicates from source data

### "Backup failed"
- **Cause:** `pg_dump` not available or DATABASE_URL invalid
- **Solution:** Install PostgreSQL tools or check connection string

### "Validation failed"
- **Cause:** Data integrity issues detected
- **Solution:** Review validation report and check error logs

## 📈 Migration Metrics

After migration, you'll see a report like:

```
📊 Migration Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Cases Migrated:      150 / 150 (100%)
✅ Clients Migrated:    75 / 75 (100%)
✅ Users Created:       75 / 75 (100%)
✅ Memberships:         75 / 75 (100%)
✅ Search History:      500 / 500 (100%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  Warnings:           0
❌ Errors:              0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Migration Status:    SUCCESS
```

## 🔒 Security Notes

- Backups contain sensitive data - store securely
- Review migrated data for PII compliance
- Keycloak IDs will be synced in a separate step
- Activity logs track all migration events

## 📚 Related Documentation

- [Architecture Overview](../../docs/ARCHITECTURE.md)
- [Database Schema](../database/prisma/schema.prisma)
- [Quick Start Guide](../../docs/QUICKSTART.md)

## 🆘 Support

For issues or questions:
1. Check troubleshooting section above
2. Review error logs in `logs/`
3. Contact the development team
