import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ query: vi.fn(), send: vi.fn(), pdf: vi.fn() }));
vi.mock('@/lib/db', () => ({ query: mocks.query }));
vi.mock('@/lib/email', () => ({ sendRepairEstimateEmail: mocks.send }));
vi.mock('@/lib/repair-estimate-auth', () => ({ requireRepairEstimateUser: async () => ({ user: { id: 'test', email: 'staff@example.invalid' } }) }));
vi.mock('@/lib/admin-csrf', () => ({ rejectCrossSiteAdminMutation: () => null }));
vi.mock('@/lib/repair-estimate-storage', () => ({ readEstimatePdf: mocks.pdf }));
import { POST } from '../../app/api/admin/repair-estimates/[id]/email/route';

describe('selected estimate recipients', () => {
  beforeEach(() => {
    mocks.query.mockReset(); mocks.send.mockReset().mockResolvedValue({ success: true });
    mocks.pdf.mockReset().mockResolvedValue(Buffer.from('synthetic'));
  });
  it.each([true, false])('invalid insurer selected=%s', async selected => {
    mocks.query.mockResolvedValueOnce({ rows: [{ id: 'version', payload: { customer: { email: 'ok@example.invalid' }, insurer: { enabled: true, email: 'a,b@example.invalid' } }, revision: 1, estimate_number: 'TEST', pdf_path: 'synthetic' }] }).mockResolvedValue({ rows: [] });
    const response = await POST(new NextRequest('https://example.invalid/api/admin/repair-estimates/test/email', { method: 'POST', body: JSON.stringify({ customer: true, insurer: selected }) }), { params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }) });
    expect(response.status).toBe(selected ? 400 : 200);
    if (selected) {
      expect(mocks.send).not.toHaveBeenCalled(); expect(mocks.pdf).not.toHaveBeenCalled();
      expect(mocks.query).toHaveBeenCalledTimes(1);
    } else {
      expect(mocks.send.mock.calls[0][0].recipients).toEqual(['ok@example.invalid']);
    }
  });
  it('does not truncate an overlength saved address into a valid one', async () => {
    const address = 'a@example.invalid' + 'x'.repeat(260);
    mocks.query.mockResolvedValueOnce({ rows: [{ payload: { customer: { email: address } } }] });
    const response = await POST(new NextRequest('https://example.invalid/api/admin/repair-estimates/test/email', { method: 'POST', body: JSON.stringify({ customer: true }) }), { params: Promise.resolve({ id: '11111111-1111-1111-1111-111111111111' }) });
    expect(response.status).toBe(400); expect(mocks.send).not.toHaveBeenCalled();
  });
});
