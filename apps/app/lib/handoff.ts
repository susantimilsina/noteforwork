import type { Answers, QuestionId } from '@nfw/screening';

/**
 * Unsubmitted questionnaire progress survives a language switch or refresh in this tab only.
 * sessionStorage is cleared when the tab closes; we also clear it as soon as the server
 * has the answers. The server never trusts this — it re-evaluates on submit.
 */
const KEY = 'nfw_answers_draft';

export interface Draft {
  answers: Answers;
  current: QuestionId | 'review';
  history: QuestionId[];
}

export const saveDraft = (d: Draft) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(d));
  } catch {}
};
export const loadDraft = (): Draft | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    const d = raw ? (JSON.parse(raw) as Partial<Draft>) : null;
    // Ignore anything that isn't a well-formed draft (e.g. from an older app version).
    if (!d || typeof d.answers !== 'object' || !Array.isArray(d.history) || typeof d.current !== 'string') return null;
    return d as Draft;
  } catch {
    return null;
  }
};
export const clearDraft = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
};
