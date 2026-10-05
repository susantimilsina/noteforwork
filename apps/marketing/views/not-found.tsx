import Link from 'next/link';
import { t, type Lang } from '../content/i18n';
import { routes } from '../lib/routes';

export function NotFoundView({ lang }: { lang: Lang }) {
  const d = t(lang).notFound;
  return (
    <section className="hero-glow mx-auto px-5 py-24 text-center">
      <h1 className="font-display text-5xl">{d.title}</h1>
      <p className="mt-4 text-muted">{d.body}</p>
      <Link href={routes(lang).home} className="mt-6 inline-block font-medium text-green underline">
        {d.back}
      </Link>
    </section>
  );
}
