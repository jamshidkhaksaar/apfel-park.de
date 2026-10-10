import type { NextRequest } from 'next/server';
import { phoneHandler } from '@/lib/smartphone-editor/http';
import { DraftError } from '@/lib/smartphone-editor/repository';
import { productDeletionPreview, ProductDeletionError } from '@/lib/product-deletion';
export const GET = (request: NextRequest) => phoneHandler(request, async () => {
  try { return await productDeletionPreview(request.nextUrl.searchParams.get('id') ?? ''); }
  catch (error) { if (error instanceof ProductDeletionError) throw new DraftError(error.message, error.status); throw error; }
});
