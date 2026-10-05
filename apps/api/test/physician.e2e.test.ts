/**
 * Physician review + admin oversight e2e tests against the local docker Postgres.
 * Needs `pnpm db:seed` with ADMIN_* and PHYSICIAN_PASSWORD set in .env.
 */
import 'reflect-metadata';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { config } from 'dotenv';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { hashPassword, type PrismaClient } from '@nfw/db';
import { NOTE_ID_PATTERN } from '@nfw/schemas';
import { createApp } from '../src/bootstrap';
import { PrismaService } from '../src/common/prisma.service';

config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });
const ready = !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.PHYSICIAN_PASSWORD);

let app: NestFastifyApplication;
let db: PrismaClient;
const created = { intakes: [] as string[], patients: [] as string[], users: [] as string[] };
const OTHER_EMAIL = `dr.other.${randomBytes(3).toString('hex')}@example.com`;
const OTHER_PASSWORD = randomBytes(16).toString('base64url');

const call = (method: 'GET' | 'POST', url: string, opts: { body?: unknown; cookie?: string } = {}) =>
  app.inject({
    method,
    url: `/v1${url}`,
    payload: opts.body as object,
    headers: { ...(opts.cookie ? { cookie: opts.cookie } : {}), 'x-forwarded-for': `10.9.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` },
  });

async function signIn(email: string, password: string) {
  const res = await call('POST', '/staff/auth/login', { body: { email, password } });
  expect(res.statusCode).toBe(200);
  return `nfw_staff=${res.cookies.find((c) => c.name === 'nfw_staff')!.value}`;
}

/** A paid case waiting in the queue (fake data). */
async function queuedCase(stateCode: 'CA' | 'TX', opts: { slaMinutes?: number } = {}) {
  const patient = await db.patient.create({
    data: { email: `case.${randomBytes(4).toString('hex')}@demo.example.com`, firstName: 'Casey', lastName: 'Testcase', dob: new Date('1990-01-01') },
  });
  created.patients.push(patient.id);
  const submittedAt = new Date();
  const today = new Date(new Date().toISOString().slice(0, 10));
  const intake = await db.intake.create({
    data: {
      publicRef: `TEST-${randomBytes(4).toString('hex')}`,
      accessTokenHash: randomBytes(16).toString('hex'),
      status: 'IN_QUEUE',
      patientId: patient.id,
      stateCode,
      locationAttestedAt: submittedAt,
      absenceStart: today,
      absenceEnd: today,
      submittedAt,
      slaDeadline: new Date(submittedAt.getTime() + (opts.slaMinutes ?? 60) * 60_000),
      screening: { create: { rulesetVersion: 'test', answers: { ageGroup: 'age_18_65' }, outcome: 'ELIGIBLE', riskLevel: 'LOW', riskScore: 0 } },
      payment: { create: { stripePaymentIntentId: `pi_test_${randomBytes(6).toString('hex')}`, amountCents: 2900, status: 'AUTHORIZED' } },
    },
  });
  created.intakes.push(intake.id);
  return intake.id;
}

let adminCookie: string;
let drTest: string; // licensed CA + TX (seed)
let drOther: string; // licensed CA + NV only

beforeAll(async () => {
  if (!ready) return;
  process.env.NODE_ENV = 'test';
  app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  db = app.get(PrismaService).client;

  const user = await db.user.create({ data: { email: OTHER_EMAIL, roles: ['PHYSICIAN'], passwordHash: await hashPassword(OTHER_PASSWORD) } });
  created.users.push(user.id);
  await db.physician.create({
    data: {
      userId: user.id,
      displayName: 'Other Physician',
      degree: 'DO',
      npi: `9${randomBytes(4).readUInt32BE() % 1_000_000_000}`.padEnd(10, '0').slice(0, 10),
      licenses: {
        create: [
          { stateCode: 'CA', number: `OTHER-${randomBytes(3).toString('hex')}`, expiresAt: new Date('2030-01-01') },
          { stateCode: 'NV', number: `OTHER-${randomBytes(3).toString('hex')}`, expiresAt: new Date('2030-01-01') },
        ],
      },
    },
  });

  adminCookie = await signIn(process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!);
  drTest = await signIn('dr.test@example.com', process.env.PHYSICIAN_PASSWORD!);
  drOther = await signIn(OTHER_EMAIL, OTHER_PASSWORD);
});

afterAll(async () => {
  if (!db) return;
  await db.note.deleteMany({ where: { intakeId: { in: created.intakes } } });
  await db.review.deleteMany({ where: { intakeId: { in: created.intakes } } });
  await db.payment.deleteMany({ where: { intakeId: { in: created.intakes } } });
  await db.intake.deleteMany({ where: { id: { in: created.intakes } } });
  await db.patient.deleteMany({ where: { id: { in: created.patients } } });
  for (const id of created.users) {
    const p = await db.physician.findUnique({ where: { userId: id } });
    if (p) {
      await db.license.deleteMany({ where: { physicianId: p.id } });
      await db.physician.delete({ where: { id: p.id } });
    }
    await db.user.delete({ where: { id } });
  }
  await app?.close();
});

describe.skipIf(!ready)('roles', () => {
  it('admins cannot use the physician API, physicians cannot use the admin API', async () => {
    expect((await call('GET', '/physician/queue', { cookie: adminCookie })).statusCode).toBe(403);
    expect((await call('GET', '/admin/intakes', { cookie: drTest })).statusCode).toBe(403);
  });
});

