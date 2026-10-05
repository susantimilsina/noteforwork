import type { Answers } from './schema.js';
import {
  HYDRATION_TRIGGERS,
  RULESET_VERSION,
  type BlockReason,
  type QuestionId,
  type RedFlag,
} from './ruleset.js';

export type RiskLevel = 'LOW' | 'MEDIUM';

export type Evaluation =
  | {
      status: 'incomplete';
      nextQuestion: QuestionId;
      /** Questions that apply given the answers so far (conditional ones included once triggered). */
      applicableQuestions: QuestionId[];
      risk: Risk;
      rulesetVersion: string;
    }
  | {
      status: 'blocked';
      blockReason: BlockReason;
      blockedAt: QuestionId;
      applicableQuestions: QuestionId[];
      risk: Risk;
      rulesetVersion: string;
    }
  | {
      status: 'eligible';
      applicableQuestions: QuestionId[];
      risk: Risk;
      rulesetVersion: string;
    };

export interface Risk {
  level: RiskLevel;
  score: number;
}

export function isConditionalRisk(a: Answers): boolean {
  return a.ageGroup === 'age_65_plus' || a.pregnant === 'yes' || (a.conditions?.length ?? 0) > 0;
}

function blockingRedFlags(flags: readonly RedFlag[]): RedFlag[] {
  return flags.filter((f) => !HYDRATION_TRIGGERS.includes(f));
}

function hasHydrationTrigger(flags: readonly RedFlag[]): boolean {
  return flags.some((f) => HYDRATION_TRIGGERS.includes(f));
}

/** Risk score — identical weights to the live site. 0–1 → LOW, ≥2 or any conditional factor → MEDIUM. */
export function computeRisk(a: Answers): Risk {
  let score = 0;
  if (a.ageGroup === 'age_65_plus') score += 2;
  if (a.ageGroup === 'age_7_17') score += 1;
  if (a.pregnant === 'yes') score += 2;
  score += a.conditions?.length ?? 0;
  if (a.hasFever === 'yes') score += 1;
  if (a.feverRange === 'f_100_102' || a.feverRange === 'f_unknown') score += 1;
  if (a.feverRange === 'f_102_104' || a.feverRange === 'f_over_104') score += 2;
  if (a.duration === 'd_4_7') score += 1;
  if (a.trend === 'same') score += 1;
  if (hasHydrationTrigger(a.redFlags ?? []) && a.canDrink === 'yes') score += 1;

  const medium = score >= 2 || isConditionalRisk(a);
  return { level: medium ? 'MEDIUM' : 'LOW', score: medium ? Math.max(score, 2) : score };
}

/**
 * The questions that apply given the answers so far, in display order.
 * Conditional follow-ups (fever range, hydration) appear once their trigger is answered.
 */
export function applicableQuestions(a: Answers): QuestionId[] {
  const qs: QuestionId[] = ['ageGroup', 'pregnant', 'conditions', 'hasFever'];
  if (a.hasFever === 'yes') qs.push('feverRange');
  qs.push('duration', 'trend', 'redFlags');
  if (hasHydrationTrigger(a.redFlags ?? [])) qs.push('canDrink');
  return qs;
}

/**
 * Walk the questionnaire in order and decide: which question is next, whether the patient
 * is blocked (and why), or whether they are eligible.
 *
 * Answers to questions that no longer apply (e.g. feverRange after hasFever changed to "no")
 * are ignored, so stale client state cannot influence the outcome.
 */
export function evaluate(input: Answers): Evaluation {
  const a: Answers = { ...input };
  if (a.hasFever !== 'yes') delete a.feverRange;
  if (!hasHydrationTrigger(a.redFlags ?? [])) delete a.canDrink;

  const questions = applicableQuestions(a);
  const base = { rulesetVersion: RULESET_VERSION, applicableQuestions: questions, risk: computeRisk(a) };
  const blockOf = (q: QuestionId): BlockReason | null => {
    switch (q) {
      case 'ageGroup':
        return a.ageGroup === 'age_under_7' ? 'AGE_UNDER_7' : null;
      case 'feverRange':
        return (a.feverRange === 'f_102_104' || a.feverRange === 'f_over_104') && isConditionalRisk(a)
          ? 'HIGH_FEVER_WITH_RISK_FACTOR'
          : null;
      case 'duration':
        return a.duration === 'd_over_7' ? 'DURATION_OVER_7_DAYS' : null;
      case 'trend':
        return a.trend === 'worse' ? 'SYMPTOMS_WORSENING' : null;
      case 'redFlags':
        return blockingRedFlags(a.redFlags ?? []).length > 0 ? 'RED_FLAG_SYMPTOM' : null;
      case 'canDrink':
        return a.canDrink === 'no' ? 'CANNOT_KEEP_FLUIDS_DOWN' : null;
      default:
        return null;
    }
  };

  for (const q of questions) {
    if (a[q] === undefined) return { ...base, status: 'incomplete', nextQuestion: q };
    const reason = blockOf(q);
    if (reason) {
      return {
        ...base,
        status: 'blocked',
        blockReason: reason,
        blockedAt: q,
        applicableQuestions: questions.slice(0, questions.indexOf(q) + 1),
      };
    }
  }
  return { ...base, status: 'eligible' };
}
