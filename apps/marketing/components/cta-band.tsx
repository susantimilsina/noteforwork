import { t, type Lang } from '../content/i18n';
import { startUrl } from '../content/site';

/** "Feeling unwell?" band (design: light-green gradient, green pill button). Used on articles. */
export function CtaBand({ lang }: { lang: Lang }) {
  const d = t(lang).cta;
  return (
    <section aria-label={d.title} className="mt-12 border-t border-border bg-gradient-to-b from-green-light to-[#d5efe0] px-5 py-20 text-center">
      <p className="font-display text-[clamp(1.8rem,4.5vw,2.6rem)] leading-[1.12]">{d.title}</p>
      <p className="mx-auto mt-4 max-w-[600px] font-light text-muted">{d.body}</p>
      <a href={startUrl(lang)} className="mt-8 inline-block rounded-full bg-green px-10 py-4 font-semibold text-white hover:bg-green-mid">
        {t(lang).nav.cta}
      </a>
    </section>
  );
}
