import type { MetadataRoute } from 'next';
import { languagePairs } from '../lib/content';

/** Every public URL in both languages, with hreflang alternates. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.noteforwork.com';
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();
  for (const [en, es] of languagePairs()) {
    const languages = { 'en-US': `${base}${en}`, 'es-US': `${base}${es}`, 'x-default': `${base}${en}` };
    for (const url of [en, es]) {
      if (seen.has(url)) continue;
      seen.add(url);
      entries.push({ url: `${base}${url}`, alternates: { languages }, priority: url === '/' ? 1 : undefined });
    }
  }
  return entries;
}
