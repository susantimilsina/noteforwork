'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../../../staff/api';
import { Badge, fmtDateTime } from '../../../../staff/format';
import { StaffShell } from '../../../../staff/shell';
import { Deadline, minutesUntil, useNow } from '../../../../staff/time';

interface Row {
  id: string;
  publicRef: string;
  status: string;
  stateCode: string;
  submittedAt: string | null;
  slaDeadline: string | null;
  reviewer: string | null;
  lockExpired: boolean;
}

function LiveQueue() {
  const now = useNow();
  const [data, setData] = useState<{ uncoveredStates: string[]; rows: Row[] } | null>(null);
  const load = useCallback(() => adminApi<{ uncoveredStates: string[]; rows: Row[] }>('/queue').then(setData).catch(() => {}), []);
  useEffect(() => {
    load();
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
  }, [load]);

  const atRisk = data?.rows.filter((r) => (minutesUntil(r.slaDeadline, now) ?? 99) <= 15).length ?? 0;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Live queue</h1>
          <p className="text-sm text-muted">Paid requests waiting for a physician decision. Refreshes automatically.</p>
        </div>
        {data && (
          <p className="text-sm">
            <span className="font-semibold">{data.rows.length}</span> waiting · <span className={atRisk ? 'font-semibold text-danger' : ''}>{atRisk} at risk</span> (≤15 min or overdue)
          </p>
        )}
      </div>
      {data && data.uncoveredStates.length > 0 && (
        <p className="mb-4 rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger">
          No physician holds an active license in: <strong>{data.uncoveredStates.join(', ')}</strong>. These cases cannot be reviewed until coverage is added.
        </p>
      )}
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <tr>
              {['Deadline', 'Request', 'State', 'Status', 'Reviewer', 'Paid at'].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!data && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Loading…
                </td>
              </tr>
            )}
            {data?.rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Queue is empty.
                </td>
              </tr>
            )}
            {data?.rows.map((r) => (
              <tr key={r.id} className="hover:bg-cream">
                <td className="px-4 py-3">
                  <Deadline iso={r.slaDeadline} now={now} />
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/admin/requests/${r.id}`} className="text-green hover:underline">
                    {r.publicRef}
                  </Link>
                </td>
                <td className="px-4 py-3">{r.stateCode}</td>
                <td className="px-4 py-3">
                  <Badge value={r.status} />
                </td>
                <td className="px-4 py-3 text-xs">{r.reviewer ?? (r.lockExpired ? <span className="text-warn">Claim expired — back in queue</span> : <span className="text-muted">Unclaimed</span>)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{fmtDateTime(r.submittedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function QueuePage() {
  return (
    <StaffShell area="admin">
      <LiveQueue />
    </StaffShell>
  );
}
