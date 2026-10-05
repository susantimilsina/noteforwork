/**
 * One-off content migration from the legacy static site (www.noteforwork.com on tiiny.host).
 *
 *   pnpm --filter @nfw/marketing import:legacy
 *
 * For each legacy page: keeps title / label / meta line / main body, drops the old nav, CTAs,
 * related-article blocks, forms and scripts, sanitizes the HTML and rewrites links to the new app.
 * Output: content/pages/<slug>.json, content/articles.json (Resources index), public/ assets.
 * Re-runnable; review the diff after each run.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';
import sanitizeHtml from 'sanitize-html';

const ORIGIN = 'https://www.noteforwork.com';
const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'content/pages');

type Kind = 'article' | 'legal' | 'careers';
const PAGES: { file: string; slug: string; kind: Kind; lang?: 'es' }[] = [
  { file: 'do-i-need-doctors-note-one-day-off-work.html', slug: 'do-i-need-doctors-note-one-day-off-work', kind: 'article' },
  { file: 'can-you-get-fired-for-calling-in-sick.html', slug: 'can-you-get-fired-for-calling-in-sick', kind: 'article' },
  { file: 'how-to-get-doctors-note-at-night-weekend.html', slug: 'how-to-get-doctors-note-at-night-weekend', kind: 'article' },
  { file: 'can-employer-call-doctor-about-work-note.html', slug: 'can-employer-call-doctor-about-work-note', kind: 'article' },
  { file: 'can-employer-deny-doctors-note.html', slug: 'can-employer-deny-doctors-note', kind: 'article' },
  // Canonical twins of the duplicated topics (the other copy 301s here).
  { file: 'is-telehealth-doctors-note-valid-for-work.html', slug: 'telehealth-doctors-note-valid-for-work', kind: 'article' },
  { file: 'why-staying-home-sick-is-good-for-public-health.html', slug: 'staying-home-sick-public-health', kind: 'article' },
  { file: 'what-makes-work-excuse-note-valid.html', slug: 'what-makes-work-excuse-note-valid', kind: 'article' },
  { file: 'employer-guide-telehealth-work-notes.html', slug: 'employer-guide-telehealth-work-notes', kind: 'article' },
  { file: 'nota-medica-para-el-trabajo.html', slug: 'nota-medica-para-el-trabajo', kind: 'article', lang: 'es' },
  { file: 'privacy.html', slug: 'privacy', kind: 'legal' },
  { file: 'terms.html', slug: 'terms', kind: 'legal' },
  { file: 'hipaa-notice.html', slug: 'hipaa-notice', kind: 'legal' },
  { file: 'patient-consent.html', slug: 'patient-consent', kind: 'legal' },
  { file: 'careers.html', slug: 'careers', kind: 'careers' },
];

const ASSETS = ['sidhu.jpg', 'olivero.jpg', 'yuan.jpg', 'employer-information-sheet.pdf'];

const SPANISH_TWIN: Record<string, string> = {
  'resources.html': '/es/resources',
  'privacy.html': '/es/legal/privacy',
  'terms.html': '/es/legal/terms',
  'hipaa-notice.html': '/es/legal/hipaa-notice',
  'patient-consent.html': '/es/legal/patient-consent',
  'careers.html': '/es/careers',
  'is-telehealth-doctors-note-valid-for-work.html': '/es/telehealth-doctors-note-valid-for-work',
  'telehealth-doctors-note-valid-for-work.html': '/es/telehealth-doctors-note-valid-for-work',
  'why-staying-home-sick-is-good-for-public-health.html': '/es/staying-home-sick-public-health',
  'staying-home-sick-public-health.html': '/es/staying-home-sick-public-health',
};

/** Legacy link → new link. *.html links keep working via next.config rewrites, so they stay. */
function rewriteHref(href: string, lang: 'en' | 'es' = 'en'): string {
  if (lang === 'es') {
    const file = href.replace(/^\//, '');
    if (SPANISH_TWIN[file]) return SPANISH_TWIN[file];
    const article = PAGES.find((p) => p.file === file && p.kind === 'article' && !p.lang);
    if (article) return `/es/${article.slug}`;
    if (href === '/' || href === 'index.html') return '/es';
  }
  if (/app\.noteforwork\.com\/(work-excuse-intake)?$|^\/?#get-note$|^\/#get-note/.test(href)) return '{{APP_URL}}/start';
  if (href.startsWith('https://app.noteforwork.com/verify-note-details')) return '{{APP_URL}}/verify-note-details';
  if (href === 'noteforwork-employer-information-sheet.pdf') return '/employer-information-sheet.pdf'; // one PDF only
  if (href === '/' || href === 'index.html') return '/';
  return href;
}

const clean = (html: string, lang: 'en' | 'es') =>
  sanitizeHtml(html, {
    allowedTags: [
      'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'a', 'br', 'hr', 'blockquote',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span', 'code',
    ],
    allowedAttributes: { a: ['href', 'target', 'rel'], div: ['class'], span: ['class'], p: ['class'], td: ['colspan'], th: ['colspan'] },
    allowedClasses: {
      div: ['summary-box', 'callout', 'warning', 'verify-box', 'divider', 'section', 'section-label', 'comp-grid', 'comp-card', 'pills', 'pill'],
      span: ['*'],
      p: ['*'],
    },
    transformTags: {
      a: (tag, attribs) => {
        const href = rewriteHref(attribs.href ?? '#', lang);
        const external = /^https?:\/\//.test(href) && !href.startsWith('{{APP_URL}}');
        return { tagName: 'a', attribs: { href, ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}) } };
      },
    },
    exclusiveFilter: (frame) => frame.tag === 'div' && !frame.text.trim() && frame.attribs.class !== 'divider',
  });

