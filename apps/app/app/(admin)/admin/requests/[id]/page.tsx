'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { QUESTIONS_EN, type QuestionId } from '@nfw/screening';
import { adminApi } from '../../../../../admin/api';
import { Badge, ENTITY_LABEL, fmtDate, fmtDateTime, minutesBetween } from '../../../../../admin/format';
import { AdminShell } from '../../../../../admin/shell';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Detail = Record<string, any>;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </section>
  );
}

function Fields({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(110px,auto)_1fr] gap-x-4 gap-y-1.5 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd>{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

function answerText(q: QuestionId, v: unknown) {
  const opts = QUESTIONS_EN[q]?.options ?? [];
  if (Array.isArray(v)) return v.length ? v.map((x) => opts.find((o) => o.value === x)?.label ?? x).join('; ') : 'None';
  return opts.find((o) => o.value === v)?.label ?? String(v);
}

export default function RequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi<Detail>(`/intakes/${id}`).then(setD).catch((e) => setError(e.status === 404 ? 'Request not found.' : 'Could not load this request.'));
  }, [id]);

  return (
    <AdminShell>
      <Link href="/admin/requests" className="text-sm text-muted hover:text-ink">
        ← All requests
      </Link>
      {error && <p className="mt-6 text-danger">{error}</p>}
      {!d && !error && <p className="mt-6 text-sm text-muted">Loading…</p>}
      {d && (
        <>
          <div className="mb-6 mt-3 flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl">{d.publicRef}</h1>
            <Badge value={d.status} />
            {d.note && <Badge value={d.note.status} label={`Note ${d.note.status.toLowerCase()}`} />}
          </div>
          <p className="mb-6 rounded-xl border border-warn/30 bg-warn-light px-4 py-2 text-xs text-warn">
            This page contains protected health information. Your access has been recorded.
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Patient">
              {d.patient ? (
                <Fields
                  rows={[
                    ['Name', `${d.patient.firstName} ${d.patient.lastName}`],
                    ['Email', d.patient.email],
                    ['Phone', d.patient.phone],
                    ['Date of birth', fmtDate(d.patient.dob)],
                  ]}
                />
              ) : (
                <p className="text-sm text-muted">No patient details yet (anonymous draft).</p>
              )}
            </Section>

            <Section title="Request">
              <Fields
                rows={[
                  ['Location', `${d.stateCode} (attested ${fmtDateTime(d.locationAttestedAt)})`],
                  ['Absence', d.absenceStart ? `${fmtDate(d.absenceStart)} → ${fmtDate(d.absenceEnd)}` : null],
                  ['Created', fmtDateTime(d.createdAt)],
                  ['Paid / submitted', fmtDateTime(d.submittedAt)],
                  ['60-min deadline', fmtDateTime(d.slaDeadline)],
                  ['Patient notes', d.patientNotes],
                ]}
              />
            </Section>

            <Section title="Consent">
              {d.consent ? (
                <Fields
                  rows={[
                    ['Document', `${d.consent.documentKey} v${d.consent.documentVersion}`],
                    ['Language', d.consent.language === 'es' ? 'Spanish' : 'English'],
                    ['Accepted', fmtDateTime(d.consent.acceptedAt)],
                    ['IP address', <span key="ip" className="font-mono text-xs">{d.consent.ipAddress}</span>],
                  ]}
                />
              ) : (
                <p className="text-sm text-muted">Not accepted yet.</p>
              )}
            </Section>

            <Section title="Payment">
              {d.payment ? (
                <Fields
                  rows={[
                    ['Status', <Badge key="s" value={d.payment.status} label={d.payment.status.toLowerCase()} />],
                    ['Amount', `$${(d.payment.amountCents / 100).toFixed(2)} ${d.payment.currency.toUpperCase()}`],
                    ['Stripe', <span key="pi" className="font-mono text-xs">{d.payment.stripePaymentIntentId}</span>],
                    ['Captured', fmtDateTime(d.payment.capturedAt)],
                    ['Voided', fmtDateTime(d.payment.voidedAt)],
                  ]}
                />
              ) : (
                <p className="text-sm text-muted">No payment.</p>
              )}
            </Section>

            <Section title="Screening">
              {d.screening ? (
                <>
                  <Fields
                    rows={[
                      ['Outcome', d.screening.outcome === 'BLOCKED' ? `Blocked — ${d.screening.blockReason}` : 'Eligible'],
                      ['Risk', `${d.screening.riskLevel.toLowerCase()} (score ${d.screening.riskScore})`],
                      ['Ruleset', d.screening.rulesetVersion],
                    ]}
                  />
                  <dl className="mt-4 divide-y divide-border border-t border-border text-sm">
                    {Object.entries(d.screening.answers as Record<string, unknown>).map(([q, v]) => (
                      <div key={q} className="flex justify-between gap-4 py-1.5">
                        <dt className="text-muted">{QUESTIONS_EN[q as QuestionId]?.title ?? q}</dt>
                        <dd className="text-right">{answerText(q as QuestionId, v)}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <p className="text-sm text-muted">Not screened yet.</p>
              )}
            </Section>

            <Section title="Physician review">
              {d.review ? (
                <Fields
                  rows={[
                    ['Physician', `Dr. ${d.review.physician.displayName}, ${d.review.physician.degree} (NPI ${d.review.physician.npi})`],
                    ['Claimed', fmtDateTime(d.review.claimedAt)],
                    ['Decision', d.review.decision ? `${d.review.decision.toLowerCase()}${d.review.declineReason ? ` — ${d.review.declineReason}` : ''}` : 'Pending'],
                    ['Decided', fmtDateTime(d.review.decidedAt)],
                  ]}
                />
              ) : (
                <p className="text-sm text-muted">Not reviewed yet.</p>
              )}
            </Section>

            <Section title="Note">
              {d.note ? (
                <Fields
                  rows={[
                    ['Note ID', <span key="n" className="font-mono">{d.note.noteId}</span>],
                    ['Shown to verifiers as', d.note.patientDisplayName],
                    ['Covers', `${fmtDate(d.note.absenceStart)} → ${fmtDate(d.note.absenceEnd)}`],
                    ['Signed by', `Dr. ${d.note.physician.displayName}, ${d.note.physician.degree}`],
                    ['License', `${d.note.license.stateCode} ${d.note.license.number}`],
                    ['Issuing entity', ENTITY_LABEL[d.note.issuingEntity]],
                    ['Issued', `${fmtDateTime(d.note.issuedAt)} (${minutesBetween(d.submittedAt, d.note.issuedAt)} min after payment)`],
                    ['Delivered', fmtDateTime(d.note.deliveredAt)],
                  ]}
                />
              ) : (
                <p className="text-sm text-muted">No note issued.</p>
              )}
            </Section>

            <Section title="Audit trail">
              {d.history.length ? (
                <ol className="space-y-1.5 text-sm">
                  {d.history.map((h: { at: string; action: string; actorType: string }, i: number) => (
                    <li key={i} className="flex justify-between gap-4">
                      <span className="font-mono text-xs">{h.action}</span>
                      <span className="whitespace-nowrap text-xs text-muted">
                        {h.actorType.toLowerCase()} · {fmtDateTime(h.at)}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted">No events.</p>
              )}
            </Section>
          </div>
        </>
      )}
    </AdminShell>
  );
}
