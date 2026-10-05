import { t, type Lang } from './i18n';

/** Real step order of the new flow (fixes the live site's mismatched progress bar). */
export function Progress({ lang, step }: { lang: Lang; step: number }) {
  return (
    <ol className="mb-7 flex gap-1" aria-label="Progress">
      {t(lang).steps.map((s, n) => (
        <li key={s} className="flex-1">
          <div className={`h-1.5 rounded-full ${n <= step ? 'bg-green-mid' : 'bg-border'}`} />
          <span className={`mt-1 block truncate text-[11px] ${n === step ? 'font-semibold text-ink' : 'text-muted'}`}>{s}</span>
        </li>
      ))}
    </ol>
  );
}
