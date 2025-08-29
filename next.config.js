// Load environment variables from .env files (supports .env.local, .env.production, etc.)
require('dotenv').config({ path: ['.env.local', '.env'] });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Completely disable SWC for ARM architecture compatibility (Raspberry Pi)
  swcMinify: false,
  compiler: {
    // Disable SWC compiler entirely
    removeConsole: false,
  },
  // Force use of Babel instead of SWC
  experimental: {
    forceSwcTransforms: false,
  },
  // Next.js automatically loads .env files, but we can specify additional env vars here if needed
  env: {
    // Custom environment variables can be added here
  }
};

module.exports = nextConfig;
