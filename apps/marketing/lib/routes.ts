import type { Lang } from '../content/i18n';

/** Canonical public URLs per language. English keeps the legacy *.html paths. */
export function routes(lang: Lang) {
  const es = lang === 'es';
  return {
    home: es ? '/es' : '/',
    faq: es ? '/es#faq' : '/#faq',
    resources: es ? '/es/resources' : '/resources.html',
    hr: es ? '/es/employer-guide-telehealth-work-notes' : '/employer-guide-telehealth-work-notes.html',
    careers: es ? '/es/careers' : '/careers.html',
    legal: (slug: string) => (es ? `/es/legal/${slug}` : `/${slug}.html`),
  };
}
