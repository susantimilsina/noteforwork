'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QUESTIONS_EN, type QuestionId } from '@nfw/screening';
import { orderedAnswers } from '../../../../../staff/format';
import { physicianApi } from '../../../../../staff/api';
import { fmtDate, fmtDateTime } from '../../../../../staff/format';
import { StaffShell } from '../../../../../staff/shell';
import { Deadline, minutesUntil, useNow } from '../../../../../staff/time';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Case = Record<string, any>;

const DECLINE_LABEL: Record<string, string> = {
  NEEDS_IN_PERSON_CARE: 'Needs in-person evaluation',
  SYMPTOMS_NOT_CONSISTENT: 'Symptoms not consistent with an excused absence',
  DURATION_TOO_LONG: 'Requested duration not supported',
  INSUFFICIENT_INFORMATION: 'Not enough information to decide',
  OTHER: 'Other',
};

const ageOn = (dob: string) => {
  const d = new Date(dob);
  const n = new Date();
  return n.getUTCFullYear() - d.getUTCFullYear() - (n.getUTCMonth() < d.getUTCMonth() || (n.getUTCMonth() === d.getUTCMonth() && n.getUTCDate() < d.getUTCDate()) ? 1 : 0);
};

/** Answers with the option's risk tag, so flagged answers stand out to the reviewer. */
function Answer({ q, v }: { q: QuestionId; v: unknown }) {
  const content = QUESTIONS_EN[q];
  const values = Array.isArray(v) ? (v as string[]) : [v as string];
  const opts = values.map((x) => content?.options.find((o) => o.value === x)).filter(Boolean) as { label: string; tag?: string }[];
  const flagged = opts.some((o) => o.tag);
  return (
    <div className={`flex justify-between gap-4 px-4 py-2 ${flagged ? 'bg-warn-light/60' : ''}`}>
      <dt className="text-muted">{content?.title ?? q}</dt>
      <dd className="text-right">
        {Array.isArray(v) && v.length === 0 ? 'None' : opts.map((o) => o.label).join('; ')}
        {flagged && <span className="ml-2 text-[10px] font-semibold uppercase text-warn">flag</span>}
      </dd>
    </div>
  );
}

