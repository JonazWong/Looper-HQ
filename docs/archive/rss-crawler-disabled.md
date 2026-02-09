# RSS Crawler - Disabled

**Status**: ❌ Disabled  
**Date**: 2026-02-09  
**Reason**: RSS sources failing (Cloudflare blocks, XML errors, 404s)

## Background

The automated RSS crawler was creating ~130+ failed issues due to:
1. **Ming Pao** - 403 Forbidden (Cloudflare block)
2. **RTHK** - XML parsing errors
3. **HK01** - 404 Not Found (URL changed)

## Actions Taken

1. ✅ Disabled RSS Crawler GitHub Action
2. ✅ Closed 132 automated failure issues
3. ✅ Created this documentation

## Future Options

If you want to re-enable RSS crawling:

### 1. Use reliable sources

- SCMP (confirmed working)
- Government news feeds
- Use RSS aggregator services

### 2. Update workflow

- Uncomment `on:` triggers in `.github/workflows/rss-crawler.yml`
- Configure new RSS sources in `packages/database/prisma/seed.ts`

### 3. Better error handling

- Don't create issues on failure
- Log to file instead
- Alert only after multiple failures

## Related Files

- `.github/workflows/rss-crawler.yml` - Workflow file (disabled)
- `scripts/close-automated-issues.js` - Bulk close script (Node.js)
- `scripts/close-automated-issues.sh` - Bulk close script (Bash)
- `docs/archive/rss-fixes.md` - Previous fix attempts

## Re-enabling the Crawler

To re-enable the RSS crawler in the future:

1. **Fix the RSS sources** by updating URLs in the seed file
2. **Uncomment the triggers** in `.github/workflows/rss-crawler.yml`:
   ```yaml
   on:
     schedule:
       - cron: '*/15 * * * *'
     workflow_dispatch:
   ```
3. **Test locally** first with `pnpm crawler:rss`
4. **Monitor** the first few runs for any issues

## Alternative Solutions

Consider these alternatives if RSS continues to be problematic:

- **Manual curation**: Allow team members to add legal news manually
- **API integration**: Partner with news providers for official APIs
- **Web scraping**: Use Puppeteer/Playwright for JavaScript-heavy sites
- **Paid services**: Use professional news aggregation services

---

**Last Updated**: 2026-02-09  
**Disabled By**: GitHub Copilot Agent  
**Related PR**: See pull request for implementation details
