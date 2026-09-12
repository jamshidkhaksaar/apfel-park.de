import { NextRequest, NextResponse } from 'next/server';
import { createAdminServerClient } from '@/lib/admin-auth-server';
import { canManageProducts, isAdminUser } from '@/lib/admin-auth';
import { rejectCrossSiteAdminMutation } from '@/lib/admin-csrf';
import { DraftError } from './repository';
export const phoneEditorEnabled = () =>
  process.env.SMARTPHONE_EDITOR_ENABLED === 'true';
export const phoneHandler = async (
  request: NextRequest,
  work: (actor: string, owner: boolean) => Promise<unknown>,
) => {
  if (!phoneEditorEnabled())
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const client = await createAdminServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!canManageProducts(user))
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (request.method !== 'GET') {
    const denied = rejectCrossSiteAdminMutation(request, 'unauthorized');
    if (denied) return denied;
  }
  try {
    return NextResponse.json(await work(user!.id, isAdminUser(user)));
  } catch (error) {
    if (error instanceof DraftError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error('Smartphone editor request failed', error);
    return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }
};
