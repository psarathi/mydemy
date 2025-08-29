/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  // Reduce memory usage and worker processes for ARM/Raspberry Pi
  experimental: {
    workerThreads: false,
  },
  webpack: (config, { dev, isServer }) => {
    // Limit parallel processing for ARM devices
    config.parallelism = 1;
    return config;
  }
};

module.exports = nextConfig;
