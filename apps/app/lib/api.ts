/** Minimal client for the same-origin API proxy. Replaced by the orval-generated client later. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: { code?: string; message?: string; [k: string]: unknown },
  ) {
    super(body.message ?? `Request failed (${status})`);
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    method: init.method ?? (init.body ? 'POST' : 'GET'),
    headers: init.body ? { 'Content-Type': 'application/json' } : {},
    body: init.body ? JSON.stringify(init.body) : null,
    credentials: 'same-origin',
  });
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json);
  return json as T;
}

export interface IntakeSummary {
  publicRef: string;
  status: string;
  stateCode: string;
  consent: { required: { key: string; version: string }; accepted: boolean };
  screening: { outcome: 'ELIGIBLE' | 'BLOCKED'; blockReason: string | null } | null;
}
