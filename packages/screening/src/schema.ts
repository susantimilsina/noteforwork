import { z } from 'zod';
import {
  AGE_GROUPS,
  CONDITIONS,
  DURATIONS,
  FEVER_RANGES,
  RED_FLAGS,
  TRENDS,
  YES_NO,
} from './ruleset.js';

/**
 * Answers as submitted by the patient. Every field is optional because answers arrive
 * step by step. For multi-selects, an empty array means "None of the following";
 * undefined means "not answered yet".
 */
export const answersSchema = z
  .object({
    ageGroup: z.enum(AGE_GROUPS),
    pregnant: z.enum(YES_NO),
    conditions: z.array(z.enum(CONDITIONS)).max(CONDITIONS.length),
    hasFever: z.enum(YES_NO),
    feverRange: z.enum(FEVER_RANGES),
    duration: z.enum(DURATIONS),
    trend: z.enum(TRENDS),
    redFlags: z.array(z.enum(RED_FLAGS)).max(RED_FLAGS.length),
    canDrink: z.enum(YES_NO),
  })
  .partial()
  .strict();

export type Answers = z.infer<typeof answersSchema>;
