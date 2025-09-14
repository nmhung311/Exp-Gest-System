/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/Exp-Gest-System' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/Exp-Gest-System' : '',
}

module.exports = nextConfig
