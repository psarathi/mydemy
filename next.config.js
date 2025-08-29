// Load environment variables from .env files (supports .env.local, .env.production, etc.)
require('dotenv').config({ path: ['.env.local', '.env'] });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable SWC for ARM architecture compatibility (Raspberry Pi)
  swcMinify: false,
  // Next.js automatically loads .env files, but we can specify additional env vars here if needed
  env: {
    // Custom environment variables can be added here
  },
  // Enable experimental features if needed
  experimental: {
    // Add any experimental features here
  }
};

module.exports = nextConfig;
