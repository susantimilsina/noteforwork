/**
 * DEMO DATA for the local admin panel — entirely fictional (names, emails, IDs).
 * Refuses to run against anything but a local database. Re-runnable: replaces previous demo rows.
 *
 *   pnpm --filter @nfw/db seed:demo
 */
import path from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
import { config } from 'dotenv';
import { formatId } from '@nfw/schemas';
import { createPrismaClient, type IntakeStatus } from '../src/index.js';

config({ path: path.resolve(import.meta.dirname, '../../../.env'), quiet: true });

const url = process.env.DATABASE_URL ?? '';
if (process.env.NODE_ENV === 'production' || !/@(localhost|127\.0\.0\.1|postgres)(:\d+)?\//.test(url)) {
  console.error('Refusing to seed demo data: DATABASE_URL is not a local database.');
  process.exit(1);
}

const prisma = createPrismaClient(url);
const DEMO_DOMAIN = 'demo.example.com';
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const minutes = (n: number) => n * 60_000;

const FIRST = ['Avery', 'Jordan', 'Riley', 'Morgan', 'Casey', 'Taylor', 'Jamie', 'Quinn', 'Rowan', 'Skyler', 'Parker', 'Reese', 'Emerson', 'Finley', 'Hayden', 'Sawyer', 'Logan', 'Dakota'];
const LAST = ['Demo'];

type Plan = { status: IntakeStatus; state: 'CA' | 'TX'; outcome?: 'ELIGIBLE' | 'BLOCKED'; risk?: 'LOW' | 'MEDIUM'; block?: string; turnaround?: number };
const PLANS: Plan[] = [
  ...Array.from({ length: 8 }, (_, i): Plan => ({ status: 'NOTE_ISSUED', state: i % 3 ? 'CA' : 'TX', outcome: 'ELIGIBLE', risk: i % 2 ? 'LOW' : 'MEDIUM', turnaround: [4, 6, 5, 13, 7, 9, 3, 11][i] })),
  { status: 'DECLINED', state: 'CA', outcome: 'ELIGIBLE', risk: 'MEDIUM' },
  { status: 'DECLINED', state: 'TX', outcome: 'ELIGIBLE', risk: 'MEDIUM' },
  { status: 'IN_QUEUE', state: 'CA', outcome: 'ELIGIBLE', risk: 'LOW' },
  { status: 'IN_QUEUE', state: 'TX', outcome: 'ELIGIBLE', risk: 'MEDIUM' },
  { status: 'IN_REVIEW', state: 'CA', outcome: 'ELIGIBLE', risk: 'LOW' },
  { status: 'PAYMENT_AUTHORIZED', state: 'CA', outcome: 'ELIGIBLE', risk: 'LOW' },
  { status: 'SCREEN_BLOCKED', state: 'CA', outcome: 'BLOCKED', risk: 'MEDIUM', block: 'RED_FLAG_SYMPTOM' },
  { status: 'SCREEN_BLOCKED', state: 'TX', outcome: 'BLOCKED', risk: 'MEDIUM', block: 'SYMPTOMS_WORSENING' },
  { status: 'SCREEN_PASSED', state: 'CA', outcome: 'ELIGIBLE', risk: 'LOW' },
  { status: 'DRAFT', state: 'TX' },
];

const ANSWERS_OK = { ageGroup: 'age_18_65', pregnant: 'no', conditions: [], hasFever: 'yes', feverRange: 'f_100_102', duration: 'd_1_3', trend: 'better', redFlags: [] };

