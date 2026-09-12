import { expect, it, vi } from 'vitest';
import { isAdminUser, canManageUsers } from '../admin-auth';
import type { User } from '../auth-types';
it('does not restore admin authority to a demoted configured email', () => {
  vi.stubEnv('ADMIN_EMAILS', 'owner@example.invalid');
  const user: User = { id: 'fixture', email: 'owner@example.invalid', app_metadata: { role: 'manager' } };
  expect(isAdminUser(user)).toBe(false);
  expect(canManageUsers(user)).toBe(false);
});