async function fetchText(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

async function importPage(p: (typeof PAGES)[number]) {
  const $ = cheerio.load(await fetchText(`${ORIGIN}/${p.file}`));
  $('h1 br').replaceWith(' '); // "NoteForWork<br>Physician Panel" → keep the space
  const title = $('title').text().trim();
  const description = $('meta[name="description"]').attr('content')?.trim() ?? '';
  const hero = $('.hero-article, .hero').first();
  const h1 = (hero.find('h1').first().text() || $('h1').first().text()).replace(/\s+/g, ' ').trim();
  const label = hero.find('.article-label, .hero-label, .eyebrow').first().text().trim() || null;
  const meta = (hero.find('.meta').first().text() || $('.container .meta').first().text()).replace(/\s+/g, ' ').trim() || null;
  const subtitle = hero.find('p').not('.meta').first().text().replace(/\s+/g, ' ').trim() || null;

  const body = $('.container').first();
  body.find('script, style, form, nav, footer, .cta-box, .cta, .related, h1, .meta, .back-link, button, input, iframe').remove();
  body.find('a').filter((_, a) => /^←/.test($(a).text().trim())).remove();

  const page = { slug: p.slug, legacyPath: `/${p.file}`, kind: p.kind, lang: p.lang ?? 'en', title, description, h1, label, meta, subtitle, html: clean(body.html() ?? '', p.lang ?? 'en') };
  await writeFile(path.join(OUT, `${p.slug}.json`), JSON.stringify(page, null, 2) + '\n');
  return page;
}

/** Resources index cards (category, date, blurb) from the legacy resources page. */
async function importIndex(slugByFile: Map<string, string>) {
  const $ = cheerio.load(await fetchText(`${ORIGIN}/resources.html`));
  const cards = $('a.article-card')
    .map((_, el) => {
      const a = $(el);
      const href = a.attr('href') ?? '';
      const slug = slugByFile.get(href) ?? slugByFile.get(href.replace(/^\//, ''));
      if (!slug) return null;
      return {
        slug,
        href: href.startsWith('/') ? href : `/${href}`,
        category: a.attr('data-tag') ?? a.find('.card-tag').text().trim(),
        date: (a.attr('data-date') ?? '').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
        title: a.find('.card-title').text().trim(),
        description: a.find('.card-desc').text().trim(),
      };
    })
    .get()
    .filter(Boolean);
  // Drop index entries that point at the same canonical article.
  const unique = [...new Map(cards.map((c) => [c!.slug, c])).values()];
  await writeFile(path.join(ROOT, 'content/articles.json'), JSON.stringify(unique, null, 2) + '\n');
  return unique.length;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  for (const p of PAGES) {
    const page = await importPage(p);
    console.log(`✓ ${p.file.padEnd(52)} ${page.html.length.toString().padStart(6)} chars`);
  }
  const slugByFile = new Map(PAGES.map((p) => [p.file, p.slug]));
  // Duplicates in the legacy index map to their canonical slug.
  slugByFile.set('telehealth-doctors-note-valid-for-work.html', 'telehealth-doctors-note-valid-for-work');
  slugByFile.set('staying-home-sick-public-health.html', 'staying-home-sick-public-health');
  console.log(`✓ resources index: ${await importIndex(slugByFile)} articles`);

  for (const a of ASSETS) {
    const res = await fetch(`${ORIGIN}/${a}`);
    if (!res.ok) throw new Error(`${a} → ${res.status}`);
    await writeFile(path.join(ROOT, 'public', a), Buffer.from(await res.arrayBuffer()));
    console.log(`✓ public/${a}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
