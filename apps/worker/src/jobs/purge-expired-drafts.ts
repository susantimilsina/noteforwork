import type { PrismaClient } from '@nfw/db';

/**
 * "No PHI before intent": intakes that never reached payment are deleted once they expire.
 * Consent and screening rows cascade. Only a PHI-free audit event is kept.
 *
 * TODO(counsel): confirm whether SCREEN_BLOCKED screenings must be retained as medical records.
 */
export const PURGEABLE_STATUSES = ['DRAFT', 'SCREEN_PASSED', 'SCREEN_BLOCKED', 'DETAILS_COMPLETE'] as const;

export async function purgeExpiredDrafts(prisma: PrismaClient, now = new Date()) {
  const expired = await prisma.intake.findMany({
    where: {
      status: { in: [...PURGEABLE_STATUSES] },
      submittedAt: null,
      payment: null,
      expiresAt: { lt: now },
    },
    select: { id: true, status: true },
    take: 500,
  });
  if (expired.length === 0) return 0;

  await prisma.$transaction([
    prisma.auditEvent.createMany({
      data: expired.map((i) => ({
        actorType: 'SYSTEM',
        action: 'intake.purged',
        entity: 'Intake',
        entityId: i.id,
        meta: { previousStatus: i.status, reason: 'draft_expired' },
      })),
    }),
    prisma.intake.deleteMany({ where: { id: { in: expired.map((i) => i.id) } } }),
  ]);
  return expired.length;
}
