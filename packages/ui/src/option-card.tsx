import type { ReactNode } from 'react';

type Tag = 'conditional' | 'high_risk';

const tagStyle: Record<Tag, string> = {
  conditional: 'bg-warn-light text-warn',
  high_risk: 'bg-danger-light text-danger',
};
const defaultTagLabels: Record<Tag, string> = { conditional: 'Conditional', high_risk: 'High risk' };

/** Accessible radio/checkbox card used by the screening questionnaire. */
export function OptionCard({
  type,
  name,
  checked,
  onChange,
  tag,
  tagLabels = defaultTagLabels,
  children,
}: {
  type: 'radio' | 'checkbox';
  name: string;
  checked: boolean;
  onChange: () => void;
  tag?: Tag | undefined;
  /** Localized tag text, e.g. { conditional: 'Condicional', high_risk: 'Riesgo alto' }. */
  tagLabels?: Record<Tag, string>;
  children: ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-green ${
        checked ? 'border-green bg-green-light' : 'border-border bg-surface hover:border-green-mid'
      }`}
    >
      <input type={type} name={name} checked={checked} onChange={onChange} className="size-4 accent-green" />
      <span className="flex-1 text-ink">{children}</span>
      {tag && (
        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${tagStyle[tag]}`}>
          {tagLabels[tag]}
        </span>
      )}
    </label>
  );
}
