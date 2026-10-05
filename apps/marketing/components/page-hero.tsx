export function PageHero({ label, title, meta, subtitle }: { label?: string | null; title: string; meta?: string | null; subtitle?: string | null }) {
  return (
    <section className="hero-glow px-5 pb-14 pt-16 text-center">
      {label && <p className="eyebrow mb-3">{label}</p>}
      <h1 className="font-display mx-auto max-w-3xl text-[clamp(2rem,5vw,2.8rem)] leading-[1.12]">{title}</h1>
      {subtitle && <p className="mx-auto mt-4 max-w-xl text-[1.05rem] font-light leading-relaxed text-muted">{subtitle}</p>}
      {meta && <p className="mt-4 text-sm text-muted">{meta}</p>}
    </section>
  );
}
