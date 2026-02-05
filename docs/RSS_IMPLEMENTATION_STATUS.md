# RSS Implementation Status

## Overview

This document tracks the implementation status of RSS feed integration for legal news tracking in Looper HQ.

## RSS Sources Configuration

### Active Sources ✅

| Source | Status | URL | Keywords | Last Updated |
|--------|--------|-----|----------|--------------|
| SCMP (Legal) | ACTIVE | `https://www.scmp.com/rss/2/feed` | court, law, legal, judge | 2024-01-20 |
| RTHK News | ACTIVE | `https://rthk.hk/rss/news.xml` | 法庭, 法院, 律師 | 2024-01-20 |
| HK01 (Law) | PLANNED | TBD | 法律, 訴訟 | - |

### Deprecated Sources 🚫

| Source | Status | Reason | Archived |
|--------|--------|--------|----------|
| Apple Daily | DEPRECATED | Ceased publication on 2021-06-24 | Yes |

## Implementation Checklist

### Phase 1: Database Schema ✅

- [x] Create `RssSource` model
- [x] Add `source` enum field
- [x] Add `status` field (ACTIVE/INACTIVE/ERROR/DEPRECATED)
- [x] Add error tracking (`lastError`, `lastFetchAt`)
- [x] Add retry strategy fields (`fetchInterval`, `maxRetries`, `retryDelay`)
- [x] Add keyword filtering arrays
- [x] Create indexes for efficient querying

### Phase 2: RSS Parser Service

- [x] Install dependencies (`rss-parser`, `axios`)
- [x] Create `lib/services/rss-parser.ts`
  - [ ] Implement RSS feed fetching
  - [ ] Error handling with retry logic
  - [ ] Timeout configuration
  - [ ] User agent customization
- [ ] Create `lib/services/keyword-filter.ts`
  - [ ] Keyword matching logic
  - [ ] Exclude keyword logic
  - [ ] Case-insensitive matching
  - [ ] Multi-language support (繁中/EN)
- [ ] Add logging with timestamps

### Phase 3: Data Extraction & Storage

- [ ] Create data transformer for RSS items
  - [ ] Extract title, description, link
  - [ ] Parse publish date
  - [ ] Extract author if available
  - [ ] Generate keywords from content
- [ ] Implement upsert logic
  - [ ] Check existing by source + externalId
  - [ ] Update if exists, create if new
  - [ ] Track crawled timestamp
- [ ] Add validation
  - [ ] Required fields check
  - [ ] URL validation
  - [ ] Date format validation

### Phase 4: Crawler Scripts

- [ ] Create `scripts/crawlers/rss-news-crawler.ts`
  - [ ] Load active RSS sources from database
  - [ ] Fetch each source sequentially
  - [ ] Apply keyword filters
  - [ ] Save to database
  - [ ] Update source status
  - [ ] Log statistics
- [ ] Error handling
  - [ ] Catch network errors
  - [ ] Catch parse errors
  - [ ] Update RssSource.lastError
  - [ ] Continue with next source on failure
- [ ] Add CLI arguments
  - [ ] `--source`: Crawl specific source
  - [ ] `--dry-run`: Test without writing to DB
  - [ ] `--verbose`: Detailed logging

### Phase 5: Integration & Testing

- [ ] Add npm scripts to package.json
  - [ ] `pnpm run crawler:rss`
  - [ ] `pnpm run crawler:rss:test`
- [ ] Create RSS source seed data
  - [ ] Add SCMP RSS source
  - [ ] Add RTHK RSS source
  - [ ] Mark Apple Daily as DEPRECATED
- [ ] Manual testing
  - [ ] Test successful fetch
  - [ ] Test keyword filtering
  - [ ] Test error handling
  - [ ] Test upsert deduplication
- [ ] Add unit tests
  - [ ] RSS parser tests
  - [ ] Keyword filter tests
  - [ ] Data transformer tests

### Phase 6: Monitoring & Maintenance

- [ ] Create admin API endpoints
  - [ ] GET /api/admin/rss-sources (list all sources)
  - [ ] PUT /api/admin/rss-sources/:id (update source config)
  - [ ] POST /api/admin/rss-sources/:id/reset (reset error status)
  - [ ] GET /api/admin/rss-sources/:id/stats (fetch statistics)
- [ ] Create admin UI
  - [ ] RSS sources management page
  - [ ] View source status
  - [ ] Edit keywords
  - [ ] Manual trigger fetch
  - [ ] View error logs
- [ ] Add metrics
  - [ ] Total articles fetched
  - [ ] Success/failure rate
  - [ ] Average fetch duration
  - [ ] Last successful fetch time

## RSS Source Configuration Schema

### Database Model

```prisma
model RssSource {
  id              String   @id @default(cuid())
  name            String
  source          CaseSource
  url             String
  isActive        Boolean  @default(true)
  status          RssSourceStatus @default(ACTIVE)
  lastError       String?  @db.Text
  lastFetchAt     DateTime?
  fetchInterval   Int      @default(3600)
  maxRetries      Int      @default(3)
  retryDelay      Int      @default(300)
  keywords        String[]
  excludeKeywords String[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum RssSourceStatus {
  ACTIVE
  INACTIVE
  ERROR
  DEPRECATED
}
```

