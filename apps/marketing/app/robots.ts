import type { MetadataRoute } from 'next';
import { NOINDEX } from '../content/site';

export default function robots(): MetadataRoute.Robots {
  if (NOINDEX) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: 'https://www.noteforwork.com/sitemap.xml',
    host: 'https://www.noteforwork.com',
  };
}
