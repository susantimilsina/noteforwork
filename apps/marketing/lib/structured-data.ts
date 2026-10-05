/**
 * schema.org JSON-LD. Generated from the same content objects the page renders, so the markup
 * always matches what users see (Google requires FAQ markup to match visible content).
 * Deliberately NOT included: Review/AggregateRating for our own testimonials — self-serving
 * reviews are ineligible for rich results and risk a manual action.
 */
import { HOME, PHYSICIANS } from '../content/home';
import type { Lang } from '../content/i18n';
import { PRICE_USD } from '../content/site';
import type { Page } from './content';
import { routes } from './routes';

export const SITE = 'https://www.noteforwork.com';
const ORG_ID = `${SITE}/#organization`;
const SITE_ID = `${SITE}/#website`;
const inLanguage = (lang: Lang) => (lang === 'es' ? 'es-US' : 'en-US');
const physicianId = (id: string) => `${SITE}/#physician-${id}`;

function organization(lang: Lang) {
  const c = HOME[lang];
  return {
    '@type': ['MedicalBusiness', 'Organization'],
    '@id': ORG_ID,
    name: 'NoteForWork',
    legalName: 'Noteforwork PC',
    url: SITE,
    logo: `${SITE}/og-image.png`,
    image: `${SITE}/og-image.png`,
    description: c.meta.description,
    email: 'help@noteforwork.com',
    areaServed: { '@type': 'Country', name: 'United States' },
    availableLanguage: ['English', 'Spanish'],
    priceRange: `$${PRICE_USD}`,
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    founder: { '@id': physicianId('sidhu') },
    makesOffer: {
      '@type': 'Offer',
      name: lang === 'es' ? 'Nota médica para el trabajo o la escuela' : "Doctor's note for work or school",
      price: String(PRICE_USD),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: SITE,
    },
  };
}

function physicians(lang: Lang) {
  const c = HOME[lang].doctors.people;
  return PHYSICIANS.map((p) => ({
    '@type': 'Physician',
    '@id': physicianId(p.id),
    name: `Dr. ${p.name}`,
    honorificSuffix: p.degree,
    image: `${SITE}${p.photo}`,
    description: c[p.id]?.bio,
    medicalSpecialty: `https://schema.org/${p.specialty}`,
    knowsLanguage: p.languages,
    identifier: { '@type': 'PropertyValue', propertyID: 'NPI', value: p.npi },
    memberOf: { '@id': ORG_ID },
  }));
}

export function homeJsonLd(lang: Lang) {
  const c = HOME[lang];
  const url = `${SITE}${routes(lang).home === '/' ? '/' : routes(lang).home}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization(lang),
      ...physicians(lang),
      { '@type': 'WebSite', '@id': SITE_ID, url: SITE, name: 'NoteForWork', publisher: { '@id': ORG_ID }, inLanguage: ['en-US', 'es-US'] },
      { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: c.meta.title, description: c.meta.description, isPartOf: { '@id': SITE_ID }, about: { '@id': ORG_ID }, inLanguage: inLanguage(lang) },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        inLanguage: inLanguage(lang),
        mainEntity: c.faq.items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
    ],
  };
}

/** Articles: MedicalWebPage (with medical reviewer when the byline names one) + breadcrumbs. */
export function articleJsonLd(page: Page) {
  const url = `${SITE}${page.legacyPath}`;
  const r = routes(page.lang);
  const reviewedBySidhu = /Sidhu/.test(page.meta ?? '');
  const updated = page.meta?.match(/(January|February|March|April|May|June|July|August|September|October|November|December|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(?:de\s+)?(\d{4})/i);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalWebPage',
        '@id': `${url}#webpage`,
        url,
        headline: page.h1,
        name: page.title,
        description: page.description,
        inLanguage: inLanguage(page.lang),
        isPartOf: { '@id': SITE_ID },
        publisher: { '@id': ORG_ID },
        ...(reviewedBySidhu && { reviewedBy: { '@type': 'Physician', '@id': physicianId('sidhu'), name: 'Dr. Manavjeet Sidhu' } }),
        ...(updated && { lastReviewed: updated[2] }),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'NoteForWork', item: `${SITE}${r.home}` },
          { '@type': 'ListItem', position: 2, name: page.lang === 'es' ? 'Recursos' : 'Resources', item: `${SITE}${r.resources}` },
          { '@type': 'ListItem', position: 3, name: page.h1, item: url },
        ],
      },
    ],
  };
}
