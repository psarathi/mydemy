/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable SWC minification (faster than Terser)
  swcMinify: true,

  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Production optimizations
  productionBrowserSourceMaps: false, // Disable source maps in production for faster builds

  // Compression
  compress: true,

  // Power optimizations
  poweredByHeader: false, // Remove X-Powered-By header

  // Optimize CSS
  optimizeFonts: true,

  // Enable experimental features for better performance
  experimental: {
    // Use optimized package imports
    optimizePackageImports: ['react', 'react-dom'],
  },
};

module.exports = nextConfig;
