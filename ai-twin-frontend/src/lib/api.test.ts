import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, readAuth, storeAuth } from './api';

const auth = {
  user: { id: 'account-a', display_name: 'Alex', email: 'alex@example.com' },
  token: 'test-token',
};
beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => values.get(k) || null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  });
  vi.stubGlobal('window', { dispatchEvent: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());
describe('authenticated API boundary', () => {
  it('rejects structurally invalid account data', () => {
    sessionStorage.setItem('twin.auth', JSON.stringify({ token: 'token', user: { id: 'a' } }));
    expect(readAuth()).toBeNull();
  });
  it('discards a late response after switching accounts', async () => {
    storeAuth(auth);
    let finish!: (response: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          }),
      ),
    );
    const pending = api.twins();
    storeAuth({ ...auth, user: { ...auth.user, id: 'account-b' }, token: 'other-token' });
    finish(new Response(JSON.stringify({ twins: [{ id: 'private-old-twin' }] })));
    await expect(pending).rejects.toThrow('Your session changed.');
    expect(readAuth()?.user.id).toBe('account-b');
  });
  it('recovers from malformed browser storage', () => {
    sessionStorage.setItem('twin.auth', '{broken');
    expect(readAuth()).toBeNull();
  });
  it('sends the current account token', async () => {
    storeAuth(auth);
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ twins: [] })));
    vi.stubGlobal('fetch', fetch);
    expect(await api.twins()).toEqual([]);
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
  });
  it('clears an expired session and preserves the API error', async () => {
    storeAuth(auth);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: 'Please sign in again.' }), { status: 401 }),
        ),
    );
    await expect(api.twins()).rejects.toThrow('Please sign in again.');
    expect(readAuth()).toBeNull();
  });
  it('does not clear the current account after an unsuccessful login request', async () => {
    storeAuth(auth);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: 'Incorrect password.' }), { status: 401 }),
        ),
    );
    await expect(api.login('alex@example.com', 'wrong')).rejects.toThrow('Incorrect password.');
    expect(readAuth()).toEqual(auth);
  });
  it('accepts empty delete responses', async () => {
    storeAuth(auth);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(api.deleteMemory('memory-id')).resolves.toBeUndefined();
  });
  it('reports non-JSON service errors without exposing the response body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('private proxy details', { status: 502 })),
    );
    await expect(api.twins()).rejects.toThrow('Could not reach your workspace. Please try again.');
  });
});
