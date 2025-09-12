export default /** @type {import('next').NextConfig} */ ({
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5001',
        pathname: '/api/**',
      },
    ],
  },
});
