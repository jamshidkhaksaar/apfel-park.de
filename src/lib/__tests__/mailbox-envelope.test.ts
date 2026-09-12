import nodemailer from 'nodemailer';
import { describe, expect, it } from 'vitest';
import { isValidEmail } from '../security';

describe('validated mailboxes keep their JSON-transport envelope', () => {
  it.each([
    ['first.last@example.invalid', 'first.last@example.invalid'],
    ["o'brien+shop@example.invalid", "o'brien+shop@example.invalid"],
    ['jörg@example.invalid', 'jörg@example.invalid'],
    ['a\u203fb@example.invalid', 'a\u203fb@example.invalid'],
    ['a\u2603b@example.invalid', 'a\u2603b@example.invalid'],
    ['user@bücher.example', 'user@xn--bcher-kva.example'],
  ])('%s preserves the mailbox without SMTP', async (address, expected) => {
    expect(isValidEmail(address)).toBe(true);
    const result = await nodemailer.createTransport({ jsonTransport: true }).sendMail({
      from: 'sender@example.invalid', to: [address], replyTo: address, subject: 'Synthetic', text: 'No delivery',
    });
    expect(result.envelope.to).toEqual([expected]);
    const message = JSON.parse(result.message);
    expect(message.to).toEqual([{ address: expected, name: '' }]);
    expect(message.replyTo).toEqual([{ address: expected, name: '' }]);
  });
});
