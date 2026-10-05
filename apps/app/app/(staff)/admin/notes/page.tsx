'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { adminApi, type Paged } from '../../../../staff/api';
import { Badge, ENTITY_LABEL, fmtDate, fmtDateTime, minutesBetween } from '../../../../staff/format';
import { StaffShell } from '../../../../staff/shell';

interface NoteRow {
  id: string;
  noteId: string;
  status: string;
  issuingEntity: string;
  patientDisplayName: string;
  absenceStart: string;
  absenceEnd: string;
  issuedAt: string;
  deliveredAt: string | null;
  legacy: boolean;
  intakeId: string | null;
  physician: { displayName: string; degree: string };
  license: { stateCode: string; number: string };
  intake: { publicRef: string; submittedAt: string | null } | null;
  _count: { verifications: number };
}

function Notes() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? 1);
  const [data, setData] = useState<Paged<NoteRow> | null>(null);
  const [search, setSearch] = useState(q);

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page), pageSize: '25', ...(q && { q }) });
    setData(null);
    adminApi<Paged<NoteRow>>(`/notes?${qs}`).then(setData).catch(() => {});
  }, [q, page]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const go = (next: Record<string, string>) => {
    const qs = new URLSearchParams({ ...(q && { q }), ...next });
    for (const [k, v] of [...qs]) if (!v) qs.delete(k);
    router.push(`${pathname}?${qs}`);
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Notes</h1>
          <p className="text-sm text-muted">Every physician-signed note, newest first.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go({ q: search, page: '' });
          }}
          className="flex gap-2"
        >
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="NFW-…, REQ-… or patient" className="w-64 rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
          <button className="rounded-xl bg-green px-4 py-2 text-sm font-semibold text-white">Search</button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <tr>
              {['Note ID', 'Patient', 'Covers', 'Signed by', 'License', 'Entity', 'Status', 'Issued', 'Turnaround', 'Verified'].map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!data && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-muted">
                  Loading…
                </td>
              </tr>
            )}
            {data?.rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-muted">
                  {q ? 'No notes match.' : 'No notes have been issued yet.'}
                </td>
              </tr>
            )}
            {data?.rows.map((n) => {
              const mins = minutesBetween(n.intake?.submittedAt, n.issuedAt);
              return (
                <tr key={n.id} className="hover:bg-cream">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                    {n.intakeId ? (
                      <Link href={`/admin/requests/${n.intakeId}`} className="text-green hover:underline">
                        {n.noteId}
                      </Link>
                    ) : (
                      n.noteId
                    )}
                    {n.legacy && <span className="ml-1.5 rounded bg-cream px-1 text-[10px] font-semibold text-muted">LEGACY</span>}
                  </td>
                  <td className="px-4 py-3">{n.patientDisplayName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    {fmtDate(n.absenceStart)}
                    {n.absenceEnd !== n.absenceStart && ` → ${fmtDate(n.absenceEnd)}`}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    Dr. {n.physician.displayName}, {n.physician.degree}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                    {n.license.stateCode} {n.license.number}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">{ENTITY_LABEL[n.issuingEntity]}</td>
                  <td className="px-4 py-3">
                    <Badge value={n.status} label={n.status.toLowerCase()} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{fmtDateTime(n.issuedAt)}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-xs ${mins !== null && mins > 60 ? 'font-semibold text-danger' : ''}`}>{mins === null ? '—' : `${mins} min`}</td>
                  <td className="px-4 py-3 text-xs text-muted">{n._count.verifications}×</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>
            {data.total} note{data.total === 1 ? '' : 's'}
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

export default function NotesPage() {
  return (
    <StaffShell area="admin">
      <Suspense>
        <Notes />
      </Suspense>
    </StaffShell>
  );
}
