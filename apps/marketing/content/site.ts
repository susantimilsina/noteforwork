/** Single source for content shown in several places (page, JSON-LD, app). */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';
export const PRICE_USD = 29;

/**
 * Patient intake entry point, in the visitor's language.
 * NEXT_PUBLIC_START_URL overrides it for deployments where the new patient app isn't live yet
 * (e.g. a marketing-only preview pointing at the current intake).
 */
const START_OVERRIDE = process.env.NEXT_PUBLIC_START_URL;
export const startUrl = (lang: 'en' | 'es') => START_OVERRIDE ?? `${APP_URL}${lang === 'es' ? '/es/start' : '/start'}`;

/** Set SITE_NOINDEX=1 on any copy that isn't www.noteforwork.com (previews), so it isn't indexed as a duplicate. */
export const NOINDEX = process.env.SITE_NOINDEX === '1';

