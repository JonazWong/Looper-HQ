/**
 * Environment configuration
 */

export const env = {
  // Node environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/looper_hq',
  
  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6380',
  
  // Keycloak
  KEYCLOAK_URL: process.env.KEYCLOAK_FRONTEND_URL || 'http://localhost:8080',
  KEYCLOAK_REALM: process.env.KEYCLOAK_REALM || 'looper-hq',
  KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID || 'looper-hq-web',
  KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET || '',
  
  // NextAuth
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3005',
  
  // Application
  TZ: process.env.TZ || 'Asia/Hong_Kong',
  
  // API Services
  API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://localhost:4000',
  CASE_SERVICE_URL: process.env.CASE_SERVICE_URL || 'http://localhost:4001',
  DOCUMENT_SERVICE_URL: process.env.DOCUMENT_SERVICE_URL || 'http://localhost:4002',
  SEARCH_SERVICE_URL: process.env.SEARCH_SERVICE_URL || 'http://localhost:4003',
  BILLING_SERVICE_URL: process.env.BILLING_SERVICE_URL || 'http://localhost:4004',
  
  // Storage
  STORAGE_TYPE: process.env.STORAGE_TYPE || 'local', // 'local' or 's3'
  STORAGE_PATH: process.env.STORAGE_PATH || './uploads',
  
  // S3 (if used)
  S3_BUCKET: process.env.S3_BUCKET || '',
  S3_REGION: process.env.S3_REGION || '',
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY || '',
  S3_SECRET_KEY: process.env.S3_SECRET_KEY || '',
};

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
