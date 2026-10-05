import { AppHeader } from './app-header';
import { BackProvider } from './back-context';
import type { Lang } from '../lib/i18n';

export function AppShell({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <html lang={lang}>
      <body className="min-h-dvh antialiased">
        <BackProvider>
          <AppHeader lang={lang} />
          <main className="hero-glow min-h-[calc(100dvh-57px)]">
            <div className="mx-auto w-full max-w-xl px-5 pb-16 pt-8">{children}</div>
          </main>
        </BackProvider>
      </body>
    </html>
  );
}