async function main() {
  // Clear previous demo rows (children first).
  const demoPatients = await prisma.patient.findMany({ where: { email: { endsWith: `@${DEMO_DOMAIN}` } }, select: { id: true } });
  const ids = demoPatients.map((p) => p.id);
  const demoIntakes = (await prisma.intake.findMany({ where: { patientId: { in: ids } }, select: { id: true } })).map((i) => i.id);
  await prisma.note.deleteMany({ where: { intakeId: { in: demoIntakes } } });
  await prisma.review.deleteMany({ where: { intakeId: { in: demoIntakes } } });
  await prisma.payment.deleteMany({ where: { intakeId: { in: demoIntakes } } });
  await prisma.intake.deleteMany({ where: { id: { in: demoIntakes } } });
  await prisma.patient.deleteMany({ where: { id: { in: ids } } });

  const physician = await prisma.physician.findFirstOrThrow({ where: { npi: '0000000000' }, include: { licenses: true } });
  const caLicense = physician.licenses.find((l) => l.stateCode === 'CA')!;
  const txLicense = await prisma.license.upsert({
    where: { stateCode_number: { stateCode: 'TX', number: 'TEST-0002' } },
    update: {},
    create: { physicianId: physician.id, stateCode: 'TX', number: 'TEST-0002', expiresAt: new Date('2030-12-31') },
  });

  const now = Date.now();
  for (const [i, plan] of PLANS.entries()) {
    const first = FIRST[i % FIRST.length]!;
    // Waiting cases are recent (so the live queue shows realistic countdowns); the rest spread over ~7 days.
    const waiting = ['PAYMENT_AUTHORIZED', 'IN_QUEUE', 'IN_REVIEW'].includes(plan.status);
    const created = new Date(now - (waiting ? minutes(8 + 11 * (i % 4)) : minutes(60 * 9 * i + 37 * i)));
    const patient = await prisma.patient.create({
      data: {
        email: `${first.toLowerCase()}.${i}@${DEMO_DOMAIN}`,
        firstName: first,
        lastName: LAST[0]!,
        dob: new Date(Date.UTC(1985 + (i % 15), i % 12, 1 + (i % 27))),
        phone: `+1555010${String(i).padStart(4, '0')}`.slice(0, 12),
      },
    });
    const day = created.toISOString().slice(0, 10);
    const paid = ['PAYMENT_AUTHORIZED', 'IN_QUEUE', 'IN_REVIEW', 'NOTE_ISSUED', 'DECLINED'].includes(plan.status);
    const submittedAt = paid ? new Date(created.getTime() + minutes(4)) : null;

    const intake = await prisma.intake.create({
      data: {
        publicRef: formatId('REQ', randomBytes(5), 2),
        accessTokenHash: sha(randomBytes(32).toString('hex')),
        status: plan.status,
        patientId: patient.id,
        stateCode: plan.state,
        locationAttestedAt: created,
        absenceStart: paid ? new Date(`${day}T00:00:00Z`) : null,
        absenceEnd: paid ? new Date(`${day}T00:00:00Z`) : null,
        patientNotes: i % 4 === 0 ? 'Sore throat and fever since yesterday. (demo)' : null,
        submittedAt,
        slaDeadline: submittedAt ? new Date(submittedAt.getTime() + minutes(60)) : null,
        expiresAt: paid ? null : new Date(created.getTime() + minutes(60 * 24)),
        createdAt: created,
        consent: { create: { documentKey: 'telehealth-consent', documentVersion: '2026-05-01', language: i % 5 === 0 ? 'es' : 'en', ipAddress: '127.0.0.1', userAgent: 'demo-seed', acceptedAt: created } },
        ...(plan.outcome && {
          screening: {
            create: {
              rulesetVersion: '2026.10.0-parity',
              answers: plan.outcome === 'BLOCKED' ? { ...ANSWERS_OK, redFlags: plan.block === 'RED_FLAG_SYMPTOM' ? ['chest_pain'] : [], trend: plan.block === 'SYMPTOMS_WORSENING' ? 'worse' : 'better' } : ANSWERS_OK,
              outcome: plan.outcome,
              riskLevel: plan.risk!,
              riskScore: plan.risk === 'LOW' ? 1 : 2,
              blockReason: plan.block ?? null,
              computedAt: created,
            },
          },
        }),
      },
    });

    if (paid) {
      await prisma.payment.create({
        data: {
          intakeId: intake.id,
          stripePaymentIntentId: `pi_demo_${randomBytes(8).toString('hex')}`,
          amountCents: 2900,
          status: plan.status === 'NOTE_ISSUED' ? 'CAPTURED' : plan.status === 'DECLINED' ? 'VOIDED' : 'AUTHORIZED',
          capturedAt: plan.status === 'NOTE_ISSUED' ? new Date(submittedAt!.getTime() + minutes(plan.turnaround!)) : null,
          voidedAt: plan.status === 'DECLINED' ? new Date(submittedAt!.getTime() + minutes(9)) : null,
          createdAt: submittedAt!,
        },
      });
    }

    if (['IN_REVIEW', 'NOTE_ISSUED', 'DECLINED'].includes(plan.status)) {
      const decidedAt = plan.status === 'IN_REVIEW' ? null : new Date(submittedAt!.getTime() + minutes(plan.turnaround ?? 9));
      await prisma.review.create({
        data: {
          intakeId: intake.id,
          physicianId: physician.id,
          claimedAt: new Date(submittedAt!.getTime() + minutes(1)),
          decision: plan.status === 'NOTE_ISSUED' ? 'APPROVED' : plan.status === 'DECLINED' ? 'DECLINED' : null,
          declineReason: plan.status === 'DECLINED' ? 'NEEDS_IN_PERSON_CARE' : null,
          decidedAt,
          attestation: decidedAt ? 'I have reviewed this intake and made an independent clinical determination. (demo)' : null,
        },
      });
    }

    if (plan.status === 'NOTE_ISSUED') {
      const issuedAt = new Date(submittedAt!.getTime() + minutes(plan.turnaround!));
      await prisma.note.create({
        data: {
          intakeId: intake.id,
          noteId: formatId('NFW', randomBytes(8), 3),
          qrTokenHash: sha(randomBytes(32).toString('hex')),
          issuingEntity: i % 4 === 3 ? 'ANYDAY_MEDICAL_CLINIC' : 'NOTEFORWORK',
          physicianId: physician.id,
          licenseId: plan.state === 'CA' ? caLicense.id : txLicense.id,
          patientDisplayName: `${first} D.`,
          absenceStart: new Date(`${day}T00:00:00Z`),
          absenceEnd: new Date(`${day}T00:00:00Z`),
          status: i === 5 ? 'CORRECTED' : 'VALID',
          issuedAt,
          deliveredAt: new Date(issuedAt.getTime() + 20_000),
        },
      });
    }
  }
  console.log(`Seeded ${PLANS.length} demo requests (${PLANS.filter((p) => p.status === 'NOTE_ISSUED').length} with issued notes). All fictional.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
