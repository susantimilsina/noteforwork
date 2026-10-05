import type { Metadata } from 'next';
import { HOME } from '../content/home';
import type { Lang } from '../content/i18n';
import { languagePairs, type Page } from './content';

const OG_IMAGE = { url: '/og-image.png', width: 1200, height: 1200, alt: 'NoteForWork — physician-signed doctor’s notes in 60 minutes' };
const locale = (lang: Lang) => (lang === 'es' ? 'es_US' : 'en_US');

/** canonical + hreflang alternates for a page, using the English↔Spanish URL pairs. */
export function alternates(lang: Lang, path: string): Metadata['alternates'] {
  const pair = languagePairs().find(([en, es]) => (lang === 'en' ? en : es) === path);
  return {
    canonical: path,
    languages: pair ? { 'en-US': pair[0], 'es-US': pair[1], 'x-default': pair[0] } : undefined,
  };
}

function social(lang: Lang, title: string, description: string, path: string, type: 'website' | 'article' = 'website'): Metadata {
  return {
    openGraph: {
      type,
      siteName: 'NoteForWork',
      title,
      description,
      url: path,
      locale: locale(lang),
      alternateLocale: [locale(lang === 'en' ? 'es' : 'en')],
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE.url] },
  };
}

export const pageMetadata = (page: Page): Metadata => ({
  title: page.title,
  description: page.description || undefined,
  alternates: alternates(page.lang, page.legacyPath),
  ...social(page.lang, page.title, page.description, page.legacyPath, page.kind === 'article' ? 'article' : 'website'),
});

export function homeMetadata(lang: Lang): Metadata {
  const { title, description } = HOME[lang].meta;
  const path = lang === 'es' ? '/es' : '/';
  return { title, description, alternates: alternates(lang, path), ...social(lang, title, description, path) };
}

export const rootMetadata = (lang: Lang): Metadata => ({
  metadataBase: new URL('https://www.noteforwork.com'),
  title: HOME[lang].meta.title,
  description: HOME[lang].meta.description,
  applicationName: 'NoteForWork',
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  formatDetection: { telephone: false },
  ...social(lang, HOME[lang].meta.title, HOME[lang].meta.description, lang === 'es' ? '/es' : '/'),
});
