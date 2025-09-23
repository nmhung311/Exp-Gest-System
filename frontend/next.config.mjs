export default /** @type {import('next').NextConfig} */ ({
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  images: {
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
  async rewrites() {
    return [
      {
        source: '/dashboard/:path*',
        destination: '/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:5008/api/:path*',
      },
    ]
  },
});
