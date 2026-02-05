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

export class RssParserService {
  private parser: Parser;
  private timeout = 30000; // 30 seconds

  constructor() {
    this.parser = new Parser({
      timeout: this.timeout,
      headers: {
        'User-Agent': 'Looper-HQ/1.0',
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
          const delay = retryDelay * Math.pow(2, attempt) * 1000;
          console.log(`Retrying in ${delay / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Failed to fetch RSS feed after retries');
  }
}
