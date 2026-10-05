'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { homeFor, isAdminRole, isPhysician, staffApi, type Me } from './api';

const MeContext = createContext<Me | null>(null);
/** The signed-in staff member (available inside StaffShell). */
export const useMe = () => useContext(MeContext)!;

type Area = 'admin' | 'physician';

/**
 * Signed-in chrome for all staff. Navigation shows only what the user's roles allow; a person with
 * both roles (e.g. the medical director) sees both areas. Pages declare which area they belong to.
 */
export function StaffShell({ area, children }: { area: Area; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    staffApi<Me>('/staff/me').then(setMe).catch(() => {});
  }, []);

  async function signOut() {
    await staffApi('/staff/auth/logout', { method: 'POST' });
    router.replace('/staff/login');
  }

  if (!me) return <p className="p-8 text-sm text-muted">Loading…</p>;

  const nav: [string, string][] = [
    ...(isPhysician(me) ? ([['/physician', 'My queue']] as [string, string][]) : []),
    ...(isAdminRole(me)
      ? ([
          ['/admin', 'Dashboard'],
          ['/admin/queue', 'Live queue'],
          ['/admin/requests', 'Requests'],
          ['/admin/notes', 'Notes'],
          ['/admin/physicians', 'Physicians'],
        ] as [string, string][])
      : []),
  ];
  const allowed = area === 'admin' ? isAdminRole(me) : isPhysician(me);
  const badge = area === 'admin' ? 'Admin' : 'Physician';

  return (
    <MeContext.Provider value={me}>
      <div className="min-h-dvh">
        <header className="sticky top-0 z-20 border-b border-border bg-surface">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
            <Link href={homeFor(me)} className="font-display text-lg" style={{ fontWeight: 400 }}>
              <span className="text-green">Note</span>ForWork{' '}
              <span className={`ml-1 rounded px-1.5 py-0.5 align-middle font-sans text-[10px] font-semibold uppercase tracking-wider text-white ${area === 'admin' ? 'bg-ink' : 'bg-green'}`}>{badge}</span>
            </Link>
            <nav className="flex flex-wrap gap-1 text-sm">
              {nav.map(([href, label]) => {
                const active = href === '/admin' || href === '/physician' ? pathname === href || (href === '/physician' && pathname.startsWith('/physician/')) : pathname.startsWith(href);
                return (
                  <Link key={href} href={href} className={`rounded-lg px-3 py-1.5 ${active ? 'bg-green-light font-semibold text-green' : 'text-muted hover:text-ink'}`}>
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="ml-auto flex items-center gap-3 text-sm">
              <span className="hidden text-muted md:inline">
                {me.displayName ?? me.email} · {me.roles.map((r) => r.toLowerCase()).join(' + ')}
              </span>
              <button type="button" onClick={signOut} className="rounded-lg border border-border px-3 py-1.5 hover:bg-cream">
                Sign out
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-5 py-8">
          {allowed ? (
            children
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-8 text-center">
              <p className="font-semibold">Your account doesn&apos;t have access to this area.</p>
              <Link href={homeFor(me)} className="mt-3 inline-block text-green underline">
                Go to your home page
              </Link>
            </div>
          )}
        </main>
      </div>
    </MeContext.Provider>
  );
}
