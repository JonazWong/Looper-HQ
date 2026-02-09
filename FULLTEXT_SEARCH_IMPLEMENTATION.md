# Full-Text Search Implementation Guide

## Overview
This implementation adds PostgreSQL Full-Text Search (FTS) capabilities to the PublicCase model, enabling high-performance legal case searches with Chinese and English text support.

## Implementation Components

### 1. Database Migration
**File**: `packages/database/prisma/migrations/add_full_text_search.sql`

This SQL migration adds:
- `search_vector` column (tsvector type) to PublicCase table
- Chinese text search configuration
- Automatic trigger to update search vectors on INSERT/UPDATE
- GIN index for fast full-text search
- Initial population of search vectors for existing records

### 2. Prisma Schema Update
**File**: `packages/database/prisma/schema.prisma`

Added to PublicCase model:
```prisma
searchVector Unsupported("tsvector")?
@@index([searchVector], type: Gin)
```

### 3. Search Engine Service
**File**: `apps/web/lib/services/search-engine.ts`

Provides three search modes:
- **Fulltext Search**: PostgreSQL FTS with ranking (fastest, most relevant)
- **Semantic Search**: Keyword-based matching (TODO: add pgvector for true semantic search)
- **Hybrid Search**: Combines both approaches

### 4. API Endpoints

#### Search API
- **GET** `/api/search` - General search with support for multiple modes
- **GET** `/api/public-cases` - Public case search with FTS integration

#### Suggestions & Trending
- **GET** `/api/search/suggestions?q={query}` - Auto-complete suggestions
- **GET** `/api/search/trending?limit={n}` - Trending searches (last 7 days)

### 5. Frontend Components

#### AdvancedSearchForm
**File**: `apps/web/components/search/advanced-search-form.tsx`

Features:
- Real-time search suggestions (300ms debounce)
- Trending searches display
- Auto-navigation to search results

#### Case Search Page
**File**: `apps/web/app/case-search/page.tsx`

Enhancements:
- Performance metrics display (search time in ms)
- Search mode indicator (fulltext/semantic/hybrid)
- Updated to use new FTS API

## Setup Instructions

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Generate Prisma Client
```bash
pnpm --filter=@looper-hq/database prisma generate
```

### Step 3: Apply Database Migration

**Option A: Using psql (Recommended for manual migration)**
```bash
# Connect to your PostgreSQL database
psql -U postgres -d looper_hq

# Run the migration file
\i packages/database/prisma/migrations/add_full_text_search.sql

# Verify the changes
\d "PublicCase"
```

**Option B: Using Prisma Migrate**
```bash
# Push schema changes to database
pnpm --filter=@looper-hq/database db:push
```

Note: After Prisma push, you'll still need to manually run the SQL migration file to add the FTS triggers and functions.

### Step 4: Verify Migration

Connect to your database and check:
```sql
-- Check if search_vector column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'PublicCase' AND column_name = 'search_vector';

-- Check if index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'PublicCase' AND indexname = 'public_case_search_idx';

-- Check if trigger exists
SELECT tgname 
FROM pg_trigger 
WHERE tgrelid = '"PublicCase"'::regclass 
AND tgname = 'public_case_search_vector_trigger';

-- Test full-text search
SELECT id, title, ts_rank(search_vector, to_tsquery('chinese', '刑事')) as rank
FROM "PublicCase"
WHERE search_vector @@ to_tsquery('chinese', '刑事')
ORDER BY rank DESC
LIMIT 5;
```

### Step 5: Start Development Server
```bash
pnpm dev
```

## Testing the Implementation

### 1. Test Search API

**Full-text Search:**
```bash
curl "http://localhost:3005/api/search?q=刑事&mode=fulltext&limit=5"
```

**Semantic Search:**
```bash
curl "http://localhost:3005/api/search?q=theft&mode=semantic&limit=5"
```

