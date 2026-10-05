import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { APP_URL } from '../content/site';
import type { Lang } from '../content/i18n';

/** Imported legacy page (scripts/import-legacy.ts) or its Spanish translation (content/pages-es). */
export interface Page {
  slug: string;
  legacyPath: string;
  kind: 'article' | 'legal' | 'careers';
  lang: Lang;
  translatedFrom?: string;
  title: string;
  description: string;
  h1: string;
  label: string | null;
  meta: string | null;
  subtitle: string | null;
  html: string;
}

export interface ArticleCard {
  slug: string;
  href: string;
  category: string;
  date: string;
  title: string;
  description: string;
}

const DIR = path.join(process.cwd(), 'content');

function readDir(dir: string): Page[] {
  const full = path.join(DIR, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(path.join(full, f), 'utf8')) as Page);
}

let cache: Page[] | null = null;
/** All pages in both languages. Spanish = translations (pages-es) + pages written in Spanish originally. */
export function allPages(): Page[] {
  cache ??= [...readDir('pages'), ...readDir('pages-es')];
  return cache;
}

export const pagesOf = (kind: Page['kind'], lang: Lang) => allPages().filter((p) => p.kind === kind && p.lang === lang);

export const getPage = (kind: Page['kind'], slug: string, lang: Lang) =>
  allPages().find((p) => p.kind === kind && p.slug === slug && p.lang === lang);

/** Resources index, newest first. */
export function articleCards(lang: Lang): ArticleCard[] {
  const file = path.join(DIR, lang === 'es' ? 'articles.es.json' : 'articles.json');
  if (!existsSync(file)) return [];
  const cards = JSON.parse(readFileSync(file, 'utf8')) as ArticleCard[];
  return cards.sort((a, b) => b.date.localeCompare(a.date));
}

/** Imported HTML uses a {{APP_URL}} placeholder so links follow the environment. */
export const renderHtml = (html: string) => html.replaceAll('{{APP_URL}}', APP_URL);

/**
 * Pairs of equivalent URLs (English ↔ Spanish) for the language switcher and hreflang.
 * English keeps the legacy *.html URLs; Spanish lives under /es.
 */
export function languagePairs(): [en: string, es: string][] {
  const pairs: [string, string][] = [
    ['/', '/es'],
    ['/resources.html', '/es/resources'],
    ['/careers.html', '/es/careers'],
  ];
  for (const p of pagesOf('legal', 'en')) pairs.push([p.legacyPath, `/es/legal/${p.slug}`]);
  for (const p of pagesOf('article', 'en')) pairs.push([p.legacyPath, `/es/${p.slug}`]);
  // Spanish-original article has no English twin → English home.
  for (const p of pagesOf('article', 'es').filter((p) => !p.translatedFrom)) pairs.push(['/', p.legacyPath]);
  return pairs;
}
