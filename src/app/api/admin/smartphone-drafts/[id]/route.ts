import { NextRequest } from 'next/server';
import { phoneHandler } from '@/lib/smartphone-editor/http';
import {
  loadPhoneDraft,
  savePhoneDraft,
  deletePhoneDraft,
  DraftError,
} from '@/lib/smartphone-editor/repository';
type Context = { params: Promise<{ id: string }> };
export const DELETE = (request: NextRequest, context: Context) =>
  phoneHandler(request, async (actor) => {
    const value = request.nextUrl.searchParams.get('revision');
    const revision = value === null ? undefined : Number(value);
    if (revision !== undefined && (!Number.isSafeInteger(revision) || revision < 1)) {
      throw new DraftError('conflict', 409);
    }
    return deletePhoneDraft((await context.params).id, actor, revision);
  });
export const GET = (request: NextRequest, context: Context) =>
  phoneHandler(request, async () => loadPhoneDraft((await context.params).id));
export const PATCH = (request: NextRequest, context: Context) =>
  phoneHandler(request, async (actor) => {
    const body = await request.json();
    return savePhoneDraft(
      (await context.params).id,
      body.revision,
      body.document,
      actor,
    );
  });
