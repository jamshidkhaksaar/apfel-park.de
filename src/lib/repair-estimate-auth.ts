import { NextResponse } from 'next/server';

import { canManageRepairs } from '@/lib/admin-auth';
import { readSessionUser } from '@/lib/session';

export const requireRepairEstimateUser = async () => {
  const user = await readSessionUser();
  if (!canManageRepairs(user)) {
    return { user: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user, response: null };
};
