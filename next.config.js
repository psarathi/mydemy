/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable SWC for ARM architecture compatibility (Raspberry Pi)
  swcMinify: false,
  experimental: {
    forceSwcTransforms: false,
  }
};

module.exports = nextConfig;
