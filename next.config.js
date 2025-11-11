/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Compiler optimizations (Next.js 15 uses SWC by default)
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Production optimizations
  productionBrowserSourceMaps: false,

  // Security
  poweredByHeader: false,

  // Enable compression
  compress: true,

  // Optimize fonts
  optimizeFonts: true,
};

module.exports = nextConfig;
