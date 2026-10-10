import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('@/lib/db', () => ({
  query: mocks.query,
  withTransaction: async (work: (client: { query: typeof mocks.query }) => unknown) => work({ query: mocks.query }),
}));

import { deletePhoneDraft, listPhoneDrafts, loadPhoneDraft } from './repository';

const id = '00000000-0000-4000-8000-000000000001';
beforeEach(() => vi.resetAllMocks());

describe('smartphone draft deletion', () => {
  it('locks the draft and archives it without deleting published products or receipts', async () => {
    mocks.query.mockResolvedValueOnce({ rows: [{ id, revision: 3 }] }).mockResolvedValue({ rows: [] });
    expect(await deletePhoneDraft(id, 'editor', 3)).toEqual({ success: true });
    expect(mocks.query.mock.calls[0][0]).toContain('deleted_at IS NULL FOR UPDATE');
    expect(mocks.query.mock.calls[1][0]).toContain('SET deleted_at=now()');
    expect(mocks.query.mock.calls[1][1]).toEqual([id, 'editor']);
    expect(mocks.query).toHaveBeenCalledTimes(2);
    expect(mocks.query.mock.calls.every(([sql]) => !sql.includes('DELETE FROM'))).toBe(true);
  });
  it('rejects a stale revision without changing the draft', async () => {
    mocks.query.mockResolvedValue({ rows: [{ id, revision: 4 }] });
    await expect(deletePhoneDraft(id, 'editor', 3)).rejects.toMatchObject({ message: 'conflict', status: 409 });
    expect(mocks.query).toHaveBeenCalledTimes(1);
  });
  it('returns not found for missing or already deleted drafts', async () => {
    mocks.query.mockResolvedValue({ rows: [] });
    await expect(deletePhoneDraft(id, 'editor', 1)).rejects.toMatchObject({ status: 404 });
    expect(mocks.query).toHaveBeenCalledTimes(1);
  });
  it('rejects invalid IDs before querying', async () => {
    await expect(deletePhoneDraft('bad', 'editor')).rejects.toMatchObject({ status: 404 });
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it('excludes deleted drafts from lists and loads', async () => {
    mocks.query.mockResolvedValue({ rows: [] });
    expect(await listPhoneDrafts()).toEqual([]);
    expect(mocks.query.mock.calls[0][0]).toContain('WHERE deleted_at IS NULL');
    await expect(loadPhoneDraft(id)).rejects.toMatchObject({ status: 404 });
    expect(mocks.query.mock.calls[1][0]).toContain('AND deleted_at IS NULL');
  });
});
