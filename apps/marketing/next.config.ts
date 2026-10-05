import type { NextConfig } from 'next';
import { LEGACY_URLS } from './content/legacy-urls';

const nextConfig: NextConfig = {
  transpilePackages: ['@nfw/ui'],
  poweredByHeader: false,
  // Two root layouts (English, Spanish) → unmatched URLs need app/global-not-found.tsx.
  experimental: { globalNotFound: true },
  // Keep every indexed *.html URL serving content at the same address (rewrite, not redirect)
  // so search rankings carry over. Duplicates 301 to their canonical twin.
  async rewrites() {
    return LEGACY_URLS.filter((u) => u.kind === 'rewrite').map((u) => ({ source: u.from, destination: u.to }));
  },
  async redirects() {
    return LEGACY_URLS.filter((u) => u.kind === 'redirect').map((u) => ({ source: u.from, destination: u.to, permanent: true }));
  },
};

export default nextConfig;
