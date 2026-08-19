import { isAdminUser } from '@/lib/admin-auth';
import type { User } from '@/lib/auth-types';

const ownerEmails = (): Set<string> => {
  const configured = (process.env.PRODUCT_INTAKE_OWNER_EMAILS ?? '').trim();
  if (configured) return new Set(configured.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean));
  const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
  return new Set(admins.length === 1 ? admins : []);
};

export const isProductIntakeOwner = (user: User | null): boolean => {
  const email = user?.email?.trim().toLowerCase();
  return Boolean(email && isAdminUser(user) && ownerEmails().has(email));
};
