# RSS Feed Implementation and Troubleshooting History

This document consolidates the RSS feed implementation and troubleshooting efforts for the Looper HQ project.

---

## Table of Contents
1. [Problem Diagnosis](#problem-diagnosis)
2. [Solutions Implemented](#solutions-implemented)
3. [Testing and Validation](#testing-and-validation)
4. [Current Status](#current-status)

---

## Problem Diagnosis

**Diagnosis Date**: 2026-02-06  
**Issue**: RSS crawler failing in both GitHub Actions and local environment  
**Error**: `Status code 403` (Forbidden)

### Symptoms

```
RSS fetch failed for MINGPAO_INS_RSS: Failed to fetch RSS feed: Status code 403
Retry 1/3 after 300s delay...
```

### Root Causes Identified

#### 1. Ming Pao Anti-Scraping Protection

Ming Pao strengthened anti-scraping measures:
- ❌ Simple User-Agent headers insufficient
- ❌ May require Referer or Cookies
- ❌ RSS URLs may have changed or require authentication
- ❌ Cloudflare blocking requests (403 Forbidden)

#### 2. RSS URLs No Longer Active

Similar to HK-Legal-Case-Agency project issues:
- Hong Kong news sites adjusted RSS strategies after 2025
- Some RSS feeds discontinued or changed URLs
- URLs returning 404 Not Found

#### 3. Request Frequency Too High

Original configuration:
- Fetching every 15 minutes (900 seconds)
- GitHub Actions: Every 15 minutes (`*/15 * * * *`)
- **Triggered anti-scraping limits**

#### 4. XML Parsing Errors

RTHK sources had XML encoding issues:
- Entity name errors in XML
- Character encoding problems
- Invalid XML structure

---

## Solutions Implemented

### 1. Updated RSS Source Configuration ✅

**Disabled Failed Sources**:
- ❌ Ming Pao Instant (403 Forbidden)
- ❌ Ming Pao Daily (403 Forbidden)
- ❌ RTHK Local (XML parsing errors)
- ❌ HK01 (404 Not Found)
- ❌ Now News (404 Not Found)

**Enabled Working Sources**:
- ✅ **SCMP** (South China Morning Post) - 50 items available

**Configuration Files**:
- `packages/database/prisma/seed.ts` - Updated to 4 sources
- `packages/database/prisma/schema.prisma` - Added RSS source enums

### 2. Improved Error Handling ✅

**Progressive Retry Delays**:
```typescript
// Old: Fixed 300 seconds (5 minutes)
retryDelay: 300

// New: Progressive 30s → 60s → 120s
const delay = Math.min(30 * Math.pow(2, retryCount - 1), 300);
```

**Automatic Error Status Marking**:
```typescript
// After max retries, update status to ERROR
await prisma.rssSource.update({
  where: { id: source.id },
  data: {
    status: 'ERROR',
    lastError: lastError.slice(0, 500),
  },
});
```

### 3. Reduced Request Frequency ✅

**GitHub Actions Schedule**:
```yaml
# Old: Every 15 minutes
- cron: '*/15 * * * *'

# New: Every hour
- cron: '0 * * * *'
```

**Source Fetch Interval**:
```typescript
// SCMP: 3600 seconds (1 hour)
// Reason: English source, less frequent legal news, reduces blocking risk
```

### 4. Simplified RSS Parser Configuration ✅

Removed potentially problematic headers:
```typescript
// Removed: Cache-Control, Pragma, Referer (Ming Pao specific)
// Removed: Accept-Encoding: br (may not be supported)
// Kept: User-Agent, Accept, Accept-Language
```

**Final Header Configuration**:
```typescript
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  'Accept-Language': 'zh-HK,zh-TW;q=0.9,zh;q=0.8,en;q=0.7',
}
```

### 5. Created Utility Scripts ✅

**Testing Script** (`scripts/test-rss-sources.ts`):
```bash
pnpm test:rss
# Tests availability of all RSS sources
```

**Health Check Script** (`scripts/crawlers/health-check.ts`):
```bash
pnpm crawler:health
# Checks health status of all crawlers
```

---

## Testing and Validation

### Test Results

**Working Sources**: 1/4 (25% success rate)
- ✅ SCMP: 50 items fetched successfully
- ❌ Ming Pao Instant: 403 Forbidden
- ❌ Ming Pao Daily: 403 Forbidden
- ❌ RTHK Local: XML parsing error

### Performance Improvements

**Before**:
- Retry delay: 300 seconds (5 minutes)
- Fetch frequency: 15 minutes
- Error handling: Basic
- Success rate: 0%

**After**:
- Retry delay: Progressive (30s → 60s → 120s)
- Fetch frequency: 1 hour
- Error handling: Advanced with status tracking
- Success rate: 25% (SCMP working)

---

## Current Status

**Completion Date**: 2026-02-06  
**Status**: ✅ Partially Fixed  
**Success Rate**: 1/4 sources working (25%)

### What's Working

1. ✅ SCMP RSS feed successfully fetching
2. ✅ Improved error handling and retry logic
3. ✅ Reduced server load with lower frequency
4. ✅ Better logging and debugging tools
5. ✅ Automated error status tracking

### Remaining Issues

1. ❌ Ming Pao sources still blocked by Cloudflare
2. ❌ RTHK XML parsing issues unresolved
3. ❌ Limited diversity of news sources (only 1 working)

---

## Future Improvements

### Short Term

1. **Test Alternative Sources**:
   - Hong Kong Free Press
   - The Standard
   - Hong Kong Economic Times

2. **Implement Proxy Rotation**:
   - Use proxy services to avoid IP blocking
   - Rotate User-Agent strings

3. **Add RSS Feed Validation**:
   - Pre-validate XML before parsing
   - Better error messages for debugging

### Long Term

1. **Web Scraping Alternative**:
   - Implement direct web scraping for blocked sources
   - Use Puppeteer/Playwright for JavaScript-heavy sites

2. **API Integration**:
   - Partner with news providers for official APIs
   - Use paid news aggregation services

3. **Manual Curation**:
   - Allow manual addition of legal cases
   - Community-contributed news sources

---

## Configuration Reference

### Current RSS Sources

```typescript
{
  name: 'SCMP Hong Kong News',
  source: 'SCMP_RSS',
  url: 'https://www.scmp.com/rss/91/feed',
  isActive: true,
  fetchInterval: 3600, // 1 hour
  status: 'ACTIVE',
}
```

### Recommended Headers

```typescript
{
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  'Accept-Language': 'zh-HK,zh-TW;q=0.9,zh;q=0.8,en;q=0.7',
}
```

### GitHub Actions Schedule

```yaml
name: RSS Crawler
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:      # Manual trigger
```

---

## Troubleshooting Guide

### Common Errors

#### 403 Forbidden
**Cause**: Anti-scraping protection  
**Solution**: 
- Add Referer header
- Use proxy service
- Reduce request frequency
- Consider alternative sources

#### XML Parsing Error
**Cause**: Invalid XML or encoding issues  
**Solution**:
- Validate XML structure
- Handle encoding properly
- Strip invalid characters
- Use alternative parser

#### 404 Not Found
**Cause**: URL changed or deprecated  
**Solution**:
- Find new RSS URL
- Check news site for updates
- Remove from active sources

### Testing Commands

```bash
# Test all RSS sources
pnpm test:rss

# Check crawler health
pnpm crawler:health

# Run crawler manually
pnpm crawler:rss

# View database
pnpm db:studio
```

---

## Related Documents

- [RSS Implementation Status](../RSS_IMPLEMENTATION_STATUS.md)
- [RSS Config Optimizations](../RSS_CONFIG_OPTIMIZATIONS.md)
- [RSS Crawler GitHub Actions](../RSS_CRAWLER_GITHUB_ACTIONS.md)

---

**Last Updated**: 2026-02-06  
**Status**: Archived - Historical reference only  
**Current Documentation**: See main docs for latest RSS implementation
