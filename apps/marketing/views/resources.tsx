import Link from 'next/link';
import { CtaBand } from '../components/cta-band';
import { PageHero } from '../components/page-hero';
import { t, type Lang } from '../content/i18n';
import { articleCards } from '../lib/content';

export function ResourcesView({ lang }: { lang: Lang }) {
  const d = t(lang);
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(d.dateLocale, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return (
    <>
      <PageHero label={d.resources.label} title={d.resources.title} subtitle={d.resources.subtitle} />
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {articleCards(lang).map((c) => (
          <Link key={c.slug} href={c.href} className="group flex flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-green-mid">
            <span className="mb-3 self-start rounded-md bg-green-light px-2 py-0.5 text-xs font-semibold text-green">{c.category}</span>
            <h2 className="text-lg font-semibold group-hover:text-green">{c.title}</h2>
            <p className="mt-2 flex-1 text-sm text-muted">{c.description}</p>
            <p className="mt-4 flex justify-between text-xs text-muted">
              <span>{fmt(c.date)}</span>
              <span className="font-medium text-green">{d.resources.read}</span>
            </p>
          </Link>
        ))}
      </section>
      <CtaBand lang={lang} />
    </>
  );
}
