/**
 * Local/staging seed. FAKE DATA ONLY — never point this at production.
 * Enabled states mirror the live site's list (2026-10-05), de-duplicated.
 */
import path from 'node:path';
import { config } from 'dotenv';
import { US_STATES } from '@nfw/schemas';
import { createPrismaClient } from '../src/index.js';

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
  const user = await prisma.user.upsert({
    where: { email: 'dr.test@example.com' },
    update: {},
    create: { email: 'dr.test@example.com', role: 'PHYSICIAN' },
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

  console.log(`Seeded ${US_STATES.length} states (${ENABLED.size} enabled) and 1 test physician.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
