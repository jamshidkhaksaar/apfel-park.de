import { NextRequest } from 'next/server';
import { phoneHandler } from '@/lib/smartphone-editor/http';
import {
  createPhoneDraft,
  listPhoneDrafts,
  searchPhoneModels,
  phoneModelTemplate,
} from '@/lib/smartphone-editor/repository';
export const GET = (request: NextRequest) =>
  phoneHandler(request, async () => {
    const params = request.nextUrl.searchParams;
    if (params.has('search'))
      return { models: await searchPhoneModels(params.get('search') ?? '') };
    if (params.has('template'))
      return { shared: await phoneModelTemplate(params.get('template')!) };
    return { drafts: await listPhoneDrafts(params.get('productId') ?? undefined) };
  });
export const POST = (request: NextRequest) =>
  phoneHandler(request, async (actor) => {
    const body = await request.json();
    return createPhoneDraft(actor, body.productId);
  });
