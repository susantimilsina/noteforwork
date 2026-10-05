'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminApi } from './api';

interface Me {
  email: string;
  role: string;
  displayName: string | null;
}

const NAV = [
  ['/admin', 'Dashboard'],
  ['/admin/requests', 'Requests'],
  ['/admin/notes', 'Notes'],
] as const;

/** Signed-in chrome: top bar with navigation, user and sign-out. Children render once /me succeeds. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    adminApi<Me>('/me').then(setMe).catch(() => {});
  }, []);

  async function signOut() {
    await adminApi('/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
  }

  if (!me) return <p className="p-8 text-sm text-muted">Loading…</p>;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-3">
          <Link href="/admin" className="font-display text-lg" style={{ fontWeight: 400 }}>
            <span className="text-green">Note</span>ForWork <span className="ml-1 rounded bg-ink px-1.5 py-0.5 align-middle font-sans text-[10px] font-semibold uppercase tracking-wider text-white">Admin</span>
          </Link>
          <nav className="flex gap-1 text-sm">
            {NAV.map(([href, label]) => {
              const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
              return (
                <Link key={href} href={href} className={`rounded-lg px-3 py-1.5 ${active ? 'bg-green-light font-semibold text-green' : 'text-muted hover:text-ink'}`}>
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">
              {me.email} · {me.role.toLowerCase()}
            </span>
            <button type="button" onClick={signOut} className="rounded-lg border border-border px-3 py-1.5 hover:bg-cream">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}
