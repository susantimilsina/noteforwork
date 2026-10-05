'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@nfw/ui/alert';
import { Button } from '@nfw/ui/button';
import { Card } from '@nfw/ui/card';
import { api } from '../lib/api';
import { errorMessage, marketingHome, startBase, t, type Lang } from '../lib/i18n';
import { Progress } from '../lib/progress';
import { useBack } from './back-context';

interface StateRow {
  code: string;
  name: string;
  enabled: boolean;
}

export function LocationStep({ lang }: { lang: Lang }) {
  const d = t(lang).location;
  const router = useRouter();
  const [states, setStates] = useState<StateRow[]>([]);
  const [stateCode, setStateCode] = useState('');
  const [attested, setAttested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useBack(() => (window.location.href = marketingHome(lang)));

  useEffect(() => {
    api<StateRow[]>('/states').then(setStates).catch(() => setError(d.loadError));
  }, [d.loadError]);

  const selected = states.find((s) => s.code === stateCode);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('/intakes', { body: { stateCode, locationAttested: attested } });
      router.push(`${startBase(lang)}/consent`);
    } catch (err) {
      setError(errorMessage(lang, err));
      setBusy(false);
    }
  }

  return (
    <>
      <Progress lang={lang} step={0} />
      <h1 className="font-display mb-2 text-[2.2rem] leading-tight">{d.title}</h1>
      <p className="mb-6 font-light leading-relaxed text-muted">{d.body}</p>
      <Card>
        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">{d.stateLabel}</span>
            <select
              required
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-3 focus:outline-2 focus:outline-green"
            >
              <option value="" disabled>
                {d.placeholder}
              </option>
              {states.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                  {s.enabled ? '' : d.unavailableSuffix}
                </option>
              ))}
            </select>
          </label>

          {selected && !selected.enabled && <Alert tone="warn">{d.unavailable(selected.name)}</Alert>}
          {selected?.enabled && <Alert tone="success">{d.available(selected.name)}</Alert>}

          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} className="mt-0.5 size-4 accent-green" />
            <span>{d.attest}</span>
          </label>

          {error && <Alert tone="danger">{error}</Alert>}

          <Button type="submit" className="w-full" disabled={!selected?.enabled || !attested || busy}>
            {busy ? d.submitting : d.submit}
          </Button>
        </form>
      </Card>
    </>
  );
}
