/** @type {import('next').NextConfig} */
const nextConfig = {
  // Chỉ sử dụng static export cho production build
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
    distDir: 'out',
    generateBuildId: async () => {
      return 'build-' + Date.now()
    },
  }),
  images: {
    unoptimized: true
  },
  // Environment variables configuration
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL,
  },
  // Public runtime config for client-side
  publicRuntimeConfig: {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001',
    frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig

