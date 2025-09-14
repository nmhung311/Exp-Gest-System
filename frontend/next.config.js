/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Cấu hình cho Cloudflare Pages
  distDir: 'out',
  // Tối ưu cho static export
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = nextConfig

