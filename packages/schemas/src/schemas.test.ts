import { describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import {
  ageOn, addDays, daysBetween, dobMatchesAgeGroup, formatId, NOTE_ID_PATTERN, REQUEST_REF_PATTERN,
  normalizePublicId, patientDetailsSchema, todayIn, US_STATES, STATE_CODES,
} from './index.js';

describe('states', () => {
  it('has 50 states + DC, no duplicates, no "United States"', () => {
    expect(US_STATES).toHaveLength(51);
    expect(new Set(STATE_CODES).size).toBe(51);
    expect(US_STATES.some(([, name]) => (name as string) === 'United States')).toBe(false);
  });
});

describe('dates', () => {
  it('computes age correctly around birthdays', () => {
    expect(ageOn('1990-10-06', '2026-10-05')).toBe(35);
    expect(ageOn('1990-10-05', '2026-10-05')).toBe(36);
  });
  it('adds days and diffs across months', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(daysBetween('2026-10-05', '2026-10-06')).toBe(1);
  });
  it('uses the patient time zone, not the server/browser one', () => {
    const t = new Date('2026-10-06T05:30:00Z'); // 10:30pm Oct 5 in LA, 1:30am Oct 6 in NY
    expect(todayIn('America/Los_Angeles', t)).toBe('2026-10-05');
    expect(todayIn('America/New_York', t)).toBe('2026-10-06');
  });
});

describe('dobMatchesAgeGroup', () => {
  it('accepts 65+ and minors (live site rejected them via hardcoded 1961–2008 bounds)', () => {
    expect(dobMatchesAgeGroup('1950-01-01', 'age_65_plus', '2026-10-05')).toBe(true);
    expect(dobMatchesAgeGroup('2012-05-01', 'age_7_17', '2026-10-05')).toBe(true);
  });
  it('rejects a DOB inconsistent with the chosen group', () => {
    expect(dobMatchesAgeGroup('1990-01-01', 'age_7_17', '2026-10-05')).toBe(false);
  });
});

describe('patientDetailsSchema', () => {
  it('lower-cases email instead of rejecting capitals', () => {
    const r = patientDetailsSchema.parse({ firstName: 'Test', lastName: 'Patient', email: ' Test@Example.COM ', phone: '+12015550100', dob: '1990-01-01' });
    expect(r.email).toBe('test@example.com');
  });
});

describe('ids', () => {
  it('formats note IDs and request refs that match their patterns', () => {
    expect(formatId('NFW', randomBytes(8), 3)).toMatch(NOTE_ID_PATTERN);
    expect(formatId('REQ', randomBytes(5), 2)).toMatch(REQUEST_REF_PATTERN);
  });
  it('normalizes typed IDs', () => {
    expect(normalizePublicId(' nfw-abcd-efgh-o1il ')).toBe('NFW-ABCD-EFGH-0111');
  });
});
