/**
 * Intake API end-to-end tests. Runs the real Nest app (Fastify inject, no network)
 * against the local Postgres from docker-compose (`pnpm db:up && pnpm db:migrate && pnpm db:seed`).
 */
import 'reflect-metadata';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/bootstrap';

let app: NestFastifyApplication;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});
afterAll(() => app?.close());

const inject = (opts: { method: 'GET' | 'POST' | 'PUT'; url: string; body?: unknown; cookie?: string }) =>
  app.inject({
    method: opts.method,
    url: `/v1${opts.url}`,
    payload: opts.body as object,
    headers: opts.cookie ? { cookie: opts.cookie } : {},
  });

async function startIntake(stateCode = 'CA') {
  const res = await inject({ method: 'POST', url: '/intakes', body: { stateCode, locationAttested: true } });
  expect(res.statusCode).toBe(201);
  const set = res.cookies.find((c) => c.name === 'nfw_intake');
  expect(set?.httpOnly).toBe(true);
  return `nfw_intake=${set!.value}`;
}

const consent = (cookie: string) =>
  inject({ method: 'POST', url: '/intakes/current/consent', cookie, body: { documentVersion: '2026-05-01', accepted: true } });

const healthy = {
  ageGroup: 'age_18_65', pregnant: 'no', conditions: [], hasFever: 'no',
  duration: 'd_1_3', trend: 'better', redFlags: [],
};

describe('intake API', () => {
  it('rejects states we do not serve', async () => {
    const res = await inject({ method: 'POST', url: '/intakes', body: { stateCode: 'NY', locationAttested: true } });
    expect(res.statusCode).toBe(422);
    expect(res.json().code).toBe('STATE_UNAVAILABLE');
  });

  it('requires the location attestation', async () => {
    const res = await inject({ method: 'POST', url: '/intakes', body: { stateCode: 'CA' } });
    expect(res.statusCode).toBe(400);
  });

  it('requires consent before screening', async () => {
    const cookie = await startIntake();
    const res = await inject({ method: 'PUT', url: '/intakes/current/screening', cookie, body: { answers: healthy } });
    expect(res.json().code).toBe('CONSENT_REQUIRED');
  });

  it('rejects a stale consent version', async () => {
    const cookie = await startIntake();
    const res = await inject({ method: 'POST', url: '/intakes/current/consent', cookie, body: { documentVersion: '2020-01-01', accepted: true } });
    expect(res.statusCode).toBe(409);
  });

  it('rejects client-supplied risk fields', async () => {
    const cookie = await startIntake();
    await consent(cookie);
    const res = await inject({ method: 'PUT', url: '/intakes/current/screening', cookie, body: { answers: { ...healthy, riskLevel: 'LOW' } } });
    expect(res.statusCode).toBe(400);
  });

  it('passes an eligible patient and locks the screening', async () => {
    const cookie = await startIntake();
    expect((await consent(cookie)).statusCode).toBe(204);
    const res = await inject({ method: 'PUT', url: '/intakes/current/screening', cookie, body: { answers: healthy } });
    expect(res.json()).toEqual({ outcome: 'ELIGIBLE' });

    const again = await inject({ method: 'PUT', url: '/intakes/current/screening', cookie, body: { answers: healthy } });
    expect(again.json().code).toBe('SCREENING_ALREADY_SUBMITTED');

    const current = await inject({ method: 'GET', url: '/intakes/current', cookie });
    expect(current.json()).toMatchObject({ status: 'SCREEN_PASSED', consent: { accepted: true } });
  });

  it('blocks red-flag symptoms server-side', async () => {
    const cookie = await startIntake('TX');
    await consent(cookie);
    const res = await inject({ method: 'PUT', url: '/intakes/current/screening', cookie, body: { answers: { ...healthy, redFlags: ['chest_pain'] } } });
    expect(res.json()).toEqual({ outcome: 'BLOCKED', blockReason: 'RED_FLAG_SYMPTOM' });
  });

  it('reports the next question for incomplete answers', async () => {
    const cookie = await startIntake();
    await consent(cookie);
    const res = await inject({ method: 'PUT', url: '/intakes/current/screening', cookie, body: { answers: { ageGroup: 'age_18_65' } } });
    expect(res.json()).toMatchObject({ code: 'SCREENING_INCOMPLETE', nextQuestion: 'pregnant' });
  });

  it('does not accept a forged intake cookie', async () => {
    const res = await inject({ method: 'GET', url: '/intakes/current', cookie: 'nfw_intake=forged' });
    expect(res.statusCode).toBe(401);
  });
});
