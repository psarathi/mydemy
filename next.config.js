/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable static export for Tauri builds only (not in dev mode)
  ...(process.env.TAURI_BUILD === 'true' && { output: 'export' }),

  // Proxy media through the app's own origin so the browser never has to
  // resolve the CDN hostname itself. This fixes video playback on devices that
  // can't resolve `mydemy.learn` (e.g. a phone that reaches the app by LAN IP):
  // the /cdn request inherits the app's host and Next forwards it to the real
  // CDN server-side. Skipped for the Tauri static export, which has no server
  // and talks to the absolute CDN URL directly.
  ...(process.env.TAURI_BUILD === 'true'
    ? {}
    : {
        async rewrites() {
          // Server-side proxy target — this fetch runs on the deploy host, so
          // it must be a name the *server* can resolve. Default to the CDN's
          // LAN IP (co-located with the app) rather than the client-facing
          // NEXT_PUBLIC_BASE_CDN_PATH, which may be a hostname like
          // `mydemy.learn` that only exists in client machines' /etc/hosts and
          // fails to resolve on the server (→ 500). Override with
          // CDN_PROXY_TARGET if the CDN ever moves off the app host.
          const cdn =
            process.env.CDN_PROXY_TARGET || 'http://192.168.1.141:5555';
          return {
            beforeFiles: [
              { source: '/cdn/:path*', destination: `${cdn}/:path*` },
            ],
          };
        },
      }),

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

  // Trailing slash for static export
  trailingSlash: true,
};

module.exports = nextConfig;
