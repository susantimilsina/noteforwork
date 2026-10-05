import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'Page not found · Página no encontrada — NoteForWork', robots: { index: false } };

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="antialiased">
        <section className="hero-glow px-5 py-24 text-center">
          <h1 className="font-display text-4xl">Page not found</h1>
          <p className="mt-2 text-muted" lang="es">Página no encontrada</p>
          <p className="mt-6 flex justify-center gap-6 font-medium text-green underline">
            <a href="/start">Start your visit</a>
            <a href="/es/start" lang="es">Inicia tu consulta</a>
          </p>
        </section>
      </body>
    </html>
  );
}
