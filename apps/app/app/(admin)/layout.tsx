import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: { default: 'Admin · NoteForWork', template: '%s · Admin · NoteForWork' },
  robots: { index: false, follow: false, nocache: true },
};

/** Staff panel root layout: English only, no patient header, never indexed. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-cream antialiased">{children}</body>
    </html>
  );
}
