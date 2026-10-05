import Image from 'next/image';
import Link from 'next/link';
import { IconCheck, IconDoctor, IconForm, IconInbox } from '../components/icons';
import { HOME, PHYSICIANS, TESTIMONIALS, TURNAROUND } from '../content/home';
import type { Lang } from '../content/i18n';
import { PRICE_USD, startUrl } from '../content/site';
import { routes } from '../lib/routes';
import { homeJsonLd } from '../lib/structured-data';

/** Turn known phrases inside FAQ answers into internal links (good for users and crawl paths). */
function linkify(text: string, lang: Lang): React.ReactNode {
  const links: [string, string][] = [
    ['HIPAA Notice of Privacy Practices', routes(lang).legal('hipaa-notice')],
    ['Aviso de Prácticas de Privacidad de HIPAA', routes(lang).legal('hipaa-notice')],
    ['Employer Information Sheet', '/employer-information-sheet.pdf'],
    ['Hoja Informativa para Empleadores', '/employer-information-sheet.pdf'],
  ];
  const hit = links.find(([phrase]) => text.includes(phrase));
  if (!hit) return text;
  const [phrase, href] = hit;
  const [before, after] = text.split(phrase, 2) as [string, string];
  return (
    <>
      {before}
      <Link href={href} className="text-green underline underline-offset-2">
        {phrase}
      </Link>
      {after}
    </>
  );
}

const ICONS = { form: IconForm, doctor: IconDoctor, inbox: IconInbox } as const;

/** Section heading: eyebrow + two-line serif h2 (as in the design). */
function Heading({ id, eyebrow, a, b, center, light }: { id: string; eyebrow: string; a: string; b?: string; center?: boolean; light?: boolean }) {
  return (
    <header className={center ? 'text-center' : ''}>
      <p className={`eyebrow mb-3 ${light ? 'text-green-mid' : ''}`}>{eyebrow}</p>
      <h2 id={id} className={`font-display text-[clamp(2rem,4.6vw,2.6rem)] leading-[1.12] ${light ? 'text-white' : ''}`}>
        {a}
        {b && (
          <>
            <br />
            {b}
          </>
        )}
      </h2>
    </header>
  );
}

