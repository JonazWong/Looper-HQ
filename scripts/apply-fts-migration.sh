#!/bin/bash

# Full-Text Search Migration Script
# This script applies the PostgreSQL full-text search migration to the database

set -e

echo "🔍 Full-Text Search Migration Script"
echo "===================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set it in your .env file or export it:"
    echo "  export DATABASE_URL='postgresql://user:password@localhost:5432/looper_hq'"
    exit 1
fi

echo "✓ DATABASE_URL found"
echo ""

# Extract database connection details from DATABASE_URL
DB_URL=$DATABASE_URL

echo "📋 Migration Steps:"
echo "1. Apply full-text search migration"
echo "2. Verify migration was successful"
echo ""

# Apply migration
echo "🚀 Applying migration..."
psql "$DB_URL" -f packages/database/prisma/migrations/add_full_text_search.sql

if [ $? -eq 0 ]; then
    echo "✓ Migration applied successfully"
else
    echo "❌ Migration failed"
    exit 1
fi

echo ""
echo "🔍 Verifying migration..."

# Verify search_vector column exists
psql "$DB_URL" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'public_cases' AND column_name = 'search_vector';" | grep -q "search_vector"
if [ $? -eq 0 ]; then
    echo "✓ search_vector column created"
else
    echo "❌ search_vector column not found"
    exit 1
fi

# Verify GIN index exists
psql "$DB_URL" -t -c "SELECT indexname FROM pg_indexes WHERE tablename = 'public_cases' AND indexname = 'public_case_search_idx';" | grep -q "public_case_search_idx"
if [ $? -eq 0 ]; then
    echo "✓ GIN index created"
else
    echo "❌ GIN index not found"
    exit 1
fi

# Verify trigger exists
psql "$DB_URL" -t -c "SELECT tgname FROM pg_trigger WHERE tgrelid = '\"public_cases\"'::regclass AND tgname = 'public_case_search_vector_trigger';" | grep -q "public_case_search_vector_trigger"
if [ $? -eq 0 ]; then
    echo "✓ Trigger created"
else
    echo "❌ Trigger not found"
    exit 1
fi

# Count records with search_vector populated
TOTAL_RECORDS=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM \"public_cases\";")
INDEXED_RECORDS=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM \"public_cases\" WHERE search_vector IS NOT NULL;")

echo "✓ Search vectors populated: $INDEXED_RECORDS / $TOTAL_RECORDS records"

echo ""
echo "✅ Migration completed successfully!"
echo ""
echo "Next steps:"
echo "1. Generate Prisma client: pnpm --filter=@looper-hq/database prisma generate"
echo "2. Start development server: pnpm dev"
echo "3. Test search API: curl 'http://localhost:3005/api/search?q=test&mode=fulltext'"
echo ""
