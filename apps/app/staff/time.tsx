'use client';

import { useEffect, useState } from 'react';

/** Re-render every `ms` so countdowns stay current. */
export function useNow(ms = 15_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export const minutesUntil = (iso: string | null | undefined, now: number) => (iso ? Math.round((new Date(iso).getTime() - now) / 60_000) : null);

/** "23 min left" / "4 min overdue", coloured by urgency against the 60-minute guarantee. */
export function Deadline({ iso, now }: { iso: string | null | undefined; now: number }) {
  const m = minutesUntil(iso, now);
  if (m === null) return <span className="text-muted">—</span>;
  const tone = m < 0 ? 'bg-danger-light text-danger' : m <= 15 ? 'bg-warn-light text-warn' : 'bg-green-light text-green';
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{m < 0 ? `${-m} min overdue` : `${m} min left`}</span>;
}
