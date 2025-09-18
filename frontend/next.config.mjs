export default /** @type {import('next').NextConfig} */ ({
  reactStrictMode: true,
  output: 'standalone',
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
        hostname: '27.72.246.67',
        port: '9009',
        pathname: '/api/**',
      },
    ],
  },
});
