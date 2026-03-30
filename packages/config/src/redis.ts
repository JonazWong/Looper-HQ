/**
 * Redis configuration
 */

export const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6380',
  password: process.env.REDIS_PASSWORD,
  
  // Connection settings
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  
  // Cache TTL (in seconds)
  ttl: {
    short: 5 * 60,        // 5 minutes
    medium: 30 * 60,      // 30 minutes
    long: 2 * 60 * 60,    // 2 hours
    day: 24 * 60 * 60,    // 1 day
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
};
