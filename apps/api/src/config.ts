import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv({ path: path.resolve(__dirname, '../../../.env'), quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  API_CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
});

export const env = envSchema.parse(process.env);
export const isProd = env.NODE_ENV === 'production';

/** Current telehealth consent document. Bump the version whenever the legal text changes. */
export const CONSENT_DOCUMENT = { key: 'telehealth-consent', version: '2026-05-01' } as const;

/** Unpaid drafts are purged after this long (no PHI before intent). */
export const DRAFT_TTL_HOURS = 24;