function Review({ id }: { id: string }) {
  const router = useRouter();
  const now = useNow(10_000);
  const [c, setC] = useState<Case | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'idle' | 'approve' | 'decline'>('idle');
  const [attested, setAttested] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ kind: 'approved'; noteId: string; withinSla: boolean } | { kind: 'declined' } | null>(null);

  useEffect(() => {
    physicianApi<Case>(`/cases/${id}`).then(setC).catch((e) => setError(e.message));
  }, [id]);

  /** POST an action; returns ok=false (and shows the server's message) on failure. */
  async function act(path: string, body?: unknown): Promise<{ ok: boolean; data?: any }> {
    setBusy(true);
    setError(null);
    try {
      return { ok: true, data: await physicianApi<any>(`/cases/${id}/${path}`, { method: 'POST', body }) };
    } catch (e) {
      setError((e as Error).message);
      return { ok: false };
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    const res = await act('approve', { attestation: true });
    if (res.ok) setDone({ kind: 'approved', noteId: res.data.noteId, withinSla: res.data.withinSla });
  }
  async function decline() {
    const res = await act('decline', { reason, ...(message.trim() && { message: message.trim() }) });
    if (res.ok) setDone({ kind: 'declined' });
  }
  async function release() {
    if ((await act('release')).ok) router.push('/physician');
  }

  if (error && !c) return <p className="text-danger">{error}</p>;
  if (!c) return <p className="text-sm text-muted">Loading…</p>;

  if (done) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-surface p-8 text-center">
        {done.kind === 'approved' ? (
          <>
            <p className="font-display text-3xl">Note signed</p>
            <p className="mt-3 font-mono text-lg">{done.noteId}</p>
            <p className="mt-2 text-sm text-muted">
              {done.withinSla ? 'Issued within the 60-minute guarantee; the patient will be charged.' : 'Issued after the 60-minute deadline; the patient will not be charged.'}
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-3xl">Request declined</p>
            <p className="mt-2 text-sm text-muted">The patient will not be charged and will be told to seek in-person care.</p>
          </>
        )}
        <Link href="/physician" className="mt-6 inline-block rounded-xl bg-green px-5 py-2.5 font-semibold text-white">
          Back to queue
        </Link>
      </div>
    );
  }

  const lockLeft = c.review?.lockExpiresAt ? minutesUntil(c.review.lockExpiresAt, now) : null;
  const canAct = c.claimedByMe && (lockLeft ?? 0) >= 0;
  const p = c.patient;

  return (
    <>
      <Link href="/physician" className="text-sm text-muted hover:text-ink">
        ← Queue
      </Link>
      <div className="mb-5 mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl">{c.publicRef}</h1>
        <Deadline iso={c.slaDeadline} now={now} />
        {canAct ? (
          <span className="text-xs text-muted">Your claim: {lockLeft} min left</span>
        ) : (
          <span className="rounded-full bg-warn-light px-2 py-0.5 text-xs font-semibold text-warn">{c.status === 'IN_REVIEW' ? 'Claim expired — claim again from the queue' : `Status: ${c.status}`}</span>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Patient</h2>
            {p ? (
              <dl className="grid grid-cols-[120px_1fr] gap-y-1.5 text-sm">
                <dt className="text-muted">Name</dt>
                <dd className="font-semibold">
                  {p.firstName} {p.lastName}
                </dd>
                <dt className="text-muted">Date of birth</dt>
                <dd>
                  {fmtDate(p.dob)} (age {ageOn(p.dob)})
                </dd>
                <dt className="text-muted">Located in</dt>
                <dd>{c.stateCode} (patient attested)</dd>
                <dt className="text-muted">Consent</dt>
                <dd>
                  v{c.consent?.documentVersion} · {c.consent?.language === 'es' ? 'Spanish' : 'English'}
                </dd>
              </dl>
            ) : (
              <p className="text-sm text-muted">No patient details.</p>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-surface">
            <h2 className="flex items-center justify-between px-5 pb-2 pt-5 text-xs font-semibold uppercase tracking-wide text-muted">
              Screening answers
              {c.screening && (
                <span className={c.screening.riskLevel === 'MEDIUM' ? 'text-warn' : ''}>
                  {c.screening.riskLevel.toLowerCase()} risk · score {c.screening.riskScore}
                </span>
              )}
            </h2>
            <dl className="divide-y divide-border border-t border-border pb-1 text-sm">
              {c.screening && orderedAnswers(c.screening.answers).map(([q, v]) => <Answer key={q} q={q} v={v} />)}
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Request</h2>
            <dl className="grid grid-cols-[120px_1fr] gap-y-1.5 text-sm">
              <dt className="text-muted">Absence</dt>
              <dd className="font-semibold">
                {fmtDate(c.absenceStart)}
                {c.absenceEnd !== c.absenceStart && ` → ${fmtDate(c.absenceEnd)}`}
              </dd>
              <dt className="text-muted">Patient notes</dt>
              <dd>{c.patientNotes ?? <span className="text-muted">None</span>}</dd>
              <dt className="text-muted">Submitted</dt>
              <dd>{fmtDateTime(c.submittedAt)}</dd>
              <dt className="text-muted">Last 30 days</dt>
              <dd>
                {c.priorNotes.length ? (
                  <>
                    {c.priorNotes.length} prior note(s), {c.priorDays} day(s):{' '}
                    {c.priorNotes.map((n: any) => `${fmtDate(n.absenceStart)}`).join(', ')}
                  </>
                ) : (
                  <span className="text-muted">No prior notes</span>
                )}
              </dd>
            </dl>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {error && <p className="rounded-xl bg-danger-light px-4 py-2 text-sm text-danger">{error}</p>}
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">Your decision</h2>
            {mode !== 'decline' && (
              <>
                <label className="flex items-start gap-3 rounded-xl border border-border bg-cream p-3 text-sm">
                  <input type="checkbox" disabled={!canAct} checked={attested} onChange={(e) => { setAttested(e.target.checked); setMode('approve'); }} className="mt-1 size-4 accent-green" />
                  <span>{c.attestationText}</span>
                </label>
                <button type="button" disabled={!canAct || !attested || busy} onClick={approve} className="mt-3 w-full rounded-xl bg-green px-4 py-3 font-semibold text-white disabled:opacity-40">
                  {busy && mode === 'approve' ? 'Signing…' : 'Approve & sign note'}
                </button>
              </>
            )}
            {mode === 'decline' ? (
              <div className="space-y-3">
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold">Reason</span>
                  <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2">
                    <option value="">Choose a reason…</option>
                    {c.declineReasons.map((r: string) => (
                      <option key={r} value={r}>
                        {DECLINE_LABEL[r] ?? r}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold">Message to patient (optional)</span>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={3} className="w-full rounded-xl border border-border px-3 py-2" />
                </label>
                <button type="button" disabled={!canAct || !reason || busy} onClick={decline} className="w-full rounded-xl bg-danger px-4 py-3 font-semibold text-white disabled:opacity-40">
                  {busy ? 'Declining…' : 'Decline request'}
                </button>
                <button type="button" onClick={() => setMode('idle')} className="w-full text-sm text-muted hover:text-ink">
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" disabled={!canAct} onClick={() => { setMode('decline'); setAttested(false); }} className="mt-2 w-full rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger-light disabled:opacity-40">
                Decline…
              </button>
            )}
          </section>
          {canAct && (
            <button type="button" onClick={release} disabled={busy} className="w-full text-sm text-muted hover:text-ink">
              Release back to queue
            </button>
          )}
          <p className="text-xs text-muted">Patients are never charged for declined requests. Notes never include symptoms or diagnoses.</p>
        </aside>
      </div>
    </>
  );
}

export default function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <StaffShell area="physician">
      <Review id={id} />
    </StaffShell>
  );
}
