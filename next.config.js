/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable static export for Tauri
  output: 'export',

  // Compiler optimizations (Next.js 15 uses SWC by default)
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Image optimization - disable for static export
  images: {
    unoptimized: true,
  },

  // Production optimizations
  productionBrowserSourceMaps: false,

  // Security
  poweredByHeader: false,

  // Enable compression
  compress: true,

  // Optimize fonts
  optimizeFonts: true,

  // Trailing slash for static export
  trailingSlash: true,
};

module.exports = nextConfig;
