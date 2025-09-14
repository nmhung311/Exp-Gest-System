/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Không cần basePath cho Cloudflare Pages
  // assetPrefix: process.env.NODE_ENV === 'production' ? '/Exp-Gest-System' : '',
  // basePath: process.env.NODE_ENV === 'production' ? '/Exp-Gest-System' : '',
}

module.exports = nextConfig