**Hybrid Search:**
```bash
curl "http://localhost:3005/api/search?q=assault&mode=hybrid&limit=5"
```

**Public Cases API:**
```bash
curl "http://localhost:3005/api/public-cases?query=案件&limit=10"
```

### 2. Test Suggestions API
```bash
curl "http://localhost:3005/api/search/suggestions?q=刑"
```

### 3. Test Trending Searches API
```bash
curl "http://localhost:3005/api/search/trending?limit=10"
```

### 4. Frontend Testing

1. Navigate to `http://localhost:3005/case-search`
2. Type a search query (e.g., "刑事案件")
3. Observe:
   - Auto-suggestions appear after 2+ characters
   - Trending searches displayed below search box
   - Search results show performance metrics (ms)
   - Search mode badge displayed (fulltext/semantic/hybrid)

### 5. Performance Benchmarking

Create test data and measure performance:
```sql
-- Insert test cases (if needed)
INSERT INTO "PublicCase" (id, source, "externalId", title, description, keywords, tags, category)
SELECT 
  gen_random_uuid()::text,
  'HK_JUDICIARY',
  'TEST-' || generate_series,
  '測試案件 ' || generate_series,
  '這是一個測試案件的描述 ' || generate_series,
  ARRAY['測試', '案件'],
  ARRAY['test'],
  'CRIMINAL'
FROM generate_series(1, 1000);

-- Measure search performance
EXPLAIN ANALYZE
SELECT id, title, ts_rank(search_vector, to_tsquery('chinese', '測試')) as rank
FROM "PublicCase"
WHERE search_vector @@ to_tsquery('chinese', '測試')
ORDER BY rank DESC
LIMIT 20;
```

Expected performance:
- **Search Time**: < 200ms (typically 10-50ms for indexed searches)
- **Suggestion Latency**: < 300ms
- **API Response**: < 500ms (including network overhead)

## Acceptance Criteria Checklist

- [ ] PostgreSQL FTS index created successfully
- [ ] search_vector column populated for existing records
- [ ] Trigger automatically updates search_vector on INSERT/UPDATE
- [ ] Full-text search API returns results in < 200ms
- [ ] Search supports Chinese and English text
- [ ] Search suggestions API working with < 300ms latency
- [ ] Trending searches API returns last 7 days data
- [ ] Frontend displays performance metrics
- [ ] AdvancedSearchForm shows auto-suggestions
- [ ] AdvancedSearchForm displays trending searches

## Troubleshooting

### Issue: Search returns no results
- **Cause**: search_vector not populated
- **Solution**: Run UPDATE statement from migration file

### Issue: Slow search performance
- **Cause**: GIN index not created
- **Solution**: Verify index exists, recreate if needed:
  ```sql
  CREATE INDEX public_case_search_idx ON "PublicCase" USING GIN(search_vector);
  ```

### Issue: Chinese text not searchable
- **Cause**: Text search configuration not set
- **Solution**: Verify 'chinese' configuration exists:
  ```sql
  SELECT cfgname FROM pg_ts_config WHERE cfgname = 'chinese';
  ```

### Issue: Trigger not firing
- **Cause**: Trigger not created or function missing
- **Solution**: Re-run trigger creation from migration file

## Future Enhancements

1. **Vector Search with pgvector**
   - Install pgvector extension
   - Add embedding column to PublicCase
   - Implement true semantic search using AI embeddings

2. **Search Analytics**
   - Track search queries and click-through rates
   - Provide search insights dashboard
   - Optimize ranking based on user behavior

3. **Advanced Filters**
   - Date range filters
   - Multi-source filtering
   - Saved search queries

4. **Search Highlighting**
   - Highlight matched terms in results
   - Show context snippets with matches

## References

- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Prisma Unsupported Types](https://www.prisma.io/docs/concepts/components/prisma-schema/features-without-psl-equivalent)
- [tsquery & tsvector](https://www.postgresql.org/docs/current/datatype-textsearch.html)
