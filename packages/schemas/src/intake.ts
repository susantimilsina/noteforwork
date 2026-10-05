import { z } from 'zod';
import { answersSchema, type AgeGroup } from '@nfw/screening';
import { STATE_CODES } from './states.js';
import { ageOn, isValidIsoDate } from './dates.js';

const isoDate = z.string().refine(isValidIsoDate, 'Enter a valid date');

/** Step 0 — where the patient physically is right now. */
export const createIntakeSchema = z.object({
  stateCode: z.enum(STATE_CODES),
  locationAttested: z.literal(true, { error: 'Please confirm your current location' }),
});

/** Step 1 — telehealth consent. Version must match the server's current consent document. */
export const consentSchema = z.object({
  documentVersion: z.string().min(1),
  /** Language of the consent text the patient actually read. */
  language: z.enum(['en', 'es']).default('en'),
  accepted: z.literal(true),
});

/** Step 2 — screening answers (validated again and evaluated server-side). */
export const screeningSchema = z.object({ answers: answersSchema });

/** Step 3 — patient details. */
export const patientDetailsSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
  phone: z.string().trim().regex(/^\+1\d{10}$/, 'Enter a 10-digit US phone number'),
  dob: isoDate,
  guardian: z
    .object({
      name: z.string().trim().min(1).max(160),
      relationship: z.enum(['parent', 'legal_guardian']),
      attested: z.literal(true),
    })
    .optional(),
});

/** Step 4 — absence dates. Window & 4-in-30 limits are enforced server-side (needs history + TZ). */
export const absenceSchema = z
  .object({
    startDate: isoDate,
    endDate: isoDate,
    patientNotes: z.string().trim().max(1000).optional(),
  })
  .refine((v) => v.endDate >= v.startDate, { message: 'End date must be on or after start date', path: ['endDate'] });

export type CreateIntakeInput = z.infer<typeof createIntakeSchema>;
export type ConsentInput = z.infer<typeof consentSchema>;
export type ScreeningInput = z.infer<typeof screeningSchema>;
export type PatientDetailsInput = z.infer<typeof patientDetailsSchema>;
export type AbsenceInput = z.infer<typeof absenceSchema>;

/** Inclusive age range per screening age group. */
export const AGE_GROUP_RANGE: Record<AgeGroup, [min: number, max: number]> = {
  age_under_7: [0, 6],
  age_7_17: [7, 17],
  age_18_65: [18, 65],
  age_65_plus: [65, 120],
};

/**
 * Does the DOB agree with the age group the patient chose in screening?
 * Replaces the live site's hardcoded 1961–2008 picker bounds.
 */
export function dobMatchesAgeGroup(dobIso: string, group: AgeGroup, todayIso: string): boolean {
  const age = ageOn(dobIso, todayIso);
  const [min, max] = AGE_GROUP_RANGE[group];
  return age >= min && age <= max;
}

/** Absence rules — values the medical director can tune (later moved to a config table). */
export const ABSENCE_RULES = {
  earliestStartOffsetDays: -1, // yesterday
  latestEndOffsetDays: 2,
  maxConsecutiveDays: 2,
  maxDaysPerRolling30: 4,
} as const;
