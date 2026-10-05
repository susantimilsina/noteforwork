'use client';

/** Staff API client (same-origin proxy). A 401 sends the user to the staff sign-in page. */
export async function staffApi<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    method: init.method ?? (init.body ? 'POST' : 'GET'),
    headers: init.body ? { 'Content-Type': 'application/json' } : {},
    body: init.body ? JSON.stringify(init.body) : null,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (res.status === 401 && !path.startsWith('/staff/auth/')) {
    window.location.href = `/staff/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    throw new Error('Not signed in');
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.message ?? `Request failed (${res.status})`), { status: res.status, body: json });
  return json as T;
}

export const adminApi = <T,>(path: string, init?: { method?: string; body?: unknown }) => staffApi<T>(`/admin${path}`, init);
export const physicianApi = <T,>(path: string, init?: { method?: string; body?: unknown }) => staffApi<T>(`/physician${path}`, init);

export interface Paged<T> {
  total: number;
  page: number;
  pageSize: number;
  rows: T[];
}

export interface Me {
  id: string;
  email: string;
  roles: string[];
  displayName: string | null;
}

export const isAdminRole = (me: Me) => me.roles.some((r) => r === 'ADMIN' || r === 'SUPPORT');
export const isPhysician = (me: Me) => me.roles.includes('PHYSICIAN');
/** Where to land after sign-in. */
export const homeFor = (me: Me) => (isAdminRole(me) ? '/admin' : '/physician');