const Container = ({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) => (
  <div className={`mx-auto w-full px-5 ${narrow ? 'max-w-[1100px]' : 'max-w-[1000px]'}`}>{children}</div>
);

export function HomeView({ lang }: { lang: Lang }) {
  const c = HOME[lang];
  const start = startUrl(lang);
  const asOf = new Date(`${TURNAROUND.asOf}T12:00:00Z`).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const [taLabel, taValue] = c.hero.turnaround(TURNAROUND.minutes);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd(lang)) }} />

      {/* ───────── Hero ───────── */}
      <section aria-labelledby="hero-title" className="hero-glow px-5 pb-16 pt-14 text-center sm:pt-[100px]">
        <p className="mx-auto mb-7 inline-flex flex-wrap items-center justify-center gap-x-2 rounded-full border border-border bg-surface px-4 py-1.5 text-[13px] text-green">
          <span className="size-1.5 rounded-full bg-green-mid" aria-hidden />
          {c.hero.badge.map((b, i) => (
            <span key={b}>
              {i > 0 && <span className="mr-2 text-muted" aria-hidden>·</span>}
              {b}
            </span>
          ))}
        </p>
        <h1 id="hero-title" className="font-display mx-auto max-w-[760px] text-[clamp(2.5rem,7.5vw,4.4rem)] leading-[1.05]">
          {c.hero.titleA}
          <br />
          <em className="text-green">{c.hero.titleB}</em>
        </h1>
        <p className="mx-auto mt-7 max-w-[560px] text-[1.15rem] font-light leading-[1.65] text-muted">
          {c.hero.bodyA} <strong className="font-semibold text-ink">{c.hero.bodyStrong}</strong> {c.hero.bodyB}
        </p>

        <div className="mx-auto mt-9 flex max-w-[420px] flex-col items-center gap-3">
          <a href="#doctors" className="inline-flex items-center gap-3 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-4 text-[13px] font-semibold hover:border-green-mid">
            <span className="flex -space-x-2" aria-hidden>
              {PHYSICIANS.map((p) => (
                <Image key={p.id} src={p.photo} alt="" width={30} height={30} className="size-[30px] rounded-full border-2 border-surface object-cover object-top" />
              ))}
            </span>
            {c.hero.reviewed} <span className="text-green">→</span>
          </a>
          <p className="inline-flex items-center gap-2 rounded-full border border-green/20 bg-green-light px-4 py-1.5 text-[13px] text-green">
            <span className="size-2 rounded-full bg-green-mid" aria-hidden />
            {taLabel} <strong className="font-semibold">{taValue}</strong>
            <span className="text-muted">
              · {c.hero.updated} <time dateTime={TURNAROUND.asOf}>{asOf}</time>
            </span>
          </p>
        </div>

        <a href={start} className="mx-auto mt-4 block max-w-[440px] rounded-xl bg-green-mid px-6 py-[17px] text-[15.5px] font-semibold text-white transition-colors hover:bg-green">
          {c.hero.cta} →
        </a>
        <p className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-1 text-[13px] text-muted">
          <span>{c.hero.chipQr}</span>
          <span>{c.hero.chips.join(' · ')}</span>
        </p>
      </section>

      {/* ───────── Trust strip ───────── */}
      <section aria-label="Security" className="border-y border-border px-5 py-4">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-muted">
          {c.trust.map((t, i) => (
            <li key={t} className="flex items-center gap-1.5">
              {i > 0 && <span className="mr-4 hidden text-border sm:inline" aria-hidden>|</span>}
              <IconCheck className="text-green" />
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* ───────── Doctors ───────── */}
      <section id="doctors" aria-labelledby="doctors-title" className="scroll-mt-16 py-[72px]">
        <Container>
          <Heading id="doctors-title" eyebrow={c.doctors.eyebrow} a={c.doctors.titleA} b={c.doctors.titleB} />
        </Container>
        <div className="mx-auto mt-10 max-w-[1000px] overflow-x-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max snap-x gap-5">
            {PHYSICIANS.map((p) => {
              const d = c.doctors.people[p.id]!;
              return (
                <li key={p.id} className="flex w-[300px] shrink-0 snap-start flex-col rounded-2xl border border-border bg-surface px-6 py-7 sm:w-[320px]">
                  <article className="flex h-full flex-col">
                    <div className="mb-5 flex items-center gap-4">
                      <Image
                        src={p.photo}
                        alt={`Dr. ${p.name}, ${p.degree}`}
                        width={72}
                        height={72}
                        className="size-[72px] shrink-0 rounded-full border-[3px] border-green-mid object-cover object-top"
                      />
                      <div>
                        <h3 className="text-[0.95rem] font-bold leading-snug">
                          Dr. {p.name}, {p.degree}
                        </h3>
                        <p className="mt-0.5 text-[0.74rem] font-semibold text-green">{d.cert}</p>
                        <p className="text-[0.71rem] font-medium text-muted">{d.role}</p>
                      </div>
                    </div>
                    <p className="mb-4 flex-1 text-[0.83rem] leading-[1.68] text-muted">
                      {d.bio}
                    </p>
                    <dl className="mb-3.5 text-[0.75rem] leading-[1.7] text-muted">
                      <div>
                        <dt className="inline">{c.doctors.languages}: </dt>
                        <dd className="inline font-medium text-ink">{d.langs}</dd>
                      </div>
                      <div>
                        <dt className="inline">{c.doctors.npi}: </dt>
                        <dd className="inline font-medium text-ink">{p.npi}</dd>
                      </div>
                    </dl>
                    <ul className="flex flex-wrap gap-1.5">
                      {d.tags.map((tag) => (
                        <li key={tag} className="rounded-full border border-[#b6dfc8] bg-green-light px-2.5 py-[3px] text-[0.68rem] font-semibold text-green">
                          ✓ {tag}
                        </li>
                      ))}
                    </ul>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="mt-3 text-center text-xs text-muted sm:hidden">{c.doctors.scrollHint}</p>
      </section>

      {/* ───────── Process ───────── */}
      <section id="process" aria-labelledby="process-title" className="scroll-mt-16 border-b border-border py-[72px]">
        <Container>
          <Heading id="process-title" eyebrow={c.process.eyebrow} a={c.process.titleA} b={c.process.titleB} />
          <ol className="mt-10 grid gap-5 sm:grid-cols-3">
            {c.process.steps.map((s) => {
              const Icon = ICONS[s.icon as keyof typeof ICONS];
              return (
                <li key={s.title} className="rounded-2xl border border-border bg-surface px-[22px] py-[26px]">
                  <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-green text-white">
                    <Icon />
                  </span>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">{s.body}</p>
                </li>
              );
            })}
          </ol>
        </Container>
      </section>

      {/* ───────── Why ───────── */}
      <section aria-labelledby="why-title" className="bg-surface py-[72px]">
        <Container narrow>
          <Heading id="why-title" eyebrow={c.why.eyebrow} a={c.why.titleA} b={c.why.titleB} />
          <ul className="mt-10 grid gap-5 sm:grid-cols-3">
            {c.why.items.map((w) => (
              <li key={w.title} className="rounded-2xl border border-border bg-cream px-[22px] py-[26px]">
                <h3 className="font-semibold leading-snug">{w.title}</h3>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">{w.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ───────── Pricing ───────── */}
      <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-16 bg-ink px-5 py-[72px]">
        <Heading id="pricing-title" eyebrow={c.pricing.eyebrow} a={c.pricing.titleA} b={c.pricing.titleB} center light />
        <p className="mt-4 text-center font-light text-white/60">{c.pricing.sub}</p>
        <div className="mx-auto mt-10 max-w-[420px] rounded-2xl border border-white/10 border-t-[3px] border-t-green-mid bg-[#18261e] px-8 pb-8 pt-7 text-center text-white">
          <p className="inline-block rounded-full bg-green-mid px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]">{c.pricing.badge}</p>
          <p className="font-display mt-4 text-[3.6rem] leading-none" style={{ fontWeight: 400 }}>
            <sup className="mr-0.5 align-super text-xl">$</sup>
            {PRICE_USD}
          </p>
          <p className="mt-2 text-sm text-white/55">{c.pricing.oneTime}</p>
          <ul className="mt-7 space-y-3.5 text-left text-[0.95rem]">
            {c.pricing.included.map((i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-green-mid/20 text-green-mid">
                  <IconCheck />
                </span>
                <span className="text-white/90">{i}</span>
              </li>
            ))}
          </ul>
          <a href={start} className="mt-8 block rounded-xl bg-green-mid px-6 py-[15px] font-semibold text-white hover:bg-green">
            {c.pricing.cta} →
          </a>
        </div>
      </section>

      {/* ───────── Testimonials ───────── */}
      <section aria-labelledby="testi-title" className="py-[72px]">
        <Container>
          <Heading id="testi-title" eyebrow={c.testimonials.eyebrow} a={c.testimonials.titleA} b={c.testimonials.titleB} />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <li key={t.name} className="flex flex-col justify-center rounded-2xl border border-border bg-surface px-7 py-8">
                <figure>
                  <blockquote lang="en" className="font-display text-[1.35rem] italic leading-snug" style={{ fontWeight: 400 }}>
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-5">
                    <p className="font-semibold">
                      {t.name}
                      {t.place && <span className="font-normal text-muted"> · {t.place}</span>}
                    </p>
                    <p className="mt-1 font-mono text-[0.78rem] text-muted">
                      {c.testimonials.submitted} {t.submitted} · {c.testimonials.signed} {t.signed} · {c.testimonials.turnaround(t.minutes)}
                    </p>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-center">
            <a href={start} className="inline-block rounded-full bg-green px-8 py-3.5 font-semibold text-white hover:bg-green-mid">
              {c.testimonials.cta} →
            </a>
          </p>
        </Container>
      </section>

      {/* ───────── Guarantee ───────── */}
      <section id="guarantee" aria-labelledby="guarantee-title" className="scroll-mt-16 border-y border-border bg-green-light py-[72px]">
        <div className="mx-auto max-w-[800px] px-5">
          <header className="text-center">
            <p className="mb-3 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-ink/80">{c.guarantee.eyebrow}</p>
            <h2 id="guarantee-title" className="font-display text-[clamp(2rem,4.6vw,2.6rem)] leading-[1.12]">
              {c.guarantee.titleA}
              <br />
              {c.guarantee.titleB}
            </h2>
            <p className="mx-auto mt-5 max-w-[640px] font-light leading-[1.7] text-muted">{c.guarantee.intro}</p>
          </header>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <div className="relative rounded-2xl border border-green/25 bg-[#f0f8f3] px-6 pb-7 pt-8">
              <span className="absolute -top-3 left-5 rounded-full bg-green px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">{c.guarantee.before.label}</span>
              <h3 className="font-semibold">{c.guarantee.before.title}</h3>
              <p className="mt-2 text-[0.92rem] leading-[1.7] text-muted">{c.guarantee.before.body}</p>
            </div>
            <div className="relative rounded-2xl border-2 border-[#d9a441] bg-[#fdf8ec] px-6 pb-7 pt-8">
              <span className="absolute -top-3 left-5 rounded-full bg-[#d9a441] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">{c.guarantee.after.label}</span>
              <h3 className="font-semibold">{c.guarantee.after.title}</h3>
              <p className="mt-2 text-[0.92rem] leading-[1.7] text-muted">
                {c.guarantee.after.bodyA}{' '}
                <a href="mailto:help@noteforwork.com" className="font-medium text-green underline">help@noteforwork.com</a> {c.guarantee.after.bodyB}
              </p>
            </div>
          </div>

          <p className="mt-6 rounded-2xl border border-green/25 px-6 py-4 text-center text-[0.95rem] text-green">
            {c.guarantee.highlightA} <strong className="font-semibold">{c.guarantee.highlightB}</strong>
          </p>

          <h3 className="mt-10 font-semibold">{c.guarantee.hrTitle}</h3>
          <p className="mt-3 leading-[1.75] text-ink/80">
            {c.guarantee.hrBodyA} <strong className="font-semibold text-ink">{c.guarantee.hrBodyStrong}</strong> {c.guarantee.hrBodyB}
          </p>

          <ol className="mt-6 space-y-3">
            {c.guarantee.steps.map((s, i) => (
              <li key={s.title} className="flex gap-4 rounded-2xl border border-border bg-surface px-6 py-5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green text-sm font-semibold text-white">{i + 1}</span>
                <div>
                  <h4 className="font-semibold">{s.title}</h4>
                  <p className="mt-1 text-[0.92rem] leading-[1.7] text-muted">
                    {'body' in s ? (
                      s.body
                    ) : (
                      <>
                        {s.bodyA}{' '}
                        <a href="mailto:help@noteforwork.com" className="font-medium text-green underline">help@noteforwork.com</a> {s.bodyB}
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <a href="/employer-information-sheet.pdf" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-green px-5 py-3.5 font-semibold text-white hover:bg-green-mid">
            <span aria-hidden>↓</span> {c.guarantee.download}
          </a>
          <p className="mt-5 text-[0.92rem] italic leading-[1.7] text-muted">{c.guarantee.fine}</p>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 py-[72px]">
        <div className="mx-auto max-w-[760px] px-5">
          <header className="text-center">
            <p className="eyebrow mb-3">{c.faq.eyebrow}</p>
            <h2 id="faq-title" className="font-display text-[clamp(2rem,4.6vw,2.6rem)] leading-[1.12]">
              {c.faq.title}
            </h2>
          </header>
          <div className="mt-10 space-y-3">
            {c.faq.items.map(([q, a], i) => (
              <details key={q} open={i === 0} className="group rounded-2xl border border-border bg-surface transition-colors hover:bg-green-light/60 open:hover:bg-surface">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 [&::-webkit-details-marker]:hidden">
                  <h3 className="font-semibold">{q}</h3>
                  <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full border border-green/25 bg-green-light text-sm text-green transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="px-6 pb-6 leading-[1.75] text-muted">{linkify(a, lang)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section aria-labelledby="final-title" className="border-t border-border bg-gradient-to-b from-green-light to-[#d5efe0] px-5 py-24 text-center">
        <h2 id="final-title" className="font-display text-[clamp(2rem,5vw,3rem)] leading-[1.1]">
          {c.finalCta.titleA}
          <br />
          {c.finalCta.titleB}
        </h2>
        <p className="mx-auto mt-5 max-w-[640px] font-light text-muted">{c.finalCta.body}</p>
        <a href={start} className="mt-10 inline-block rounded-full bg-green px-12 py-4 text-[1.05rem] font-semibold text-white hover:bg-green-mid">
          {c.finalCta.cta} →
        </a>
      </section>
    </>
  );
}