describe.skipIf(!ready)('physician review', () => {
  it('only shows and allows claiming cases in licensed states', async () => {
    const tx = await queuedCase('TX');
    const otherQueue = (await call('GET', '/physician/queue', { cookie: drOther })).json();
    expect(otherQueue.rows.map((r: { id: string }) => r.id)).not.toContain(tx);
    expect((await call('POST', `/physician/cases/${tx}/claim`, { cookie: drOther })).statusCode).toBe(403);

    const testQueue = (await call('GET', '/physician/queue', { cookie: drTest })).json();
    expect(testQueue.rows.map((r: { id: string }) => r.id)).toContain(tx);
  });

  it('locks a claimed case to one physician', async () => {
    const ca = await queuedCase('CA');
    expect((await call('POST', `/physician/cases/${ca}/claim`, { cookie: drTest })).statusCode).toBe(200);
    expect((await call('POST', `/physician/cases/${ca}/claim`, { cookie: drOther })).json().code).toBe('ALREADY_CLAIMED');
    expect((await call('GET', `/physician/cases/${ca}`, { cookie: drOther })).statusCode).toBe(403);
    // Releasing returns it to the queue for others.
    expect((await call('POST', `/physician/cases/${ca}/release`, { cookie: drTest })).statusCode).toBe(204);
    expect((await call('POST', `/physician/cases/${ca}/claim`, { cookie: drOther })).statusCode).toBe(200);
  });

  it('approves only with an active claim and a signed attestation, then issues the note', async () => {
    const ca = await queuedCase('CA');
    expect((await call('POST', `/physician/cases/${ca}/approve`, { cookie: drTest, body: { attestation: true } })).json().code).toBe('CLAIM_EXPIRED');
    await call('POST', `/physician/cases/${ca}/claim`, { cookie: drTest });
    expect((await call('POST', `/physician/cases/${ca}/approve`, { cookie: drTest, body: { attestation: false } })).statusCode).toBe(400);

    const res = await call('POST', `/physician/cases/${ca}/approve`, { cookie: drTest, body: { attestation: true } });
    expect(res.statusCode).toBe(200);
    expect(res.json().noteId).toMatch(NOTE_ID_PATTERN);
    expect(res.json().withinSla).toBe(true);

    const intake = await db.intake.findUniqueOrThrow({ where: { id: ca }, include: { note: { include: { license: true } }, payment: true, review: true } });
    expect(intake.status).toBe('NOTE_ISSUED');
    expect(intake.note!.license.stateCode).toBe('CA');
    expect(intake.note!.patientDisplayName).toBe('Casey T.');
    expect(intake.payment!.status).toBe('CAPTURED');
    expect(intake.review!.attestation).toContain('attestation v1');

    // Can't approve twice.
    expect((await call('POST', `/physician/cases/${ca}/approve`, { cookie: drTest, body: { attestation: true } })).statusCode).toBe(409);
  });

  it('a late approval still issues the note but the patient is not charged', async () => {
    const ca = await queuedCase('CA', { slaMinutes: -5 });
    await call('POST', `/physician/cases/${ca}/claim`, { cookie: drTest });
    const res = (await call('POST', `/physician/cases/${ca}/approve`, { cookie: drTest, body: { attestation: true } })).json();
    expect(res.withinSla).toBe(false);
    const payment = await db.payment.findUniqueOrThrow({ where: { intakeId: ca } });
    expect(payment.status).toBe('VOIDED');
    expect(payment.refundReason).toBe('SLA_MISSED');
  });

  it('declining voids the payment', async () => {
    const ca = await queuedCase('CA');
    await call('POST', `/physician/cases/${ca}/claim`, { cookie: drTest });
    expect((await call('POST', `/physician/cases/${ca}/decline`, { cookie: drTest, body: { reason: 'NEEDS_IN_PERSON_CARE' } })).statusCode).toBe(204);
    const intake = await db.intake.findUniqueOrThrow({ where: { id: ca }, include: { payment: true, review: true } });
    expect(intake.status).toBe('DECLINED');
    expect(intake.payment!.status).toBe('VOIDED');
    expect(intake.review!.declineReason).toBe('NEEDS_IN_PERSON_CARE');
  });
});

describe.skipIf(!ready)('admin oversight', () => {
  it('sees the queue and physicians, and can revoke a note with a reason', async () => {
    const queue = (await call('GET', '/admin/queue', { cookie: adminCookie })).json();
    expect(Array.isArray(queue.rows)).toBe(true);
    const physicians = (await call('GET', '/admin/physicians', { cookie: adminCookie })).json();
    expect(physicians.some((p: { npi: string }) => p.npi === '0000000000')).toBe(true);

    const ca = await queuedCase('CA');
    await call('POST', `/physician/cases/${ca}/claim`, { cookie: drTest });
    await call('POST', `/physician/cases/${ca}/approve`, { cookie: drTest, body: { attestation: true } });
    const note = await db.note.findUniqueOrThrow({ where: { intakeId: ca } });

    expect((await call('POST', `/admin/notes/${note.id}/revoke`, { cookie: adminCookie, body: { reason: 'short' } })).statusCode).toBe(400);
    expect((await call('POST', `/admin/notes/${note.id}/revoke`, { cookie: drTest, body: { reason: 'Issued in error during testing' } })).statusCode).toBe(403);
    expect((await call('POST', `/admin/notes/${note.id}/revoke`, { cookie: adminCookie, body: { reason: 'Issued in error during testing' } })).statusCode).toBe(204);
    expect((await db.note.findUniqueOrThrow({ where: { id: note.id } })).status).toBe('REVOKED');
    expect((await call('POST', `/admin/notes/${note.id}/revoke`, { cookie: adminCookie, body: { reason: 'Issued in error during testing' } })).statusCode).toBe(409);
  });
});
