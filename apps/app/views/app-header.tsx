'use client';

import { usePathname } from 'next/navigation';
import { LanguageToggle } from '@nfw/ui/language-toggle';
import { marketingHome, t, type Lang } from '../lib/i18n';
import { useBackHandler } from './back-context';

/** Patient-app header: ← Back · logo · EN|ES. Each step decides what Back does (see useBack). */
export function AppHeader({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const handler = useBackHandler();
  const d = t(lang).header;

  const enPath = pathname.replace(/^\/es(?=\/start)/, '') || '/start';
  const hrefs = { en: enPath, es: `/es${enPath}` };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-5 py-2.5">
        <button
          type="button"
          onClick={() => (handler ? handler() : (window.location.href = marketingHome(lang)))}
          className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:bg-green-light"
        >
          <span aria-hidden>←</span> {d.back}
        </button>
        <a href={marketingHome(lang)} aria-label={d.home} className="font-display text-xl" style={{ fontWeight: 400 }}>
          Note<span className="text-green">For</span>Work
        </a>
        <LanguageToggle current={lang} hrefs={hrefs} />
      </div>
    </header>
  );
}
