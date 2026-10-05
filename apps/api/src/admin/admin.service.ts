import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { IntakeStatus, Prisma, User } from '@nfw/db';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../common/prisma.service';

export interface ListQuery {
  status?: IntakeStatus;
  q?: string;
  page: number;
  pageSize: number;
}

/** Read-only staff views. Every access to a single record's PHI is written to the audit log. */
@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async stats() {
    const [byStatus, notes, last7] = await Promise.all([
      this.prisma.client.intake.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.client.note.count(),
      this.prisma.client.note.findMany({
        where: { issuedAt: { gte: new Date(Date.now() - 7 * 86_400_000) }, intake: { submittedAt: { not: null } } },
        select: { issuedAt: true, intake: { select: { submittedAt: true } } },
      }),
    ]);
    const turnarounds = last7.map((n) => (n.issuedAt.getTime() - n.intake!.submittedAt!.getTime()) / 60_000).sort((a, b) => a - b);
    const median = turnarounds.length ? turnarounds[Math.floor(turnarounds.length / 2)]! : null;
    return {
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      notesIssued: notes,
      medianTurnaroundMinutes7d: median === null ? null : Math.round(median),
      notesLast7d: last7.length,
    };
  }

  async listIntakes(q: ListQuery) {
    const where: Prisma.IntakeWhereInput = {
      ...(q.status && { status: q.status }),
      ...(q.q && {
        OR: [
          { publicRef: { contains: q.q.toUpperCase() } },
          { note: { noteId: { contains: q.q.toUpperCase() } } },
          { patient: { email: { contains: q.q.toLowerCase() } } },
          { patient: { lastName: { contains: q.q, mode: 'insensitive' } } },
          { patient: { firstName: { contains: q.q, mode: 'insensitive' } } },
        ],
      }),
    };
    const [total, rows] = await Promise.all([
      this.prisma.client.intake.count({ where }),
      this.prisma.client.intake.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        select: {
          id: true,
          publicRef: true,
          status: true,
          stateCode: true,
          createdAt: true,
          submittedAt: true,
          slaDeadline: true,
          patient: { select: { firstName: true, lastName: true } },
          screening: { select: { outcome: true, riskLevel: true, blockReason: true } },
          consent: { select: { language: true } },
          note: { select: { noteId: true, status: true, issuedAt: true } },
        },
      }),
    ]);
    return { total, page: q.page, pageSize: q.pageSize, rows };
  }

  async intakeDetail(id: string, staff: User) {
    const intake = await this.prisma.client.intake.findUnique({
      where: { id },
      include: {
        patient: true,
        consent: true,
        screening: true,
        payment: true,
        review: { include: { physician: { select: { displayName: true, degree: true, npi: true } } } },
        note: { include: { license: { select: { stateCode: true, number: true } }, physician: { select: { displayName: true, degree: true, npi: true } } } },
      },
    });
    if (!intake) throw new NotFoundException();
    await this.audit.record({ actorType: 'ADMIN', actorId: staff.id, action: 'admin.intake.viewed', entity: 'Intake', entityId: id });
    const { accessTokenHash: _omit, ...safe } = intake;
    const history = await this.prisma.client.auditEvent.findMany({
      where: { entity: 'Intake', entityId: id },
      orderBy: { at: 'asc' },
      select: { at: true, action: true, actorType: true },
      take: 100,
    });
    return { ...safe, history: history.map((h) => ({ ...h, at: h.at.toISOString() })) };
  }

  async listNotes(q: { q?: string; page: number; pageSize: number }) {
    const where: Prisma.NoteWhereInput = q.q
      ? { OR: [{ noteId: { contains: q.q.toUpperCase() } }, { patientDisplayName: { contains: q.q, mode: 'insensitive' } }, { intake: { publicRef: { contains: q.q.toUpperCase() } } }] }
      : {};
    const [total, rows] = await Promise.all([
      this.prisma.client.note.count({ where }),
      this.prisma.client.note.findMany({
        where,
        orderBy: { issuedAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        select: {
          id: true,
          noteId: true,
          status: true,
          issuingEntity: true,
          patientDisplayName: true,
          absenceStart: true,
          absenceEnd: true,
          issuedAt: true,
          deliveredAt: true,
          legacy: true,
          intakeId: true,
          physician: { select: { displayName: true, degree: true } },
          license: { select: { stateCode: true, number: true } },
          intake: { select: { publicRef: true, submittedAt: true } },
          _count: { select: { verifications: true } },
        },
      }),
    ]);
    return { total, page: q.page, pageSize: q.pageSize, rows };
  }

  /** Live queue for oversight: everything paid but not decided, soonest deadline first. */
  async queue() {
    const now = Date.now();
    const rows = await this.prisma.client.intake.findMany({
      where: { status: { in: ['PAYMENT_AUTHORIZED', 'IN_QUEUE', 'IN_REVIEW'] } },
      orderBy: { slaDeadline: 'asc' },
      select: {
        id: true,
        publicRef: true,
        status: true,
        stateCode: true,
        submittedAt: true,
        slaDeadline: true,
        review: { select: { lockExpiresAt: true, claimedAt: true, physician: { select: { displayName: true, degree: true } } } },
      },
    });
    // States with waiting cases but no physician holding an active license there.
    const today = new Date(new Date().toISOString().slice(0, 10));
    const covered = new Set(
      (await this.prisma.client.license.findMany({ where: { expiresAt: { gte: today }, physician: { active: true } }, select: { stateCode: true } })).map((l) => l.stateCode),
    );
    return {
      uncoveredStates: [...new Set(rows.map((r) => r.stateCode))].filter((s) => !covered.has(s)),
      rows: rows.map((r) => {
        const lockActive = (r.review?.lockExpiresAt?.getTime() ?? 0) >= now;
        return {
          ...r,
          minutesLeft: r.slaDeadline ? Math.round((r.slaDeadline.getTime() - now) / 60_000) : null,
          reviewer: r.status === 'IN_REVIEW' && lockActive && r.review ? `Dr. ${r.review.physician.displayName}, ${r.review.physician.degree}` : null,
          lockExpired: r.status === 'IN_REVIEW' && !lockActive,
        };
      }),
    };
  }

  /** Physicians with license expiry warnings and workload. */
  async physicians() {
    const today = Date.now();
    const since30 = new Date(today - 30 * 86_400_000);
    const list = await this.prisma.client.physician.findMany({
      orderBy: { displayName: 'asc' },
      include: {
        user: { select: { email: true, lastLoginAt: true, disabled: true } },
        licenses: { orderBy: { stateCode: 'asc' } },
        _count: { select: { notes: true } },
      },
    });
    const recent = await this.prisma.client.note.groupBy({ by: ['physicianId'], where: { issuedAt: { gte: since30 } }, _count: { _all: true } });
    const declined = await this.prisma.client.review.groupBy({ by: ['physicianId'], where: { decision: 'DECLINED', decidedAt: { gte: since30 } }, _count: { _all: true } });
    const count = (rows: { physicianId: string; _count: { _all: number } }[], id: string) => rows.find((r) => r.physicianId === id)?._count._all ?? 0;
    return list.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      degree: p.degree,
      npi: p.npi,
      active: p.active,
      email: p.user.email,
      lastLoginAt: p.user.lastLoginAt,
      notesTotal: p._count.notes,
      notes30d: count(recent, p.id),
      declined30d: count(declined, p.id),
      licenses: p.licenses.map((l) => ({
        stateCode: l.stateCode,
        number: l.number,
        expiresAt: l.expiresAt,
        daysLeft: Math.floor((l.expiresAt.getTime() - today) / 86_400_000),
      })),
    }));
  }

  /** Revoke a note (e.g. issued in error or fraud). Verification will then show it as revoked. */
  async revokeNote(noteId: string, reason: string, staff: User) {
    const note = await this.prisma.client.note.findUnique({ where: { id: noteId }, select: { id: true, status: true, intakeId: true, noteId: true } });
    if (!note) throw new NotFoundException();
    if (note.status === 'REVOKED') throw new ConflictException({ code: 'ALREADY_REVOKED', message: 'This note is already revoked.' });
    await this.prisma.client.note.update({ where: { id: noteId }, data: { status: 'REVOKED', revokedAt: new Date(), revokedReason: reason } });
    await this.audit.record({
      actorType: 'ADMIN',
      actorId: staff.id,
      action: 'note.revoked',
      entity: 'Intake',
      entityId: note.intakeId ?? note.id,
      meta: { noteId: note.noteId, reason },
    });
  }
}
