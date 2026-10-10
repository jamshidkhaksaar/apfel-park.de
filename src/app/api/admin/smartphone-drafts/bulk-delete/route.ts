import type { NextRequest } from 'next/server';
import { phoneHandler } from '@/lib/smartphone-editor/http';
import { deletePhoneDrafts, DraftError } from '@/lib/smartphone-editor/repository';
export const POST = (request: NextRequest) => phoneHandler(request, async actor => {
  const body = await request.json();
  if (!body || typeof body !== 'object' || body.confirmation !== 'DELETE') throw new DraftError('confirmation_required');
  return deletePhoneDrafts(body.drafts, actor);
});
