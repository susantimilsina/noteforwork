import Link from 'next/link';
import { t, type Lang } from '../content/i18n';
import { startUrl } from '../content/site';
import { languagePairs } from '../lib/content';
import { routes } from '../lib/routes';
import { LanguageSwitch } from './language-switch';

export function Logo({ href }: { href: string }) {
  return (
    <Link href={href} className="font-display text-[1.45rem] tracking-[-0.01em]" style={{ fontWeight: 400 }} aria-label="NoteForWork home">
      <span className="text-green">Note</span>ForWork
    </Link>
  );
}

export function SiteHeader({ lang }: { lang: Lang }) {
  const d = t(lang);
  const r = routes(lang);
  const link = 'text-[15px] text-muted transition-colors hover:text-ink';
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-cream/95 backdrop-blur">
      <nav aria-label={lang === 'es' ? 'Principal' : 'Main'} className="flex items-center justify-between gap-4 px-5 py-2.5 sm:px-5">
        <Logo href={r.home} />
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href={r.resources} className={`hidden sm:inline ${link}`}>
            {d.nav.resources}
          </Link>
          <LanguageSwitch lang={lang} pairs={languagePairs()} />
          <Link href={r.faq} className={`hidden sm:inline ${link}`}>
            {d.nav.faq}
          </Link>
          <a href={startUrl(lang)} className="rounded-full bg-green px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-green-mid">
            {d.nav.cta}
          </a>
        </div>
      </nav>
    </header>
  );
}
