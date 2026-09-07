import { NextRequest } from 'next/server';
import { phoneHandler } from '@/lib/smartphone-editor/http';
import { publishPhoneDraft } from '@/lib/smartphone-editor/repository';
export const POST = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) =>
  phoneHandler(request, async (actor, owner) =>
    publishPhoneDraft(
      (await context.params).id,
      await request.json(),
      actor,
      owner,
    ),
  );
