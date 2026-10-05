/**
 * Screening ruleset — parity port of the live DrapCode intake (captured 2026-10-05).
 *
 * Every clinical change to this file MUST be signed off by the medical director and
 * bump RULESET_VERSION. Results stored in the DB record the version they were computed with.
 *
 * Open clinical questions (see docs/02-architecture.md §8.1), intentionally NOT changed here:
 *  - Fever over 104°F in a non-conditional adult is only scored, not blocked.
 *  - Ages 7–17 pass screening; guardian details are collected later (intake), not here.
 *  - The pregnancy question is asked of everyone.
 */
export const RULESET_VERSION = '2026.10.0-parity';

export const AGE_GROUPS = ['age_18_65', 'age_7_17', 'age_65_plus', 'age_under_7'] as const;
export const YES_NO = ['no', 'yes'] as const;
export const CONDITIONS = ['diabetes', 'heart_disease', 'lung_disease', 'kidney_disease', 'liver_disease'] as const;
export const FEVER_RANGES = ['f_100_102', 'f_102_104', 'f_over_104', 'f_unknown'] as const;
export const DURATIONS = ['d_1_3', 'd_4_7', 'd_over_7'] as const;
export const TRENDS = ['better', 'same', 'worse'] as const;
export const RED_FLAGS = [
  'severe_abdominal_pelvic_testicular_pain',
  'recent_surgery_or_hospitalization',
  'immunocompromised',
  'shortness_of_breath_at_rest',
  'chest_pain',
  'repeated_vomiting',
  'decreased_urination',
  'stiff_neck_headache',
  'confusion_drowsiness',
  'blood_cough_vomit_stool',
] as const;

/** Red flags that do not block on their own; they trigger the hydration follow-up question. */
export const HYDRATION_TRIGGERS: readonly RedFlag[] = ['repeated_vomiting', 'decreased_urination'];

export type AgeGroup = (typeof AGE_GROUPS)[number];
export type YesNo = (typeof YES_NO)[number];
export type Condition = (typeof CONDITIONS)[number];
export type FeverRange = (typeof FEVER_RANGES)[number];
export type Duration = (typeof DURATIONS)[number];
export type Trend = (typeof TRENDS)[number];
export type RedFlag = (typeof RED_FLAGS)[number];

export const QUESTION_IDS = [
  'ageGroup',
  'pregnant',
  'conditions',
  'hasFever',
  'feverRange',
  'duration',
  'trend',
  'redFlags',
  'canDrink',
] as const;
export type QuestionId = (typeof QUESTION_IDS)[number];

export const BLOCK_REASONS = [
  'AGE_UNDER_7',
  'HIGH_FEVER_WITH_RISK_FACTOR',
  'DURATION_OVER_7_DAYS',
  'SYMPTOMS_WORSENING',
  'RED_FLAG_SYMPTOM',
  'CANNOT_KEEP_FLUIDS_DOWN',
] as const;
export type BlockReason = (typeof BLOCK_REASONS)[number];

/** UI hint shown next to an option. */
export type OptionTag = 'conditional' | 'high_risk';
