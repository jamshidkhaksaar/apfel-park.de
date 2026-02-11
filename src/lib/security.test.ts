import { test } from 'node:test';
import assert from 'node:assert';
import { validateImageFileExtension } from './security';

test('validateImageFileExtension', async (t) => {
  await t.test('accepts valid extensions', () => {
    assert.strictEqual(validateImageFileExtension('test.png', 'image/png'), true);
    assert.strictEqual(validateImageFileExtension('test.jpg', 'image/jpeg'), true);
    assert.strictEqual(validateImageFileExtension('test.svg', 'image/svg+xml'), true);
    assert.strictEqual(validateImageFileExtension('icon.ico', 'image/x-icon'), true);
    assert.strictEqual(validateImageFileExtension('icon.ico', 'application/octet-stream'), true);
  });

  await t.test('rejects mismatched extensions', () => {
    assert.strictEqual(validateImageFileExtension('malicious.svg', 'image/png'), false);
    assert.strictEqual(validateImageFileExtension('malicious.png', 'image/svg+xml'), false);
    assert.strictEqual(validateImageFileExtension('unknown.txt', 'text/plain'), false);
  });
});
