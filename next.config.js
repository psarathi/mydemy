/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Completely disable SWC for ARM/Raspberry Pi
  swcMinify: false,
  // Use Terser for minification instead of SWC
  compiler: {},
  experimental: {
    forceSwcTransforms: false,
  },
  // Ensure webpack is used for compilation
  webpack: (config, { dev, isServer }) => {
    // Force use of Babel loader for JS/TS files
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['next/babel']
        }
      }
    });
    return config;
  }
};

module.exports = nextConfig;
