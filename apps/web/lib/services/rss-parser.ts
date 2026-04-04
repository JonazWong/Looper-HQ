import Parser from 'rss-parser';

export interface RssFeedItem {
  title: string;
  link: string;
  pubDate: string;
  content?: string;
  contentSnippet?: string;
  creator?: string;
  guid?: string;
}

/**
 * Get time-aware delay based on Hong Kong business hours
 * Deep night (00:00-06:00): 1s
 * Off-peak (06:00-09:00, 18:00-00:00): 2s  
 * Peak hours (09:00-18:00): 3s
 */
function getTimeAwareDelay(): number {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 0 && hour < 6) {
    return 1000; // Deep night: 1s
  } else if ((hour >= 6 && hour < 9) || (hour >= 18 && hour < 24)) {
    return 2000; // Off-peak: 2s
  } else {
    return 3000; // Peak hours: 3s
  }
}

export class RssParserService {
  private parser: Parser;
  private timeout = 30000; // 30 seconds

  constructor() {
    this.parser = new Parser({
      timeout: this.timeout,
      requestOptions: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Fetch and parse RSS feed
   */
  async fetchFeed(url: string): Promise<RssFeedItem[]> {
    try {
      const feed = await this.parser.parseURL(url);
      return feed.items.map((item) => ({
        title: item.title || '',
        link: item.link || '',
        pubDate: item.pubDate || new Date().toISOString(),
        content: item.content || item.contentSnippet,
        contentSnippet: item.contentSnippet,
        creator: item.creator,
        guid: item.guid || item.link,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch RSS feed: ${error.message}`);
    }
  }

  /**
   * Fetch RSS feed with retry logic
   */
  async fetchWithRetry(
    url: string,
    maxRetries: number = 3,
    retryDelay: number = 300
  ): Promise<RssFeedItem[]> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.fetchFeed(url);
      } catch (error: any) {
        lastError = error;
        console.error(`Attempt ${attempt + 1}/${maxRetries} failed:`, error.message);

        if (attempt < maxRetries - 1) {
          // Exponential backoff: retryDelay is in seconds, convert to ms
          const delay = retryDelay * Math.pow(2, attempt) * 1000;
          console.log(`Retrying in ${delay / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Failed to fetch RSS feed after retries');
  }
}
