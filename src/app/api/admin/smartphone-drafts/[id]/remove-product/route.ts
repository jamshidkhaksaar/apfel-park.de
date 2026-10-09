import { NextRequest } from 'next/server';
import { phoneHandler } from '@/lib/smartphone-editor/http';
import { previewPhoneDraftProductRemoval, removePhoneDraftProduct } from '@/lib/smartphone-editor/repository';

type Context = { params: Promise<{ id: string }> };
export const POST = (request: NextRequest, context: Context) =>
  phoneHandler(request, async actor => removePhoneDraftProduct(
    (await context.params).id,
    await request.json(),
    actor,
  ));

export const GET = (request: NextRequest, context: Context) =>
  phoneHandler(request, async () => previewPhoneDraftProductRemoval(
    (await context.params).id,
    request.nextUrl.searchParams.get('entryId') ?? '',
  ));
