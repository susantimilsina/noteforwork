import { QUESTION_IDS, type QuestionId } from '@nfw/screening';

/** Shared formatting + status badges for the admin panel. */
export const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SCREEN_BLOCKED: 'Screened out',
  SCREEN_PASSED: 'Screened in',
  DETAILS_COMPLETE: 'Details done',
  PAYMENT_AUTHORIZED: 'Paid (authorized)',
  IN_QUEUE: 'In queue',
  IN_REVIEW: 'In review',
  APPROVED: 'Approved',
  NOTE_ISSUED: 'Note issued',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
};

const TONE: Record<string, string> = {
  NOTE_ISSUED: 'bg-green-light text-green border-green/20',
  APPROVED: 'bg-green-light text-green border-green/20',
  IN_QUEUE: 'bg-[#e8f0fe] text-[#1d4ed8] border-[#1d4ed8]/20',
  IN_REVIEW: 'bg-[#e8f0fe] text-[#1d4ed8] border-[#1d4ed8]/20',
  PAYMENT_AUTHORIZED: 'bg-[#e8f0fe] text-[#1d4ed8] border-[#1d4ed8]/20',
  DECLINED: 'bg-warn-light text-warn border-warn/20',
  SCREEN_BLOCKED: 'bg-danger-light text-danger border-danger/20',
  VALID: 'bg-green-light text-green border-green/20',
  CORRECTED: 'bg-warn-light text-warn border-warn/20',
  REVOKED: 'bg-danger-light text-danger border-danger/20',
};

export function Badge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TONE[value] ?? 'border-border bg-cream text-muted'}`}>
      {label ?? STATUS_LABEL[value] ?? value}
    </span>
  );
}

export const fmtDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '—';

export const minutesBetween = (a?: string | null, b?: string | null) =>
  a && b ? Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60_000) : null;

export const ENTITY_LABEL: Record<string, string> = { NOTEFORWORK: 'NoteForWork', ANYDAY_MEDICAL_CLINIC: 'Anyday Medical Clinic' };


/** Screening answers in questionnaire order (Postgres jsonb does not preserve key order). */
export const orderedAnswers = (answers: unknown): [QuestionId, unknown][] => {
  const a = (answers ?? {}) as Record<string, unknown>;
  return QUESTION_IDS.filter((q) => q in a).map((q) => [q, a[q]]);
};
