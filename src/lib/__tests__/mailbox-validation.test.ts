import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isValidEmail } from '../security';

const mocks = vi.hoisted(() => ({ sendMail: vi.fn(), createTransport: vi.fn() }));
vi.mock('nodemailer', () => ({ default: { createTransport: mocks.createTransport } }));
vi.mock('@/lib/admin-db', () => ({ createAdminDbClient: vi.fn() }));
import { sendOfferSubscriptionConfirmationEmail, sendRepairEstimateEmail, sendRepairRequestAdminEmail } from '../email';

describe('bare mailbox contract', () => {
  it.each(['first.last@example.invalid', 'first+shop@example.invalid', "o'brien@example.invalid", 'jörg@example.invalid', 'user@bücher.example', 'User@sub.example.invalid'])('preserves supported mailbox %s', email => {
    expect(isValidEmail(email)).toBe(true);
  });
  it.each(['first.(x)last@example.invalid', 'user@sub(x).example.invalid', 'a,b@example.invalid', 'a:b@example.invalid', 'Name<a@example.invalid>', '"a"@example.invalid', 'a\\b@example.invalid', 'a\r\nb@example.invalid', 'a\0b@example.invalid', ' a@example.invalid', 'a@@example.invalid', '.a@example.invalid', 'a..b@example.invalid', 'a@-example.invalid', 'a@example.invalid.', 'a@exa_mple.invalid', '', 'a'.repeat(65) + '@example.invalid'])('rejects unsafe mailbox %s', email => {
    expect(isValidEmail(email)).toBe(false);
  });
  it('rejects non-string runtime values', () => {
    expect(isValidEmail(null as unknown as string)).toBe(false);
    expect(isValidEmail({} as string)).toBe(false);
  });
  it.each(['a@127.1', 'a@2130706433', 'a@0x7f.1', 'a@0177.0.0.1'])('rejects numeric hostname rewrites %s', email => {
    expect(isValidEmail(email)).toBe(false);
  });
  it.each(['a\u203fb@example.invalid', 'a\u2603b@example.invalid'])('preserves Unicode local parts %s', email => {
    expect(isValidEmail(email)).toBe(true);
  });
  it.each(['a@example.invalid\n', 'a\n@example.invalid', 'a@example.invalid\r', 'a@exam\u200bple.invalid'])('rejects trailing and invisible controls', email => {
    expect(isValidEmail(email)).toBe(false);
  });
});

describe('shared mail dispatch guard', () => {
  beforeEach(() => {
    vi.stubEnv('SMTP_HOST', 'smtp.example.invalid');
    vi.stubEnv('SMTP_USER', 'sender@example.invalid');
    vi.stubEnv('SMTP_PASS', 'synthetic');
    vi.stubEnv('RESEND_API_KEY', 'synthetic');
    vi.stubEnv('RESEND_FROM_EMAIL', 'sender@example.invalid');
    vi.stubEnv('REPAIRS_NOTIFICATION_EMAIL', 'staff@example.invalid');
    vi.stubGlobal('fetch', vi.fn());
    mocks.sendMail.mockReset().mockResolvedValue({});
    mocks.createTransport.mockReset().mockReturnValue({ sendMail: mocks.sendMail });
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it('rejects saved or fresh invalid recipients before either provider', async () => {
    const result = await sendOfferSubscriptionConfirmationEmail({ email: 'first.(x)last@example.invalid', locale: 'de', token: 'test' });
    expect(result.success).toBe(false);
    expect(mocks.createTransport).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects invalid reply-to without sending a staff notification', async () => {
    const result = await sendRepairRequestAdminEmail({ ticketNumber: 1, customerName: 'Test', customerEmail: 'user@sub(x).example.invalid', customerPhone: 'test', deviceModel: 'Test', issueDescription: 'Test', locale: 'de' });
    expect(result.success).toBe(false);
    expect(mocks.createTransport).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([[], ['ok@example.invalid', 'a,b@example.invalid'], ['a:b@example.invalid', 'ok@example.invalid']].map(recipients => ({ recipients })))('rejects the whole recipient array $recipients', async ({ recipients }) => {
    const original = [...recipients];
    const result = await sendRepairEstimateEmail({ recipients, estimateNumber: 'TEST', deviceLabel: 'Test', language: 'de', attachment: { filename: 'test.pdf', content: Buffer.from('test'), contentType: 'application/pdf' } });
    expect(result.success).toBe(false);
    expect(recipients).toEqual(original);
    expect(mocks.createTransport).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('preserves explicit recipients, attachment bytes and legal footer', async () => {
    const recipients = ['first+shop@example.invalid', "o'brien@example.invalid"];
    const content = Buffer.from('synthetic pdf');
    const result = await sendRepairEstimateEmail({ recipients, estimateNumber: 'TEST', deviceLabel: 'Test', language: 'de', attachment: { filename: 'test.pdf', content, contentType: 'application/pdf' } });
    expect(result.success).toBe(true);
    const sent = mocks.sendMail.mock.calls[0][0];
    expect(sent.to).toEqual(recipients);
    expect(sent.attachments[0].content).toEqual(content);
    expect(sent.html.match(/data-business-email-identity/g)).toHaveLength(1);
  });
});
