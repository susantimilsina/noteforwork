'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { adminApi, type Paged } from '../../../../staff/api';
import { Badge, fmtDateTime, STATUS_LABEL } from '../../../../staff/format';
import { StaffShell } from '../../../../staff/shell';

interface Row {
  id: string;
  publicRef: string;
  status: string;
  stateCode: string;
  createdAt: string;
  submittedAt: string | null;
  slaDeadline: string | null;
  patient: { firstName: string; lastName: string } | null;
  screening: { outcome: string; riskLevel: string; blockReason: string | null } | null;
  consent: { language: string } | null;
  note: { noteId: string; status: string; issuedAt: string } | null;
}

const FILTERS = ['', 'IN_QUEUE', 'IN_REVIEW', 'NOTE_ISSUED', 'DECLINED', 'SCREEN_BLOCKED', 'PAYMENT_AUTHORIZED', 'SCREEN_PASSED', 'DRAFT'];

function Requests() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const status = params.get('status') ?? '';
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? 1);
  const [data, setData] = useState<Paged<Row> | null>(null);
  const [search, setSearch] = useState(q);

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page), pageSize: '25', ...(status && { status }), ...(q && { q }) });
    setData(null);
    adminApi<Paged<Row>>(`/intakes?${qs}`).then(setData).catch(() => {});
  }, [status, q, page]);

  const go = (next: Record<string, string>) => {
    const qs = new URLSearchParams({ ...(status && { status }), ...(q && { q }), ...next });
    for (const [k, v] of [...qs]) if (!v) qs.delete(k);
    router.push(`${pathname}?${qs}`);
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl">Requests</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go({ q: search, page: '' });
          }}
          className="flex gap-2"
        >
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="REQ-…, NFW-…, name or email" className="w-72 rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
          <button className="rounded-xl bg-green px-4 py-2 text-sm font-semibold text-white">Search</button>
        </form>
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button key={f || 'all'} type="button" onClick={() => go({ status: f, page: '' })} className={`rounded-full border px-3 py-1 text-xs ${status === f ? 'border-green bg-green text-white' : 'border-border bg-surface text-muted hover:text-ink'}`}>
            {f ? STATUS_LABEL[f] : 'All'}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <tr>
              {['Request', 'Patient', 'State', 'Status', 'Screening', 'Note', 'Created'].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!data && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  Loading…
                </td>
              </tr>
            )}
            {data?.rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No requests match.
                </td>
              </tr>
            )}
            {data?.rows.map((r) => (
              <tr key={r.id} className="cursor-pointer hover:bg-cream" onClick={() => router.push(`/admin/requests/${r.id}`)}>
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/admin/requests/${r.id}`} className="text-green underline-offset-2 hover:underline">
                    {r.publicRef}
                  </Link>
                </td>
                <td className="px-4 py-3">{r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : <span className="text-muted">—</span>}</td>
                <td className="px-4 py-3">
                  {r.stateCode}
                  {r.consent?.language === 'es' && <span className="ml-1.5 rounded bg-cream px-1 text-[10px] font-semibold text-muted">ES</span>}
                </td>
                <td className="px-4 py-3">
                  <Badge value={r.status} />
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {r.screening ? (r.screening.outcome === 'BLOCKED' ? `Blocked · ${r.screening.blockReason}` : `Eligible · ${r.screening.riskLevel.toLowerCase()} risk`) : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{r.note?.noteId ?? <span className="font-sans text-muted">—</span>}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{fmtDateTime(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>
            {data.total} request{data.total === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => go({ page: String(page - 1) })} className="rounded-lg border border-border bg-surface px-3 py-1 disabled:opacity-40">
              ← Prev
            </button>
            <span>
              Page {page} of {pages}
            </span>
            <button type="button" disabled={page >= pages} onClick={() => go({ page: String(page + 1) })} className="rounded-lg border border-border bg-surface px-3 py-1 disabled:opacity-40">
              Next →
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function RequestsPage() {
  return (
    <StaffShell area="admin">
      <Suspense>
        <Requests />
      </Suspense>
    </StaffShell>
  );
}
