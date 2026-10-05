'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { evaluate, questionsFor, type Answers, type QuestionId } from '@nfw/screening';
import { Alert } from '@nfw/ui/alert';
import { Button } from '@nfw/ui/button';
import { Card } from '@nfw/ui/card';
import { OptionCard } from '@nfw/ui/option-card';
import { api, type IntakeSummary } from '../lib/api';
import { clearDraft, loadDraft, saveDraft } from '../lib/handoff';
import { errorMessage, startBase, t, type Lang } from '../lib/i18n';
import { Progress } from '../lib/progress';
import { useBack } from './back-context';

const CORE_QUESTIONS: QuestionId[] = ['ageGroup', 'pregnant', 'conditions', 'hasFever', 'duration', 'trend', 'redFlags'];

/**
 * Screening questionnaire. The shared engine runs here only to drive the UI
 * (next question, banners). The server re-evaluates on submit and its answer is final.
 */
export function QuestionsStep({ lang }: { lang: Lang }) {
  const d = t(lang).questions;
  const QUESTIONS = questionsFor(lang);
  const base = startBase(lang);
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [history, setHistory] = useState<QuestionId[]>([]);
  const [current, setCurrent] = useState<QuestionId | 'review'>('ageGroup');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<IntakeSummary>('/intakes/current')
      .then((i) => {
        if (!i.consent.accepted) router.replace(`${base}/consent`);
        else if (i.screening) router.replace(`${base}/result`);
      })
      .catch(() => router.replace(base));
    // Resume progress carried over from the other language (same tab only), on the same question.
    const draft = loadDraft();
    if (draft && evaluate(draft.answers).status !== 'blocked') {
      setAnswers(draft.answers);
      setHistory(draft.history);
      setCurrent(draft.current);
    }
  }, [router, base]);

  // Never save the empty initial state: it would overwrite a draft that is about to be restored
  // (React runs effects twice in development).
  useEffect(() => {
    if (Object.keys(answers).length) saveDraft({ answers, current, history });
  }, [answers, current, history]);

  const preview = useMemo(() => evaluate(answers), [answers]);

  // A blocking answer ends the questionnaire immediately (mirrors the server).
  useEffect(() => {
    if (preview.status === 'blocked') void submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview.status]);

  // Header Back: previous question; from the first question, back to the location step.
  useBack(() => (history.length ? back() : router.push(base)));

  const coreIndex = current === 'review' ? -1 : CORE_QUESTIONS.indexOf(current);
  const counter = current === 'review' ? d.review : coreIndex >= 0 ? d.counter(coreIndex + 1, CORE_QUESTIONS.length) : d.followUp;

  function advance(next: Answers) {
    const r = evaluate(next);
    setHistory((h) => [...h, current as QuestionId]);
    setCurrent(r.status === 'incomplete' ? r.nextQuestion : 'review');
  }

  function choose(q: QuestionId, value: string) {
    const next = { ...answers, [q]: value } as Answers;
    setAnswers(next);
    if (evaluate(next).status !== 'blocked') advance(next);
  }

  /** Multi-selects are committed only on Continue, so a mis-tap on a red flag can be undone. */
  function commitMulti(q: 'conditions' | 'redFlags', list: string[]) {
    const next = { ...answers, [q]: list } as Answers;
    setAnswers(next);
    if (evaluate(next).status !== 'blocked') advance(next);
  }

  function back() {
    const prev = history.at(-1);
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setCurrent(prev);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api('/intakes/current/screening', { method: 'PUT', body: { answers } });
      clearDraft();
      router.push(`${base}/result`);
    } catch (err) {
      setError(errorMessage(lang, err));
      setBusy(false);
    }
  }

  const describe = (q: QuestionId) => {
    const v = answers[q];
    const opts = QUESTIONS[q].options;
    if (Array.isArray(v)) return v.length ? v.map((x) => opts.find((o) => o.value === x)?.label ?? x).join(', ') : d.none;
    return opts.find((o) => o.value === v)?.label ?? '—';
  };

  return (
    <>
      <Progress lang={lang} step={2} />
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="eyebrow">{d.eyebrow}</span>
        <span className="text-muted">{counter}</span>
      </div>
      <div className="mb-4">
        {preview.risk.level === 'LOW' ? <Alert tone="success">{d.onTrack}</Alert> : <Alert tone="warn">{d.risk}</Alert>}
      </div>

      {current === 'review' ? (
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold">{d.reviewTitle}</h2>
          <dl className="divide-y divide-border text-sm">
            {preview.applicableQuestions.map((q) => (
              <div key={q} className="flex justify-between gap-4 py-2">
                <dt className="text-muted">{QUESTIONS[q].title}</dt>
                <dd className="text-right font-medium">{describe(q)}</dd>
              </div>
            ))}
          </dl>
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={back}>
              {d.back}
            </Button>
            <Button className="flex-1" onClick={submit} disabled={busy}>
              {busy ? d.checking : d.submit}
            </Button>
          </div>
        </Card>
      ) : (
        <QuestionCard
          key={current}
          lang={lang}
          q={current}
          answers={answers}
          onChoose={choose}
          onCommitMulti={commitMulti}
          onBack={history.length ? back : undefined}
        />
      )}
      {busy && preview.status === 'blocked' && <p className="mt-4 text-sm text-muted">{d.checkingAnswers}</p>}
      {error && current !== 'review' && (
        <div className="mt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
    </>
  );
}

function QuestionCard({
  lang,
  q,
  answers,
  onChoose,
  onCommitMulti,
  onBack,
}: {
  lang: Lang;
  q: QuestionId;
  answers: Answers;
  onChoose: (q: QuestionId, v: string) => void;
  onCommitMulti: (q: 'conditions' | 'redFlags', list: string[]) => void;
  onBack: (() => void) | undefined;
}) {
  const d = t(lang);
  const content = questionsFor(lang)[q];
  const multi = content.kind === 'multi';
  const selected = answers[q];
  // Local draft for multi-selects; null = nothing chosen yet (not even "None").
  const [draft, setDraft] = useState<string[] | null>(Array.isArray(selected) ? (selected as string[]) : null);

  const toggle = (value: string | null) =>
    setDraft((cur) => (value === null ? [] : cur?.includes(value) ? cur.filter((v) => v !== value) : [...(cur ?? []), value]));

  return (
    <Card>
      <fieldset className="space-y-3">
        <legend className="mb-1 text-xl font-semibold">{content.title}</legend>
        {content.hint && <p className="text-sm text-muted">{content.hint}</p>}

        {multi && (
          <OptionCard type="checkbox" name={q} checked={draft?.length === 0} onChange={() => toggle(null)}>
            {content.noneLabel}
          </OptionCard>
        )}
        {content.options.map((o) =>
          multi ? (
            <OptionCard key={o.value} type="checkbox" name={q} tag={o.tag} tagLabels={d.tags} checked={!!draft?.includes(o.value)} onChange={() => toggle(o.value)}>
              {o.label}
            </OptionCard>
          ) : (
            <OptionCard key={o.value} type="radio" name={q} tag={o.tag} tagLabels={d.tags} checked={selected === o.value} onChange={() => onChoose(q, o.value)}>
              {o.label}
            </OptionCard>
          ),
        )}
      </fieldset>
      <div className="mt-6 flex gap-3">
        {onBack && (
          <Button variant="secondary" onClick={onBack}>
            {d.questions.back}
          </Button>
        )}
        {multi && (
          <Button className="flex-1" onClick={() => draft && onCommitMulti(q as 'conditions' | 'redFlags', draft)} disabled={draft === null}>
            {d.questions.continue}
          </Button>
        )}
        {/* Revisiting an answered single-choice question: re-clicking the same radio fires no change, so offer Continue. */}
        {!multi && typeof selected === 'string' && (
          <Button className="flex-1" onClick={() => onChoose(q, selected)}>
            {d.questions.continue}
          </Button>
        )}
      </div>
    </Card>
  );
}
