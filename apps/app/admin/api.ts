'use client';

/** Admin API client (same-origin proxy). A 401 sends the user to the sign-in page. */
export async function adminApi<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api/v1/admin${path}`, {
    method: init.method ?? (init.body ? 'POST' : 'GET'),
    headers: init.body ? { 'Content-Type': 'application/json' } : {},
    body: init.body ? JSON.stringify(init.body) : null,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (res.status === 401 && !path.startsWith('/auth/')) {
    window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    throw new Error('Not signed in');
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.message ?? `Request failed (${res.status})`), { status: res.status, body: json });
  return json as T;
}

export interface Paged<T> {
  total: number;
  page: number;
  pageSize: number;
  rows: T[];
}
