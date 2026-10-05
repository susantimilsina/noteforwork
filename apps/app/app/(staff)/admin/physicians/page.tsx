'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '../../../../staff/api';
import { fmtDate, fmtDateTime } from '../../../../staff/format';
import { StaffShell } from '../../../../staff/shell';

interface Physician {
  id: string;
  displayName: string;
  degree: string;
  npi: string;
  active: boolean;
  email: string;
  lastLoginAt: string | null;
  notesTotal: number;
  notes30d: number;
  declined30d: number;
  licenses: { stateCode: string; number: string; expiresAt: string; daysLeft: number }[];
}

function License({ l }: { l: Physician['licenses'][number] }) {
  const tone = l.daysLeft < 0 ? 'border-danger/30 bg-danger-light text-danger' : l.daysLeft <= 60 ? 'border-warn/30 bg-warn-light text-warn' : 'border-border bg-cream text-ink';
  return (
    <li className={`rounded-lg border px-2 py-1 text-xs ${tone}`} title={`Expires ${fmtDate(l.expiresAt)}`}>
      <span className="font-semibold">{l.stateCode}</span> <span className="font-mono">{l.number}</span>
      <span className="ml-1 opacity-75">{l.daysLeft < 0 ? 'expired' : l.daysLeft <= 60 ? `${l.daysLeft}d left` : `to ${fmtDate(l.expiresAt)}`}</span>
    </li>
  );
}

function Physicians() {
  const [rows, setRows] = useState<Physician[] | null>(null);
  useEffect(() => {
    adminApi<Physician[]>('/physicians').then(setRows).catch(() => {});
  }, []);

  return (
    <>
      <h1 className="font-display mb-1 text-3xl">Physicians</h1>
      <p className="mb-6 text-sm text-muted">Licenses expiring within 60 days are amber; expired licenses are red and no longer count for coverage.</p>
      {!rows && <p className="text-sm text-muted">Loading…</p>}
      <div className="space-y-3">
        {rows?.map((p) => (
          <article key={p.id} className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="font-semibold">
                Dr. {p.displayName}, {p.degree}
              </h2>
              <span className="font-mono text-xs text-muted">NPI {p.npi}</span>
              <span className="text-xs text-muted">{p.email}</span>
              {!p.active && <span className="rounded-full bg-danger-light px-2 py-0.5 text-xs font-semibold text-danger">Inactive</span>}
              <span className="ml-auto text-xs text-muted">Last sign-in {fmtDateTime(p.lastLoginAt)}</span>
            </div>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {p.licenses.length ? p.licenses.map((l) => <License key={l.stateCode + l.number} l={l} />) : <li className="text-xs text-danger">No licenses on file</li>}
            </ul>
            <p className="mt-3 text-xs text-muted">
              {p.notesTotal} notes signed · {p.notes30d} in the last 30 days · {p.declined30d} declined in the last 30 days
            </p>
          </article>
        ))}
      </div>
    </>
  );
}

export default function PhysiciansPage() {
  return (
    <StaffShell area="admin">
      <Physicians />
    </StaffShell>
  );
}
