/**
 * Local/staging seed. FAKE DATA ONLY — never point this at production.
 * Enabled states mirror the live site's list (2026-10-05), de-duplicated.
 */
import path from 'node:path';
import { config } from 'dotenv';
import { US_STATES } from '@nfw/schemas';
import { createPrismaClient, hashPassword } from '../src/index.js';

config({ path: path.resolve(import.meta.dirname, '../../../.env'), quiet: true });

const ENABLED = new Set([
  'AL', 'AZ', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'HI', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
  'MA', 'MI', 'MN', 'MS', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NC', 'OH', 'OR', 'PA', 'RI', 'SC', 'TX',
  'UT', 'VT', 'WA', 'WI', 'WY',
]);

const prisma = createPrismaClient();

async function main() {
  for (const [code, name, timeZone] of US_STATES) {
    await prisma.state.upsert({
      where: { code },
      update: { name, timeZone, enabled: ENABLED.has(code) },
      create: { code, name, timeZone, enabled: ENABLED.has(code) },
    });
  }

  // Fake physician for local testing (not a real person, fake NPI/licence).
  // Fake test physician. Login password comes from the git-ignored .env (PHYSICIAN_PASSWORD).
  const physPassword = process.env.PHYSICIAN_PASSWORD;
  if (physPassword && physPassword.length < 12) throw new Error('PHYSICIAN_PASSWORD must be at least 12 characters');
  const physHash = physPassword ? await hashPassword(physPassword) : undefined;
  const user = await prisma.user.upsert({
    where: { email: 'dr.test@example.com' },
    update: { roles: ['PHYSICIAN'], displayName: 'Test Physician', ...(physHash && { passwordHash: physHash }) },
    create: { email: 'dr.test@example.com', roles: ['PHYSICIAN'], displayName: 'Test Physician', passwordHash: physHash },
  });
  const physician = await prisma.physician.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      displayName: 'Test Physician',
      degree: 'MD',
      npi: '0000000000',
      specialties: ['Emergency Medicine'],
      languages: ['English'],
    },
  });
  await prisma.license.upsert({
    where: { stateCode_number: { stateCode: 'CA', number: 'TEST-0001' } },
    update: {},
    create: { physicianId: physician.id, stateCode: 'CA', number: 'TEST-0001', expiresAt: new Date('2030-12-31') },
  });

  // Local admin login for the staff panel. Credentials come from the git-ignored .env
  // (ADMIN_EMAIL / ADMIN_PASSWORD) — never commit real staff passwords.
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');
    const passwordHash = await hashPassword(adminPassword);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { passwordHash, roles: ['ADMIN'], disabled: false },
      create: { email: adminEmail, roles: ['ADMIN'], passwordHash, displayName: 'Local Admin' },
    });
  }

  console.log(
    `Seeded ${US_STATES.length} states (${ENABLED.size} enabled), 1 test physician` +
      (adminEmail && adminPassword ? `, admin user ${adminEmail}.` : '. (Set ADMIN_EMAIL/ADMIN_PASSWORD in .env to create an admin login.)'),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
