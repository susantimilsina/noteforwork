'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert } from '@nfw/ui/alert';
import { Button } from '@nfw/ui/button';
import { Card } from '@nfw/ui/card';
import { adminApi } from '../../../../admin/api';

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminApi('/auth/login', { body: { email, password } });
      // Only allow redirects back into the admin panel.
      router.replace(next?.startsWith('/admin') ? next : '/admin');
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError(status === 429 ? 'Too many attempts. Wait a minute and try again.' : 'Email or password is incorrect.');
      setBusy(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Email</span>
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2.5 focus:outline-2 focus:outline-green" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Password</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2.5 focus:outline-2 focus:outline-green" />
        </label>
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </Card>
  );
}

export default function AdminLogin() {
  return (
    <div className="hero-glow flex min-h-dvh items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <p className="font-display mb-1 text-center text-2xl" style={{ fontWeight: 400 }}>
          <span className="text-green">Note</span>ForWork
        </p>
        <p className="mb-6 text-center text-sm text-muted">Staff sign-in</p>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="mt-4 text-center text-xs text-muted">Authorized staff only. Access to patient records is logged.</p>
      </div>
    </div>
  );
}
