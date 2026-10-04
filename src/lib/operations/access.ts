import { query } from '@/lib/db';
import { isAdminUser } from '@/lib/admin-auth';
import type { User } from '@/lib/auth-types';
import type { OperationsAccess } from './types';

export const getOperationsAccess = async (user: User | null): Promise<OperationsAccess | null> => {
  if (!user) return null;
  // Session User.id is currently an email, not the persisted users UUID.
  const result = await query(`SELECT u.id,u.email,m.role,m.branch_id FROM users u
    LEFT JOIN ops_members m ON m.user_id=u.id AND m.active=true
    WHERE lower(u.email)=lower($1) AND u.is_active=true`, [user.email]);
  const row = result.rows[0];
  if (!row) return null;
  const owner = isAdminUser(user) || row.role === 'owner';
  if (!owner && row.role !== 'cashier') return null;
  return { userId: String(row.id), email: String(row.email), owner, branchId: owner ? null : String(row.branch_id) };
};
export const assertOperationsBranch = (access: OperationsAccess, branchId: string): void => {
  if (!access.owner && access.branchId !== branchId) throw new Error('branch_forbidden');
};
export const requireOperationsOwner = (access: OperationsAccess): void => {
  if (!access.owner) throw new Error('owner_required');
};
