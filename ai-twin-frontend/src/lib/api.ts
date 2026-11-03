import type { Auth, ChatResult, Memory, Session, Twin, TwinInput } from './types';

const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
export function readAuth(): Auth | null {
  try {
    const value = JSON.parse(sessionStorage.getItem('twin.auth') || 'null');
    return typeof value?.token === 'string' &&
      typeof value?.user?.id === 'string' &&
      typeof value?.user?.display_name === 'string' &&
      typeof value?.user?.email === 'string'
      ? value
      : null;
  } catch {
    return null;
  }
}
export function storeAuth(value: Auth | null) {
  if (value) sessionStorage.setItem('twin.auth', JSON.stringify(value));
  else sessionStorage.removeItem('twin.auth');
  window.dispatchEvent(new Event('auth-change'));
}
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = readAuth();
  const response = await fetch(`${base}${path}`, {
    ...options,
    signal: options.signal || AbortSignal.timeout(100_000),
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: `Bearer ${auth.token}` } : {}),
      ...options.headers,
    },
  });
  // Ignore late responses after logout/account switch, before they can repopulate the cache.
  if (!path.startsWith('/auth/') && auth?.token !== readAuth()?.token) {
    throw new Error('Your session changed. Please try again.');
  }
  if (!response.ok) {
    if (response.status === 401 && auth && !path.startsWith('/auth/')) storeAuth(null);
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      body.error || 'Could not reach your workspace. Please try again.',
      response.status,
    );
  }
  const result = response.status === 204 ? undefined : await response.json();
  if (!path.startsWith('/auth/') && auth?.token !== readAuth()?.token) {
    throw new Error('Your session changed. Please try again.');
  }
  return result as T;
}
export const body = (method: string, value?: unknown) => ({
  method,
  ...(value === undefined ? {} : { body: JSON.stringify(value) }),
});
export const api = {
  login: (email: string, password: string) =>
    request<Auth>('/auth/login', body('POST', { email, password })),
  signup: (email: string, password: string, display_name: string) =>
    request<Auth>('/auth/signup', body('POST', { email, password, display_name })),
  twins: () => request<{ twins: Twin[] }>('/api/twins').then((r) => r.twins),
  saveTwin: (input: TwinInput, id?: string) =>
    request<{ twin: Twin }>(`/api/twins${id ? `/${id}` : ''}`, body(id ? 'PUT' : 'POST', input)),
  deleteTwin: (id: string) => request<void>(`/api/twins/${id}`, body('DELETE')),
  memories: (id: string) =>
    request<{ memories: Memory[] }>(`/api/memories?twin_id=${id}`).then((r) => r.memories),
  saveMemory: (value: { personality_id: string; content: string; tags: string }, id?: string) =>
    request<{ memory: Memory }>(
      `/api/memories${id ? `/${id}` : ''}`,
      body(id ? 'PUT' : 'POST', value),
    ),
  deleteMemory: (id: string) => request<void>(`/api/memories/${id}`, body('DELETE')),
  sessions: () => request<{ sessions: Session[] }>('/api/sessions').then((r) => r.sessions),
  session: (id: string) =>
    request<{ session: Session }>(`/api/sessions/${id}`).then((r) => r.session),
  renameSession: (id: string, title: string) =>
    request(`/api/sessions/${id}`, body('PUT', { title })),
  deleteSession: (id: string) => request<void>(`/api/sessions/${id}`, body('DELETE')),
  chat: (personality_id: string, message: string, session_id?: string) =>
    request<ChatResult>(
      '/api/chat',
      body('POST', { personality_id, message, session_id: session_id || '' }),
    ),
  export: () => request<unknown>('/api/export'),
};
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';
export function download(name: string, content: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