### Seed Data Example

```typescript
const rssSources = [
  {
    name: 'South China Morning Post - Legal',
    source: 'SCMP_RSS',
    url: 'https://www.scmp.com/rss/2/feed',
    isActive: true,
    status: 'ACTIVE',
    fetchInterval: 3600,
    keywords: [
      'court', 'law', 'legal', 'judge', 'lawsuit',
      'prosecution', 'trial', 'verdict', 'justice',
      '法庭', '法院', '法律', '法官', '訴訟'
    ],
    excludeKeywords: ['sports', 'entertainment', 'food']
  },
  {
    name: 'RTHK News',
    source: 'RTHK_RSS',
    url: 'https://rthk.hk/rss/news.xml',
    isActive: true,
    status: 'ACTIVE',
    fetchInterval: 3600,
    keywords: [
      '法庭', '法院', '律師', '檢控', '判決',
      '裁決', '司法', '訴訟', '刑事', '民事'
    ],
    excludeKeywords: ['體育', '娛樂', '美食']
  },
  {
    name: 'Apple Daily (Archived)',
    source: 'APPLE_DAILY_RSS',
    url: 'https://hk.appledaily.com/rss/...',
    isActive: false,
    status: 'DEPRECATED',
    lastError: 'Publication ceased on 2021-06-24',
    keywords: [],
    excludeKeywords: []
  }
];
```

## Error Handling Strategy

### Error Types & Responses

1. **Network Errors**
   - Timeout after 30 seconds
   - Retry with exponential backoff (300s, 600s, 1200s)
   - Update `status = ERROR` after max retries
   - Log to `lastError` field

2. **Parse Errors**
   - Invalid XML/RSS format
   - Mark as ERROR immediately
   - Notify admin for manual review
   - Log full error message

3. **Content Errors**
   - Empty feed
   - All items filtered out by keywords
   - Mark as WARNING (custom status needed?)
   - Continue normally

### Retry Logic

```typescript
async function fetchWithRetry(source: RssSource) {
  let attempt = 0;
  let lastError: Error;
  
  while (attempt < source.maxRetries) {
    try {
      return await fetchRssFeed(source.url);
    } catch (error) {
      lastError = error;
      attempt++;
      
      if (attempt < source.maxRetries) {
        const delay = source.retryDelay * Math.pow(2, attempt - 1);
        await sleep(delay * 1000);
      }
    }
  }
  
  throw lastError;
}
```

## Keyword Filtering Rules

### Matching Logic

1. **Title Match** (High Priority)
   - Contains ANY keyword → Include
   - Contains ANY exclude keyword → Exclude

2. **Description Match** (Medium Priority)
   - Title doesn't match → Check description
   - Must contain at least 2 keywords → Include

3. **Language Detection**
   - Detect Chinese vs English content
   - Apply corresponding keyword set

### Keyword Categories

```typescript
const KEYWORDS = {
  legal_terms: [
    'court', 'law', 'legal', 'judge', 'lawyer',
    'attorney', 'lawsuit', 'prosecution', 'trial'
  ],
  chinese_legal: [
    '法庭', '法院', '法律', '法官', '律師',
    '大律師', '訴訟', '檢控', '審訊', '判決'
  ],
  case_types: [
    'criminal', 'civil', 'appeal', 'verdict',
    '刑事', '民事', '上訴', '裁決'
  ]
};
```

## Performance Considerations

### Optimization Strategies

1. **Parallel Fetching**
   - Fetch multiple sources simultaneously (limit: 5)
   - Use Promise.allSettled to continue on individual failures

2. **Caching**
   - Cache RSS feed for 15 minutes
   - Skip re-processing if no new items

3. **Rate Limiting**
   - Respect source server limits
   - Add delay between requests (1 second)

4. **Database Optimization**
   - Batch insert/update operations
   - Use indexes on frequently queried fields

## Maintenance Procedures

### Daily Tasks
- Automated crawler runs at 2am HKT via GitHub Actions
- Check crawler logs for errors
- Verify new cases added to database

### Weekly Tasks
- Review RSS source health status
- Update keywords if needed
- Check for new legal news sources

### Monthly Tasks
- Analyze keyword effectiveness
- Update deprecated sources list
- Review storage usage and cleanup old articles

### Quarterly Tasks
- Evaluate new RSS sources
- Review and optimize crawler performance
- Update documentation

## Future Enhancements

1. **Smart Filtering**
   - ML-based relevance scoring
   - Auto-learn keywords from admin feedback

2. **Content Enhancement**
   - Extract key entities (names, dates, case numbers)
   - Auto-categorize by case type
   - Sentiment analysis for legal outcomes

3. **Integration**
   - Link RSS articles to existing cases
   - Cross-reference with HK Judiciary data
   - Aggregate related articles

4. **Alerting**
   - Notify users of specific keyword matches
   - High-profile case updates
   - Custom RSS feeds for users

## References

- RSS 2.0 Specification: https://www.rssboard.org/rss-specification
- Atom Feed Format: https://www.rfc-editor.org/rfc/rfc4287
- RSS Parser Library: https://github.com/rbyers/rss-parser
- Best Practices: https://www.rssboard.org/rss-best-practices
