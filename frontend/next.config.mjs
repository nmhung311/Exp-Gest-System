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
        port: '5008',
        pathname: '/api/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: 'https://expsolution.io/',
        permanent: false,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/dashboard/:path*',
        destination: '/:path*',
      },
      // Remove the API rewrite rule as it interferes with Next.js API routes
      // {
      //   source: '/api/:path*',
      //   destination: 'http://localhost:5008/api/:path*',
      // },
    ]
  },
});
