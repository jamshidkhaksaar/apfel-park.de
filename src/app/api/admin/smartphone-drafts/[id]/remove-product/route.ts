import { NextRequest } from 'next/server';
import { phoneHandler } from '@/lib/smartphone-editor/http';
import { removePhoneDraftProduct } from '@/lib/smartphone-editor/repository';

type Context = { params: Promise<{ id: string }> };
export const POST = (request: NextRequest, context: Context) =>
  phoneHandler(request, async actor => removePhoneDraftProduct(
    (await context.params).id,
    await request.json(),
    actor,
  ));
