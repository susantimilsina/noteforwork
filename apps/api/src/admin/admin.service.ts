import { Injectable, NotFoundException } from '@nestjs/common';
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
}
