/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
    dirs: [
      'src/app',
      'src/components',
      'src/lib',
      'src/utils',
      'src/hooks',
      'src/styles',
      'src/types',
      'src/config',
      'src/constants',
      'src/services',
      'src/store',
      'src/features',
      'src/layouts',
      'src/middleware',
      'src/pages',
      'src/providers',
      'src/theme',
    ],
  },
}

module.exports = nextConfig
