'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@nfw/ui/alert';
import { Button } from '@nfw/ui/button';
import { Card } from '@nfw/ui/card';
import { api, type IntakeSummary } from '../lib/api';
import { errorMessage, startBase, t, type Lang } from '../lib/i18n';
import { Progress } from '../lib/progress';
import { useBack } from './back-context';

export function ConsentStep({ lang }: { lang: Lang }) {
  const d = t(lang).consent;
  const base = startBase(lang);
  const router = useRouter();
  const scroller = useRef<HTMLDivElement>(null);
  const [intake, setIntake] = useState<IntakeSummary | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useBack(() => router.push(base));

  useEffect(() => {
    api<IntakeSummary>('/intakes/current')
      .then((i) => (i.consent.accepted ? router.replace(`${base}/questions`) : setIntake(i)))
      .catch(() => router.replace(base));
  }, [router, base]);

  function onScroll() {
    const el = scroller.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setReachedEnd(true);
  }

  function goToBottom() {
    const el = scroller.current;
    // onScroll unlocks the button once the end is actually reached.
    el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }

  async function accept() {
    if (!intake) return;
    setBusy(true);
    try {
      await api('/intakes/current/consent', {
        body: { documentVersion: intake.consent.required.version, language: lang, accepted: true },
      });
      router.push(`${base}/questions`);
    } catch (err) {
      setError(errorMessage(lang, err));
      setBusy(false);
    }
  }

  return (
    <>
      <Progress lang={lang} step={1} />
      <h1 className="font-display mb-6 text-[2.2rem] leading-tight">{d.title}</h1>
      <Card className="p-0">
        <div ref={scroller} onScroll={onScroll} className="max-h-80 space-y-3 overflow-y-auto p-6 text-sm leading-relaxed">
          {/* TODO(legal): serve the versioned consent document (per language) from the API. */}
          {d.doc.courtesy && <p className="rounded-lg bg-warn-light px-3 py-2 text-xs text-warn">{d.doc.courtesy}</p>}
          <p className="font-semibold">{d.doc.heading}</p>
          <p>{d.doc.intro}</p>
          <p>{d.doc.agreeIntro}</p>
          <ul className="list-disc space-y-1 pl-5">
            {d.doc.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p>{d.doc.law}</p>
          <p className="font-semibold">{d.doc.end}</p>
        </div>
        <div className="flex items-center gap-3 border-t border-border p-4">
          <Button variant="secondary" onClick={goToBottom} disabled={reachedEnd}>
            {reachedEnd ? d.atEnd : d.goToBottom}
          </Button>
          <Button className="flex-1" onClick={accept} disabled={!reachedEnd || !intake || busy}>
            {busy ? d.saving : reachedEnd ? d.agree : d.readFirst}
          </Button>
        </div>
      </Card>
      {intake && <p className="mt-3 text-xs text-muted">{d.version(intake.consent.required.version, intake.publicRef)}</p>}
      {error && (
        <div className="mt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
    </>
  );
}
