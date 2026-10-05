import type { ReactNode } from 'react';

type Tone = 'success' | 'warn' | 'danger';

const tones: Record<Tone, string> = {
  success: 'border-green/30 bg-green-light text-green',
  warn: 'border-warn/30 bg-warn-light text-warn',
  danger: 'border-danger/30 bg-danger-light text-danger',
};

export function Alert({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}
