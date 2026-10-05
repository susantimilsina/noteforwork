/** Single source for content shown in several places (page, JSON-LD, app). */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';
export const PRICE_USD = 29;

/** Patient intake entry point, in the visitor's language. */
export const startUrl = (lang: 'en' | 'es') => `${APP_URL}${lang === 'es' ? '/es/start' : '/start'}`;

