export default /** @type {import('next').NextConfig} */ ({
  reactStrictMode: true,
  // Enable standalone output for Docker
  output: 'standalone',
  // Disable static export for GitHub Pages deployment
  // output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  trailingSlash: false,
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  // Disable HTTPS redirect
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9009',
        pathname: '/api/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.135',
        port: '5012',
        pathname: '/api/**',
      },
    ],
  },
  // Removed redirects() to prevent any redirect conflicts
  // async redirects() {
  //   return []
  // },
  // 🚫 CHẶN REDIRECT - Tắt tất cả rewrites để tránh redirect behavior
  // async rewrites() {
  //   return []
  // },
});
