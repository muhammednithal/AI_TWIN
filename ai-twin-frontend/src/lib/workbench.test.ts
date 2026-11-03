import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ApiError, storeAuth } from './api';
import { workbench } from './workbench';
beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => values.get(k) || null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  });
  vi.stubGlobal('window', { dispatchEvent: vi.fn() });
  storeAuth({
    token: 'test',
    user: { id: 'user', email: 'test@example.test', display_name: 'Test' },
  });
});
afterEach(() => vi.unstubAllGlobals());
it('sends only the explicitly selected IDs when preparing task context', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ context: { memories: [] }, preview_token: 'signed-preview' })),
    );
  vi.stubGlobal('fetch', fetch);
  const input = {
    objective: 'Compare options',
    kind: 'compare' as const,
    memory_ids: ['selected-note'],
  };
  const result = await workbench.preview('project', input);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(input);
  expect(result.preview_token).toBe('signed-preview');
});
it('preserves the confirmed preview token and idempotency ID on a retry', async () => {
  const fetch = vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ task: { id: 'saved-task' } }))),
    );
  vi.stubGlobal('fetch', fetch);
  const input = {
    objective: 'Plan',
    kind: 'plan' as const,
    memory_ids: [],
    preview_token: 'confirmed',
    request_id: 'same-request',
  };
  await workbench.run('project', input);
  await workbench.run('project', input);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls.map((call) => JSON.parse(call[1].body))).toEqual([input, input]);
});
it('keeps context conflict status available for the re-preview flow', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: 'Context changed.' }), { status: 409 }),
      ),
  );
  try {
    await workbench.preview('project', { objective: 'Plan', kind: 'plan', memory_ids: [] });
    throw new Error('Expected rejection');
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(409);
  }
});
