'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { physicianApi } from '../../../staff/api';
import { fmtDate } from '../../../staff/format';
import { StaffShell } from '../../../staff/shell';
import { Deadline, useNow } from '../../../staff/time';

interface Row {
  id: string;
  publicRef: string;
  stateCode: string;
  initials: string;
  ageGroup: string | null;
  riskLevel: string | null;
  absenceStart: string | null;
  absenceEnd: string | null;
  hasPatientNotes: boolean;
  slaDeadline: string | null;
  claimedByMe: boolean;
  lockMinutesLeft: number | null;
}
interface Queue {
  licensedStates: string[];
  claimMinutes: number;
  rows: Row[];
}

const AGE: Record<string, string> = { age_18_65: '18–65', age_7_17: '7–17', age_65_plus: '65+', age_under_7: '≤6' };

function QueueView() {
  const router = useRouter();
  const now = useNow();
  const [q, setQ] = useState<Queue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => physicianApi<Queue>('/queue').then(setQ).catch((e) => setError(e.message)), []);
  useEffect(() => {
    load();
    const t = setInterval(load, 20_000); // new cases appear without reloading
    return () => clearInterval(t);
  }, [load]);

  async function claim(id: string) {
    setBusy(id);
    setError(null);
    try {
      await physicianApi(`/cases/${id}/claim`, { method: 'POST' });
      router.push(`/physician/cases/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
      load();
    }
  }

  const mine = q?.rows.filter((r) => r.claimedByMe) ?? [];
  const open = q?.rows.filter((r) => !r.claimedByMe) ?? [];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Review queue</h1>
          <p className="text-sm text-muted">
            Cases from states where you hold an active license{q ? `: ${q.licensedStates.join(', ') || 'none'}` : ''}. Soonest deadline first.
          </p>
        </div>
        <p className="text-xs text-muted">Refreshes automatically</p>
      </div>
      {error && <p className="mb-4 rounded-xl bg-danger-light px-4 py-2 text-sm text-danger">{error}</p>}

      {mine.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">In review by you</h2>
          <ul className="space-y-2">
            {mine.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-4 rounded-2xl border-2 border-green bg-surface px-5 py-4">
                <span className="font-mono text-sm">{r.publicRef}</span>
                <Deadline iso={r.slaDeadline} now={now} />
                <span className="text-xs text-muted">Your claim: {r.lockMinutesLeft} min left</span>
                <button type="button" onClick={() => router.push(`/physician/cases/${r.id}`)} className="ml-auto rounded-xl bg-green px-4 py-2 text-sm font-semibold text-white">
                  Continue review →
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Waiting ({open.length})</h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <tr>
                {['Deadline', 'Request', 'Patient', 'State', 'Age', 'Risk', 'Absence', ''].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!q && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              )}
              {q && open.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted">
                    No cases waiting. New cases appear here automatically.
                  </td>
                </tr>
              )}
              {open.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <Deadline iso={r.slaDeadline} now={now} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.publicRef}</td>
                  <td className="px-4 py-3">
                    {r.initials}
                    {r.hasPatientNotes && <span className="ml-2 rounded bg-cream px-1 text-[10px] text-muted">has notes</span>}
                  </td>
                  <td className="px-4 py-3">{r.stateCode}</td>
                  <td className="px-4 py-3">{r.ageGroup ? AGE[r.ageGroup] : '—'}</td>
                  <td className="px-4 py-3 text-xs">{r.riskLevel ? <span className={r.riskLevel === 'MEDIUM' ? 'font-semibold text-warn' : 'text-muted'}>{r.riskLevel.toLowerCase()}</span> : '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    {fmtDate(r.absenceStart)}
                    {r.absenceEnd && r.absenceEnd !== r.absenceStart && ` → ${fmtDate(r.absenceEnd)}`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" disabled={busy === r.id} onClick={() => claim(r.id)} className="rounded-xl bg-green px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
                      {busy === r.id ? 'Claiming…' : 'Claim & review'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {q && <p className="mt-3 text-xs text-muted">Claiming holds a case for you for {q.claimMinutes} minutes; after that it returns to the queue.</p>}
      </section>
    </>
  );
}

export default function PhysicianHome() {
  return (
    <StaffShell area="physician">
      <QueueView />
    </StaffShell>
  );
}
