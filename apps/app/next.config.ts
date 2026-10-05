import type { NextConfig } from 'next';

const API_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  transpilePackages: ['@nfw/ui'],
  poweredByHeader: false,
  // Two root layouts (English, Spanish) → unmatched URLs need app/global-not-found.tsx.
  experimental: { globalNotFound: true },
  // Same-origin proxy: the browser only ever talks to app.noteforwork.com, so the httpOnly
  // intake cookie is first-party and no CORS is needed in production.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

export default nextConfig;
