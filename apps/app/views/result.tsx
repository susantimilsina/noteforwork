'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@nfw/ui/alert';
import { Card } from '@nfw/ui/card';
import { api, type IntakeSummary } from '../lib/api';
import { marketingHome, startBase, t, type Lang } from '../lib/i18n';
import { Progress } from '../lib/progress';
import { useBack } from './back-context';

/** Patient-facing outcome. Never shows the risk score. */
export function ResultStep({ lang }: { lang: Lang }) {
  const d = t(lang).result;
  const base = startBase(lang);
  const router = useRouter();
  const [intake, setIntake] = useState<IntakeSummary | null>(null);

  // Screening is final once submitted, so Back leaves the flow.
  useBack(() => (window.location.href = marketingHome(lang)));

  useEffect(() => {
    api<IntakeSummary>('/intakes/current')
      .then((i) => (i.screening ? setIntake(i) : router.replace(`${base}/questions`)))
      .catch(() => router.replace(base));
  }, [router, base]);

  if (!intake?.screening) return null;
  const eligible = intake.screening.outcome === 'ELIGIBLE';

  return (
    <>
      <Progress lang={lang} step={eligible ? 3 : 2} />
      <Card className="space-y-4">
        {eligible ? (
          <>
            <h1 className="font-display text-[2.2rem] leading-tight">{d.eligibleTitle}</h1>
            <p className="font-light text-muted">{d.eligibleBody}</p>
            <Alert tone="success">{d.notCharged}</Alert>
            <p className="text-sm text-muted">{d.nextPhase}</p>
          </>
        ) : (
          <>
            <h1 className="font-display text-[2.2rem] leading-tight">{d.blockedTitle}</h1>
            <p>{d.block[intake.screening.blockReason ?? ''] ?? d.blockedFallback}</p>
            <Alert tone="danger">{d.emergency}</Alert>
            <p className="text-sm text-muted">{d.notChargedBlocked}</p>
          </>
        )}
        <p className="text-xs text-muted">{d.request(intake.publicRef)}</p>
      </Card>
      <a href={marketingHome(lang)} className="mt-6 inline-block text-sm font-medium text-green underline">
        {d.backHome}
      </a>
    </>
  );
}
