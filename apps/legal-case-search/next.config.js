/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@looper-hq/database'],
  serverExternalPackages: ['@prisma/client', 'prisma'],
}

module.exports = nextConfig
