import Link from 'next/link';
import { CtaBand } from '../components/cta-band';
import { PageHero } from '../components/page-hero';
import { Prose } from '../components/prose';
import { t } from '../content/i18n';
import type { Page } from '../lib/content';
import { routes } from '../lib/routes';
import { articleJsonLd } from '../lib/structured-data';

/** Article, legal and careers pages share one layout; only the extras differ by kind. */
export function DocumentView({ page }: { page: Page }) {
  const d = t(page.lang);
  const r = routes(page.lang);
  const label = page.kind === 'careers' ? d.careers.label : page.label;
  return (
    <>
      {page.kind === 'article' && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(page)) }} />
      )}
      {page.kind === 'article' && (
        <nav aria-label="Breadcrumb" className="px-5 pt-5 text-[13px] text-muted">
          <ol className="mx-auto flex max-w-3xl flex-wrap gap-1.5">
            <li>
              <Link href={r.home} className="hover:text-ink">NoteForWork</Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={r.resources} className="hover:text-ink">{d.resources.label}</Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="truncate text-ink">{page.h1}</li>
          </ol>
        </nav>
      )}
      <PageHero label={label} title={page.h1} meta={page.meta} subtitle={page.kind === 'careers' ? page.subtitle : null} />
      <article className="mx-auto max-w-3xl px-5 py-12">
        {page.kind === 'legal' && d.legal.courtesy && (
          <p className="mb-8 rounded-xl border border-warn/30 bg-warn-light px-4 py-3 text-sm text-warn">{d.legal.courtesy}</p>
        )}
        <Prose html={page.html} />
        {page.kind === 'careers' && (
          <p className="mt-10 rounded-xl border border-border bg-surface p-5 text-sm">
            {d.careers.interestedA}{' '}
            <a className="font-medium text-green underline" href="mailto:ceo@noteforwork.com">
              ceo@noteforwork.com
            </a>
            {d.careers.interestedB}
          </p>
        )}
      </article>
      {page.kind === 'article' && <CtaBand lang={page.lang} />}
    </>
  );
}
