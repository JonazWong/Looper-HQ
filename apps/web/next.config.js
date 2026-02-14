const createNextIntlPlugin = require('next-intl/plugin');

// Point to the i18n configuration file
const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turborepo optimization - transpile workspace packages
  transpilePackages: ['@looper-hq/utils', '@looper-hq/database'],
  
  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Environment variables handling
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  
  // Strict mode for better development
  reactStrictMode: true,
  
  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Production standalone output for Docker
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Workspace root configuration
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
}

module.exports = withNextIntl(nextConfig)
