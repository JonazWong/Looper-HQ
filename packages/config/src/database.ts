/**
 * Database configuration
 */

export const databaseConfig = {
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/looper_hq',
  
  // Connection pool settings
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  
  // Query settings
  query: {
    timeout: 30000, // 30 seconds
  },
};
