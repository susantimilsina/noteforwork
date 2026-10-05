'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminApi } from '../../../admin/api';
import { STATUS_LABEL } from '../../../admin/format';
import { AdminShell } from '../../../admin/shell';

interface Stats {
  byStatus: Record<string, number>;
  notesIssued: number;
  medianTurnaroundMinutes7d: number | null;
  notesLast7d: number;
}

const ORDER = ['IN_QUEUE', 'IN_REVIEW', 'PAYMENT_AUTHORIZED', 'NOTE_ISSUED', 'DECLINED', 'SCREEN_BLOCKED', 'SCREEN_PASSED', 'DRAFT'];

function Tile({ label, value, sub, href }: { label: string; value: string | number; sub?: string; href?: string }) {
  const body = (
    <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-green-mid">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-display mt-2 text-4xl" style={{ fontWeight: 400 }}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function Dashboard() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => {
    adminApi<Stats>('/stats').then(setS).catch(() => {});
  }, []);

  return (
    <AdminShell>
      <h1 className="font-display mb-6 text-3xl">Dashboard</h1>
      {!s ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Tile label="Notes issued" value={s.notesIssued} sub={`${s.notesLast7d} in the last 7 days`} href="/admin/notes" />
            <Tile label="Median turnaround (7 days)" value={s.medianTurnaroundMinutes7d === null ? '—' : `${s.medianTurnaroundMinutes7d} min`} sub="Payment → note issued" />
            <Tile label="Waiting for a physician" value={(s.byStatus.IN_QUEUE ?? 0) + (s.byStatus.IN_REVIEW ?? 0)} sub="In queue + in review" href="/admin/requests?status=IN_QUEUE" />
          </div>
          <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wide text-muted">Requests by status</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            {ORDER.map((k) => (
              <Link key={k} href={`/admin/requests?status=${k}`} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm hover:border-green-mid">
                <span>{STATUS_LABEL[k]}</span>
                <span className="font-semibold">{s.byStatus[k] ?? 0}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </AdminShell>
  );
}
