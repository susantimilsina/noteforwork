import type { Lang } from '../content/i18n';
import { MobileCtaBar } from './mobile-cta-bar';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

/** Shared <html> for both root layouts; only `lang` differs. */
export function SiteShell({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <html lang={lang}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
          {lang === 'es' ? 'Ir al contenido' : 'Skip to content'}
        </a>
        <SiteHeader lang={lang} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter lang={lang} />
        <MobileCtaBar lang={lang} />
      </body>
    </html>
  );
}
