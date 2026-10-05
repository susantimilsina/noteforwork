'use client';

type Lang = 'en' | 'es';

/**
 * Segmented EN | ES switch. Always shows both languages; the current one is highlighted
 * and the other links to the same page in that language.
 */
export function LanguageToggle({
  current,
  hrefs,
  onBeforeNavigate,
}: {
  current: Lang;
  hrefs: Record<Lang, string>;
  /** e.g. hand unsaved form state to the other-language page before leaving. */
  onBeforeNavigate?: (target: Lang) => void;
}) {
  const options: [Lang, string, string][] = [
    ['en', 'EN', 'English'],
    ['es', 'ES', 'Español'],
  ];
  return (
    <div role="group" aria-label="Language / Idioma" className="inline-flex rounded-full border border-border bg-surface p-0.5 text-xs font-semibold">
      {options.map(([lang, short, name]) =>
        lang === current ? (
          <span key={lang} aria-current="true" lang={lang} title={name} className="rounded-full bg-green px-2.5 py-1 text-white">
            {short}
          </span>
        ) : (
          <a
            key={lang}
            href={hrefs[lang]}
            hrefLang={lang}
            lang={lang}
            title={name}
            onClick={() => onBeforeNavigate?.(lang)}
            className="rounded-full px-2.5 py-1 text-muted hover:text-ink"
          >
            {short}
          </a>
        ),
      )}
    </div>
  );
}
