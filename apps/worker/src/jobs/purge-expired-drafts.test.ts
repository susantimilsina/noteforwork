/** Runs against the local docker Postgres (see README). */
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { config } from 'dotenv';
import { afterAll, describe, expect, it } from 'vitest';
import { createPrismaClient } from '@nfw/db';
import { purgeExpiredDrafts } from './purge-expired-drafts';

config({ path: path.resolve(__dirname, '../../../../.env'), quiet: true });
const prisma = createPrismaClient();
afterAll(() => prisma.$disconnect());

const make = (expiresAt: Date, status: 'DRAFT' | 'IN_QUEUE' = 'DRAFT', submittedAt: Date | null = null) =>
  prisma.intake.create({
    data: {
      publicRef: `TEST-${randomBytes(4).toString('hex')}`,
      accessTokenHash: randomBytes(16).toString('hex'),
      stateCode: 'CA',
      locationAttestedAt: new Date(),
      status,
      submittedAt,
      expiresAt,
      consent: { create: { documentKey: 'telehealth-consent', documentVersion: 'test', ipAddress: '127.0.0.1', userAgent: 'vitest' } },
    },
  });

describe('purgeExpiredDrafts', () => {
  it('deletes expired unpaid drafts (with their consent) and keeps everything else', async () => {
    const past = new Date(Date.now() - 60_000);
    const future = new Date(Date.now() + 3_600_000);
    const expired = await make(past);
    const fresh = await make(future);
    const paid = await make(past, 'IN_QUEUE', new Date());

    await purgeExpiredDrafts(prisma);

    expect(await prisma.intake.findUnique({ where: { id: expired.id } })).toBeNull();
    expect(await prisma.consentRecord.findUnique({ where: { intakeId: expired.id } })).toBeNull();
    expect(await prisma.intake.findUnique({ where: { id: fresh.id } })).not.toBeNull();
    expect(await prisma.intake.findUnique({ where: { id: paid.id } })).not.toBeNull();
    expect(await prisma.auditEvent.findFirst({ where: { entityId: expired.id, action: 'intake.purged' } })).not.toBeNull();

    await prisma.intake.deleteMany({ where: { id: { in: [fresh.id, paid.id] } } });
  });
});
