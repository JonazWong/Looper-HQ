/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turborepo optimization - transpile workspace packages
  transpilePackages: ['@looper-hq/database'],

  // External packages for server components
  serverExternalPackages: ['@prisma/client', 'prisma'],

  reactStrictMode: true,

  // Production standalone output for Docker
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Workspace root configuration
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  transpilePackages: ['@looper-hq/database'],
  serverExternalPackages: ['@prisma/client', 'prisma'],
}

module.exports = nextConfig
