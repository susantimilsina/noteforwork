import Link from 'next/link';
import { t, type Lang } from '../content/i18n';
import { routes } from '../lib/routes';

export function SiteFooter({ lang }: { lang: Lang }) {
  const d = t(lang).footer;
  const r = routes(lang);
  const links: [string, string][] = [
    [d.links.resources, r.resources],
    [d.links.hr, r.hr],
    [d.links.careers, r.careers],
    [d.links.privacy, r.legal('privacy')],
    [d.links.terms, r.legal('terms')],
    [d.links.hipaa, r.legal('hipaa-notice')],
    [d.links.consent, r.legal('patient-consent')],
  ];
  return (
    <footer className="bg-ink px-5 pb-28 pt-12 text-center text-[13px] text-white/45">
      <nav aria-label={lang === 'es' ? 'Pie de página' : 'Footer'}>
        <ul className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
          <li>© {new Date().getFullYear()} NoteForWork.com</li>
          {links.map(([label, href]) => (
            <li key={href} className="flex items-center gap-2">
              <span aria-hidden>·</span>
              <Link href={href} className="hover:text-white">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className="mx-auto mt-6 max-w-[900px] leading-relaxed">{d.operator}</p>
      <p className="mx-auto mt-3 max-w-[900px] leading-relaxed">{d.emergency}</p>
    </footer>
  );
}
