import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, User } from '@nfw/db';
import { ABSENCE_RULES } from '@nfw/schemas';
import { AuditService } from '../common/audit.service';
import { newNoteId } from '../common/crypto';
import { PrismaService } from '../common/prisma.service';

export const CLAIM_MINUTES = 10;
export const ATTESTATION_V1 =
  'I have personally reviewed this patient’s intake, made an independent clinical determination that the patient was unable to work or attend school on the dates listed, and I am licensed to practice medicine in the patient’s state. (attestation v1)';

export const DECLINE_REASONS = [
  'NEEDS_IN_PERSON_CARE',
  'SYMPTOMS_NOT_CONSISTENT',
  'DURATION_TOO_LONG',
  'INSUFFICIENT_INFORMATION',
  'OTHER',
] as const;
export type DeclineReason = (typeof DECLINE_REASONS)[number];

const minutesFrom = (d: Date | null | undefined, now: number) => (d ? Math.round((d.getTime() - now) / 60_000) : null);
const DAY = 86_400_000;
const dayCount = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY) + 1;

/**
 * The only place a note can be created. Every rule is enforced on the server inside a transaction:
 * licensed state, active claim, eligible screening, attestation, absence limits, payment settlement.
 */
@Injectable()
export class PhysicianService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async physicianFor(user: User) {
    const physician = await this.prisma.client.physician.findUnique({ where: { userId: user.id }, include: { licenses: true } });
    if (!physician?.active) throw new ForbiddenException({ code: 'NO_PHYSICIAN_PROFILE', message: 'No active physician profile for this account.' });
    const today = new Date(new Date().toISOString().slice(0, 10));
    const licenses = physician.licenses.filter((l) => l.expiresAt >= today);
    return { physician, licenses, states: licenses.map((l) => l.stateCode) };
  }

  /** Cases this physician may work: unclaimed (or abandoned) cases in licensed states, plus their own active claims. */
  async queue(user: User) {
    const { physician, states } = await this.physicianFor(user);
    const now = new Date();
    const rows = await this.prisma.client.intake.findMany({
      where: {
        stateCode: { in: states },
        OR: [
          { status: 'IN_QUEUE' },
          { status: 'IN_REVIEW', review: { lockExpiresAt: { lt: now } } },
          { status: 'IN_REVIEW', review: { lockExpiresAt: null } }, // no lock recorded = abandoned
          { status: 'IN_REVIEW', review: { physicianId: physician.id } },
        ],
      },
      orderBy: { slaDeadline: 'asc' },
      select: {
        id: true,
        publicRef: true,
        status: true,
        stateCode: true,
        submittedAt: true,
        slaDeadline: true,
        absenceStart: true,
        absenceEnd: true,
        patientNotes: true,
        patient: { select: { firstName: true, lastName: true } },
        screening: { select: { riskLevel: true, answers: true } },
        review: { select: { physicianId: true, lockExpiresAt: true } },
      },
    });
    const t = now.getTime();
    return {
      licensedStates: states,
      claimMinutes: CLAIM_MINUTES,
      rows: rows.map((r) => {
        const mine = r.status === 'IN_REVIEW' && r.review?.physicianId === physician.id && (r.review.lockExpiresAt?.getTime() ?? 0) >= t;
        return {
          id: r.id,
          publicRef: r.publicRef,
          stateCode: r.stateCode,
          initials: r.patient ? `${r.patient.firstName[0]}. ${r.patient.lastName[0]}.` : '—',
          ageGroup: (r.screening?.answers as { ageGroup?: string } | null)?.ageGroup ?? null,
          riskLevel: r.screening?.riskLevel ?? null,
          absenceStart: r.absenceStart,
          absenceEnd: r.absenceEnd,
          hasPatientNotes: !!r.patientNotes,
          submittedAt: r.submittedAt,
          slaDeadline: r.slaDeadline,
          minutesLeft: minutesFrom(r.slaDeadline, t),
          claimedByMe: mine,
          lockMinutesLeft: mine ? minutesFrom(r.review!.lockExpiresAt, t) : null,
        };
      }),
    };
  }

  /** Atomically claim a case for CLAIM_MINUTES. Fails if another physician holds an active claim. */
  async claim(user: User, intakeId: string) {
    const { physician, states } = await this.physicianFor(user);
    const now = new Date();
    const lockExpiresAt = new Date(now.getTime() + CLAIM_MINUTES * 60_000);
    await this.prisma.client.$transaction(async (tx) => {
      const intake = await tx.intake.findUnique({ where: { id: intakeId }, select: { stateCode: true } });
      if (!intake) throw new NotFoundException();
      if (!states.includes(intake.stateCode)) throw new ForbiddenException({ code: 'NOT_LICENSED_IN_STATE', message: `You are not licensed in ${intake.stateCode}.` });
      // Conditional update = the lock. Concurrent claims re-check this WHERE after the first commits.
      const { count } = await tx.intake.updateMany({
        where: {
          id: intakeId,
          OR: [
            { status: 'IN_QUEUE' },
            { status: 'IN_REVIEW', review: { lockExpiresAt: { lt: now } } },
          { status: 'IN_REVIEW', review: { lockExpiresAt: null } }, // no lock recorded = abandoned
            { status: 'IN_REVIEW', review: { physicianId: physician.id } },
          ],
        },
        data: { status: 'IN_REVIEW' },
      });
      if (count === 0) throw new ConflictException({ code: 'ALREADY_CLAIMED', message: 'Another physician is reviewing this case.' });
      await tx.review.upsert({
        where: { intakeId },
        create: { intakeId, physicianId: physician.id, claimedAt: now, lockExpiresAt },
        update: { physicianId: physician.id, claimedAt: now, lockExpiresAt },
      });
    });
    await this.audit.record({ actorType: 'PHYSICIAN', actorId: user.id, action: 'case.claimed', entity: 'Intake', entityId: intakeId, meta: { physicianId: physician.id } });
    return { lockExpiresAt };
  }

  async release(user: User, intakeId: string) {
    const { physician } = await this.physicianFor(user);
    const { count } = await this.prisma.client.intake.updateMany({
      where: { id: intakeId, status: 'IN_REVIEW', review: { physicianId: physician.id } },
      data: { status: 'IN_QUEUE' },
    });
    if (count) {
      await this.prisma.client.review.update({ where: { intakeId }, data: { lockExpiresAt: new Date() } });
      await this.audit.record({ actorType: 'PHYSICIAN', actorId: user.id, action: 'case.released', entity: 'Intake', entityId: intakeId });
    }
  }

  /** Full case for the physician holding the claim (or who decided it). Logged as PHI access. */
  async detail(user: User, intakeId: string) {
    const { physician } = await this.physicianFor(user);
    const intake = await this.prisma.client.intake.findUnique({
      where: { id: intakeId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, dob: true } },
        screening: true,
        consent: { select: { language: true, documentVersion: true, acceptedAt: true } },
        review: true,
        note: { select: { noteId: true, status: true, issuedAt: true } },
      },
    });
    if (!intake) throw new NotFoundException();
    if (intake.review?.physicianId !== physician.id) throw new ForbiddenException({ code: 'NOT_YOUR_CASE', message: 'Claim this case before opening it.' });

    const priorNotes = intake.patient
      ? await this.prisma.client.note.findMany({
          where: { intake: { patientId: intake.patient.id }, issuedAt: { gte: new Date(Date.now() - 30 * DAY) }, status: { not: 'REVOKED' }, NOT: { intakeId } },
          select: { noteId: true, absenceStart: true, absenceEnd: true, issuedAt: true },
          orderBy: { issuedAt: 'desc' },
        })
      : [];
    await this.audit.record({ actorType: 'PHYSICIAN', actorId: user.id, action: 'case.viewed', entity: 'Intake', entityId: intakeId });

    const now = Date.now();
    const { accessTokenHash: _omit, ...rest } = intake;
    return {
      ...rest,
      claimedByMe: intake.status === 'IN_REVIEW' && (intake.review?.lockExpiresAt?.getTime() ?? 0) >= now,
      lockMinutesLeft: minutesFrom(intake.review?.lockExpiresAt, now),
      minutesLeft: minutesFrom(intake.slaDeadline, now),
      priorNotes,
      priorDays: priorNotes.reduce((n, p) => n + dayCount(p.absenceStart, p.absenceEnd), 0),
      attestationText: ATTESTATION_V1,
      declineReasons: DECLINE_REASONS,
    };
  }

  /** Requires an active claim held by this physician; returns the locked case inside the transaction. */
  private async lockedCase(tx: Prisma.TransactionClient, intakeId: string, physicianId: string) {
    const intake = await tx.intake.findUnique({ where: { id: intakeId }, include: { review: true, patient: true, payment: true, screening: true } });
    if (!intake) throw new NotFoundException();
    const r = intake.review;
    if (intake.status !== 'IN_REVIEW' || r?.physicianId !== physicianId || (r.lockExpiresAt?.getTime() ?? 0) < Date.now()) {
      throw new ConflictException({ code: 'CLAIM_EXPIRED', message: 'Your claim on this case expired. Claim it again to continue.' });
    }
    return intake;
  }

  async approve(user: User, intakeId: string) {
    const { physician, licenses } = await this.physicianFor(user);
    const result = await this.prisma.client.$transaction(async (tx) => {
      const intake = await this.lockedCase(tx, intakeId, physician.id);
      if (intake.screening?.outcome !== 'ELIGIBLE') throw new ConflictException({ code: 'NOT_ELIGIBLE', message: 'Screening did not pass; this case cannot be approved.' });
      if (!intake.patient || !intake.absenceStart || !intake.absenceEnd) throw new ConflictException({ code: 'INCOMPLETE', message: 'Patient details or absence dates are missing.' });
      const license = licenses.find((l) => l.stateCode === intake.stateCode);
      if (!license) throw new ForbiddenException({ code: 'NOT_LICENSED_IN_STATE', message: `You are not licensed in ${intake.stateCode}.` });

      // Absence limits: max consecutive days, and max days per rolling 30 (across this patient's valid notes).
      const days = dayCount(intake.absenceStart, intake.absenceEnd);
      if (days > ABSENCE_RULES.maxConsecutiveDays) throw new ConflictException({ code: 'ABSENCE_TOO_LONG', message: `Notes cover at most ${ABSENCE_RULES.maxConsecutiveDays} days.` });
      const prior = await tx.note.findMany({
        where: { intake: { patientId: intake.patient.id }, issuedAt: { gte: new Date(Date.now() - 30 * DAY) }, status: { not: 'REVOKED' } },
        select: { absenceStart: true, absenceEnd: true },
      });
      const priorDays = prior.reduce((n, p) => n + dayCount(p.absenceStart, p.absenceEnd), 0);
      if (priorDays + days > ABSENCE_RULES.maxDaysPerRolling30) {
        throw new ConflictException({ code: 'ROLLING_LIMIT', message: `This patient already has ${priorDays} excused day(s) in the last 30 days (limit ${ABSENCE_RULES.maxDaysPerRolling30}).` });
      }

      const issuedAt = new Date();
      let noteId = newNoteId();
      while (await tx.note.findUnique({ where: { noteId }, select: { id: true } })) noteId = newNoteId();

      const note = await tx.note.create({
        data: {
          intakeId,
          noteId,
          issuingEntity: 'NOTEFORWORK', // TODO(policy): per-state/per-physician entity (NoteForWork vs Anyday Medical Clinic)
          physicianId: physician.id,
          licenseId: license.id,
          patientDisplayName: `${intake.patient.firstName} ${intake.patient.lastName[0]}.`,
          absenceStart: intake.absenceStart,
          absenceEnd: intake.absenceEnd,
          issuedAt,
        },
      });
      await tx.review.update({ where: { intakeId }, data: { decision: 'APPROVED', decidedAt: issuedAt, attestation: ATTESTATION_V1, lockExpiresAt: null } });
      await tx.intake.update({ where: { id: intakeId }, data: { status: 'NOTE_ISSUED' } });

      // 60-minute guarantee: capture if on time, otherwise the note is free.
      // TODO(phase 2): call Stripe capture/cancel; this records the intended outcome.
      const withinSla = !intake.slaDeadline || issuedAt <= intake.slaDeadline;
      if (intake.payment?.status === 'AUTHORIZED') {
        await tx.payment.update({
          where: { intakeId },
          data: withinSla ? { status: 'CAPTURED', capturedAt: issuedAt } : { status: 'VOIDED', voidedAt: issuedAt, refundReason: 'SLA_MISSED' },
        });
      }
      return { noteId: note.noteId, noteDbId: note.id, withinSla, licenseId: license.id };
    });

    await this.audit.record({
      actorType: 'PHYSICIAN',
      actorId: user.id,
      action: 'note.issued',
      entity: 'Intake',
      entityId: intakeId,
      meta: { noteId: result.noteId, physicianId: physician.id, licenseId: result.licenseId, withinSla: result.withinSla, attestation: 'v1' },
    });
    // TODO(phase 3): enqueue render-note-pdf (sets qrTokenHash) and deliver-note-email jobs.
    return { noteId: result.noteId, withinSla: result.withinSla };
  }

  async decline(user: User, intakeId: string, reason: DeclineReason, message?: string) {
    const { physician } = await this.physicianFor(user);
    await this.prisma.client.$transaction(async (tx) => {
      const intake = await this.lockedCase(tx, intakeId, physician.id);
      const now = new Date();
      await tx.review.update({ where: { intakeId }, data: { decision: 'DECLINED', declineReason: reason, declineMessage: message ?? null, decidedAt: now, lockExpiresAt: null } });
      await tx.intake.update({ where: { id: intakeId }, data: { status: 'DECLINED' } });
      // Declined → never charged. TODO(phase 2): cancel the Stripe PaymentIntent.
      if (intake.payment?.status === 'AUTHORIZED') await tx.payment.update({ where: { intakeId }, data: { status: 'VOIDED', voidedAt: now } });
    });
    await this.audit.record({ actorType: 'PHYSICIAN', actorId: user.id, action: 'case.declined', entity: 'Intake', entityId: intakeId, meta: { reason } });
    // TODO(phase 3): enqueue decline email (generic, "you were not charged").
  }
}
