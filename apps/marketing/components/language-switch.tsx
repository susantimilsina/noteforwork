'use client';

import { usePathname } from 'next/navigation';
import { LanguageToggle } from '@nfw/ui/language-toggle';
import type { Lang } from '../content/i18n';

/**
 * EN | ES toggle linking to the same page in the other language. `pairs` (English legacy URL ↔
 * /es URL) is computed at build time from the content; unknown pages fall back to the home pages.
 */
export function LanguageSwitch({ lang, pairs }: { lang: Lang; pairs: [string, string][] }) {
  const pathname = usePathname().replace(/\/$/, '') || '/';
  const pair = pairs.find(([en, es]) => (lang === 'en' ? en : es) === pathname);
  const hrefs = pair ? { en: pair[0], es: pair[1] } : { en: '/', es: '/es' };
  return <LanguageToggle current={lang} hrefs={{ ...hrefs, [lang]: pathname }} />;
}
