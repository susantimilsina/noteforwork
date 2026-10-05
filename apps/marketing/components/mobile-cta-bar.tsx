import type { Lang } from '../content/i18n';
import { startUrl } from '../content/site';

const COPY = {
  en: { title: 'Signed note in 60 minutes', sub: 'Board-certified physicians · 24/7', cta: 'Get My Note →' },
  es: { title: 'Nota firmada en 60 minutos', sub: 'Médicos certificados · 24/7', cta: 'Obtener mi nota →' },
};

/** Sticky bottom bar on every screen size, as in the design. */
export function MobileCtaBar({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  return (
    <aside aria-label={c.title} className="fixed inset-x-0 bottom-0 z-30 bg-ink shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
      <div className="mx-auto flex max-w-[1000px] items-center justify-between gap-4 px-5 py-3">
        <div className="text-white">
          <p className="text-[15px] font-semibold">{c.title}</p>
          <p className="text-[13px] text-white/55">{c.sub}</p>
        </div>
        <a href={startUrl(lang)} className="shrink-0 rounded-full bg-green-mid px-6 py-3 text-[15px] font-semibold text-white hover:bg-green">
          {c.cta}
        </a>
      </div>
    </aside>
  );
}
