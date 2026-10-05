import { describe, expect, it } from 'vitest';
import { evaluate, computeRisk } from './evaluate.js';
import type { Answers } from './schema.js';

const healthyAdult: Answers = {
  ageGroup: 'age_18_65',
  pregnant: 'no',
  conditions: [],
  hasFever: 'no',
  duration: 'd_1_3',
  trend: 'better',
  redFlags: [],
};

describe('evaluate — flow', () => {
  it('starts at the age question', () => {
    const r = evaluate({});
    expect(r.status).toBe('incomplete');
    expect(r.status === 'incomplete' && r.nextQuestion).toBe('ageGroup');
  });

  it('asks the fever range only when there is a fever', () => {
    const r = evaluate({ ageGroup: 'age_18_65', pregnant: 'no', conditions: [], hasFever: 'yes' });
    expect(r.status === 'incomplete' && r.nextQuestion).toBe('feverRange');
    expect(r.applicableQuestions).toContain('feverRange');
  });

  it('asks the hydration question only for hydration red flags', () => {
    const r = evaluate({ ...healthyAdult, redFlags: ['repeated_vomiting'] });
    expect(r.status === 'incomplete' && r.nextQuestion).toBe('canDrink');
  });

  it('ignores a stale feverRange once hasFever is "no"', () => {
    const r = evaluate({ ...healthyAdult, ageGroup: 'age_65_plus', feverRange: 'f_over_104' });
    expect(r.status).toBe('eligible');
  });
});

describe('evaluate — eligible', () => {
  it('healthy adult is eligible with LOW risk', () => {
    const r = evaluate(healthyAdult);
    expect(r.status).toBe('eligible');
    expect(r.risk).toEqual({ level: 'LOW', score: 0 });
  });

  it('mild fever makes risk MEDIUM (matches live walkthrough: score 2)', () => {
    const r = evaluate({ ...healthyAdult, hasFever: 'yes', feverRange: 'f_100_102' });
    expect(r.status).toBe('eligible');
    expect(r.risk).toEqual({ level: 'MEDIUM', score: 2 });
  });

  it('hydration flag + can drink is eligible', () => {
    const r = evaluate({ ...healthyAdult, redFlags: ['decreased_urination'], canDrink: 'yes' });
    expect(r.status).toBe('eligible');
    expect(r.risk.score).toBe(1);
  });

  it('PARITY: healthy adult with fever over 104°F is NOT blocked (pending clinical review)', () => {
    const r = evaluate({ ...healthyAdult, hasFever: 'yes', feverRange: 'f_over_104' });
    expect(r.status).toBe('eligible');
    expect(r.risk.level).toBe('MEDIUM');
  });
});

describe('evaluate — blocked', () => {
  const cases: [string, Answers, string][] = [
    ['age under 7', { ageGroup: 'age_under_7' }, 'AGE_UNDER_7'],
    ['65+ with 102–104°F', { ...healthyAdult, ageGroup: 'age_65_plus', hasFever: 'yes', feverRange: 'f_102_104' }, 'HIGH_FEVER_WITH_RISK_FACTOR'],
    ['pregnant with over 104°F', { ...healthyAdult, pregnant: 'yes', hasFever: 'yes', feverRange: 'f_over_104' }, 'HIGH_FEVER_WITH_RISK_FACTOR'],
    ['comorbidity with 102–104°F', { ...healthyAdult, conditions: ['diabetes'], hasFever: 'yes', feverRange: 'f_102_104' }, 'HIGH_FEVER_WITH_RISK_FACTOR'],
    ['symptoms over 7 days', { ...healthyAdult, duration: 'd_over_7' }, 'DURATION_OVER_7_DAYS'],
    ['getting worse', { ...healthyAdult, trend: 'worse' }, 'SYMPTOMS_WORSENING'],
    ['chest pain', { ...healthyAdult, redFlags: ['chest_pain'] }, 'RED_FLAG_SYMPTOM'],
    ['hydration + blocking flag', { ...healthyAdult, redFlags: ['repeated_vomiting', 'confusion_drowsiness'] }, 'RED_FLAG_SYMPTOM'],
    ['cannot keep fluids down', { ...healthyAdult, redFlags: ['repeated_vomiting'], canDrink: 'no' }, 'CANNOT_KEEP_FLUIDS_DOWN'],
  ];

  it.each(cases)('%s', (_name, answers, reason) => {
    const r = evaluate(answers);
    expect(r.status).toBe('blocked');
    expect(r.status === 'blocked' && r.blockReason).toBe(reason);
  });

  it('blocks at the first failing question even if later answers are present', () => {
    const r = evaluate({ ...healthyAdult, duration: 'd_over_7', trend: 'worse' });
    expect(r.status === 'blocked' && r.blockedAt).toBe('duration');
  });
});

describe('computeRisk', () => {
  it('any conditional factor floors the score at MEDIUM/2', () => {
    expect(computeRisk({ ...healthyAdult, conditions: ['diabetes'] })).toEqual({ level: 'MEDIUM', score: 2 });
  });
  it('65+ alone scores 2', () => {
    expect(computeRisk({ ...healthyAdult, ageGroup: 'age_65_plus' })).toEqual({ level: 'MEDIUM', score: 2 });
  });
  it('7–17 alone is LOW (score 1)', () => {
    expect(computeRisk({ ...healthyAdult, ageGroup: 'age_7_17' })).toEqual({ level: 'LOW', score: 1 });
  });
});

import { QUESTIONS_EN, QUESTIONS_ES } from './content';

describe('content translations', () => {
  it('Spanish copy has exactly the same questions and option values as English', () => {
    for (const q of Object.keys(QUESTIONS_EN) as (keyof typeof QUESTIONS_EN)[]) {
      expect(QUESTIONS_ES[q].kind).toBe(QUESTIONS_EN[q].kind);
      expect(QUESTIONS_ES[q].options.map((o) => [o.value, o.tag])).toEqual(QUESTIONS_EN[q].options.map((o) => [o.value, o.tag]));
    }
  });
});
