/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turborepo optimization
  transpilePackages: [],
  
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
  
  // i18n preparation
  // i18n: {
  //   locales: ['en', 'zh-HK'],
  //   defaultLocale: 'en',
  // },
  
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
}

module.exports = nextConfig
