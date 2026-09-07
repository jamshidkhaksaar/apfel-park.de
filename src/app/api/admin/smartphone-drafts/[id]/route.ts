import { NextRequest } from 'next/server';
import { phoneHandler } from '@/lib/smartphone-editor/http';
import {
  loadPhoneDraft,
  savePhoneDraft,
} from '@/lib/smartphone-editor/repository';
type Context = { params: Promise<{ id: string }> };
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
