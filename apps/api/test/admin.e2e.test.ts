/**
 * Admin API e2e tests (local docker Postgres; run `pnpm db:seed` with ADMIN_EMAIL/ADMIN_PASSWORD set).
 */
import 'reflect-metadata';
import path from 'node:path';
import { config } from 'dotenv';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createApp } from '../src/bootstrap';

config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });
const EMAIL = process.env.ADMIN_EMAIL!;
const PASSWORD = process.env.ADMIN_PASSWORD!;

let app: NestFastifyApplication;
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  app = await createApp();
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});
afterAll(() => app?.close());

const call = (method: 'GET' | 'POST', url: string, opts: { body?: unknown; cookie?: string; ip?: string } = {}) =>
  app.inject({
    method,
    url: `/v1${url}`,
    payload: opts.body as object,
    headers: { ...(opts.cookie ? { cookie: opts.cookie } : {}), 'x-forwarded-for': opts.ip ?? '10.0.0.1' },
  });

async function signIn() {
  const res = await call('POST', '/staff/auth/login', { body: { email: EMAIL, password: PASSWORD }, ip: `10.1.${Math.floor(Math.random() * 250)}.1` });
  expect(res.statusCode).toBe(200);
  const c = res.cookies.find((x) => x.name === 'nfw_staff')!;
  expect(c.httpOnly).toBe(true);
  expect(c.sameSite?.toLowerCase()).toBe('strict');
  return `nfw_staff=${c.value}`;
}

describe('admin auth', () => {
  it.skipIf(!EMAIL || !PASSWORD)('rejects a wrong password and an unknown email with the same error', async () => {
    const wrong = await call('POST', '/staff/auth/login', { body: { email: EMAIL, password: 'wrong-password' }, ip: '10.2.0.1' });
    const unknown = await call('POST', '/staff/auth/login', { body: { email: 'nobody@example.com', password: 'x' }, ip: '10.2.0.2' });
    expect(wrong.statusCode).toBe(401);
    expect(unknown.statusCode).toBe(401);
    expect(wrong.json()).toEqual(unknown.json());
  });

  it('blocks admin endpoints without a session', async () => {
    for (const url of ['/staff/me', '/admin/stats', '/admin/intakes', '/admin/notes', '/admin/queue', '/admin/physicians']) {
      expect((await call('GET', url)).statusCode).toBe(401);
    }
    expect((await call('GET', '/admin/intakes', { cookie: 'nfw_staff=forged' })).statusCode).toBe(401);
  });

  it('does not accept a patient intake cookie as a staff session', async () => {
    const res = await call('POST', '/intakes', { body: { stateCode: 'CA', locationAttested: true } });
    const patientCookie = res.cookies.find((c) => c.name === 'nfw_intake')!;
    expect((await call('GET', '/admin/intakes', { cookie: `nfw_staff=${patientCookie.value}` })).statusCode).toBe(401);
  });

  it.skipIf(!EMAIL || !PASSWORD)('signs in, lists requests and notes, and signs out', async () => {
    const cookie = await signIn();
    expect((await call('GET', '/staff/me', { cookie })).json()).toMatchObject({ email: EMAIL, roles: ['ADMIN'] });

    const list = (await call('GET', '/admin/intakes?pageSize=5', { cookie })).json();
    expect(list.rows.length).toBeLessThanOrEqual(5);
    expect(JSON.stringify(list)).not.toContain('accessTokenHash');

    if (list.rows[0]) {
      const detail = (await call('GET', `/admin/intakes/${list.rows[0].id}`, { cookie })).json();
      expect(detail.accessTokenHash).toBeUndefined();
      expect(Array.isArray(detail.history)).toBe(true);
    }
    expect((await call('GET', '/admin/notes', { cookie })).statusCode).toBe(200);
    expect((await call('GET', '/admin/intakes/not-a-uuid', { cookie })).statusCode).toBe(400);

    expect((await call('POST', '/staff/auth/logout', { cookie })).statusCode).toBe(204);
    expect((await call('GET', '/staff/me', { cookie })).statusCode).toBe(401);
  });
});
