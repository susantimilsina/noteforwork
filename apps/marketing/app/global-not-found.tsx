import type { Metadata } from 'next';
import './globals.css';

// Unmatched URLs bypass both root layouts (en/es), so this page is self-contained and bilingual.
export const metadata: Metadata = { title: 'Page not found · Página no encontrada — NoteForWork' };

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="antialiased">
        <section className="hero-glow px-5 py-24 text-center">
          <h1 className="font-display text-5xl">Page not found</h1>
          <p className="mt-4 text-muted">That page doesn&apos;t exist or has moved.</p>
          <p className="mt-1 text-muted" lang="es">
            Esta página no existe o se ha movido.
          </p>
          <p className="mt-6 flex justify-center gap-6 font-medium text-green underline">
            <a href="/">Home</a>
            <a href="/es" lang="es">
              Inicio
            </a>
          </p>
        </section>
      </body>
    </html>
  );
}
