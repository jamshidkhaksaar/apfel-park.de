import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionRow } from './repository';

const fixture = vi.hoisted(() => ({
  query: vi.fn(), event: vi.fn(), session: vi.fn(), gemini: vi.fn(), prior: null as null | { details: unknown }, active: true,
}));
vi.mock('@/lib/db', () => ({ withTransaction: async (work: (client: unknown) => Promise<unknown>) => work({ query: fixture.query }) }));
vi.mock('./repository', () => ({ readSession: fixture.session, event: fixture.event }));
vi.mock('./gemini', () => ({ telegramGeminiJson: fixture.gemini }));
const { handleWorkChat, confirmPhotoCorrection } = await import('./chat');
const body = { telegramId: '12345', chatId: '12345', updateId: 1, action: 'chat', text: 'How do I add a product?' };

beforeEach(() => {
  vi.clearAllMocks(); fixture.prior = null; fixture.active = true;
  fixture.query.mockImplementation(async (sql: string) => {
    if (sql.includes('FROM telegram_product_members')) return { rows: fixture.active ? [{ id: 'member-1', locale: 'en' }] : [] };
    if (sql.includes("details->>'updateId'")) return { rows: fixture.prior ? [fixture.prior] : [] };
    if (sql.includes('count(*)')) return { rows: [{ n: 0 }] };
    return { rows: [] };
  });
  fixture.event.mockImplementation(async (_client, _session, _actor, _type, details) => { fixture.prior = { details }; });
  fixture.gemini.mockResolvedValue({ inScope: true, reply: 'Use the product intake workflow.', photoCorrection: null });
});

describe('scoped Telegram work chat', () => {
  it('records a work answer without altering products, quantities or approvals', async () => {
    const result = await handleWorkChat(body);
    expect(result.text).toContain('Advice only');
    expect(fixture.event).toHaveBeenCalledOnce();
    expect(fixture.query.mock.calls.map(call => call[0]).join('\n')).not.toMatch(/UPDATE |INSERT INTO (products|inventory|smartphone_editor)/i);
  });
  it('replays a completed update without calling Gemini or writing twice', async () => {
    const first = await handleWorkChat(body);
    expect(await handleWorkChat(body)).toEqual(first);
    expect(fixture.gemini).toHaveBeenCalledOnce();
    expect(fixture.event).toHaveBeenCalledOnce();
    await expect(handleWorkChat({ ...body, text: 'different request' })).rejects.toThrow('update_conflict');
  });
  it('rejects revoked membership and another staff member’s draft', async () => {
    fixture.active = false;
    await expect(handleWorkChat(body)).rejects.toThrow('membership_required');
    fixture.active = true;
    fixture.session.mockResolvedValue({ member_id: 'someone-else' });
    await expect(handleWorkChat({ ...body, sessionId: '57b2f20b-ec30-44d3-b065-a43f0feaf45c' })).rejects.toThrow('forbidden');
    expect(fixture.gemini).not.toHaveBeenCalled();
  });
  it('does not transmit credentials or private identifiers to Gemini or history', async () => {
    const result = await handleWorkChat({ ...body, text: 'password: synthetic-secret' });
    expect(result.text).not.toContain('synthetic-secret');
    expect(fixture.gemini).not.toHaveBeenCalled();
    expect(JSON.stringify(fixture.event.mock.calls)).not.toContain('synthetic-secret');
  });
  it('refuses unrelated chat without a model-written entertainment response', async () => {
    fixture.gemini.mockResolvedValue({ inScope: false, reply: 'Here is a joke' });
    const result = await handleWorkChat(body);
    expect(result.text).toContain('only with Apfel Park');
    expect(result.text).not.toContain('joke');
  });
  it('cannot reprocess a submitted draft without owner changes permission', async () => {
    await expect(confirmPhotoCorrection({ query: fixture.query } as never, { status: 'submitted' } as SessionRow, 'proposal', 'telegram:12345')).rejects.toThrow('submission_locked');
    expect(fixture.query).not.toHaveBeenCalled();
  });
});
