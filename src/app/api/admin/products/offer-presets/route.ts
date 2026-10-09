import type { NextRequest } from 'next/server';
import { phoneHandler } from '@/lib/smartphone-editor/http';
import { DraftError } from '@/lib/smartphone-editor/repository';
import { readOfferPresets, saveOfferPresets } from '@/lib/product-offer-presets-repository';

export const GET = (request: NextRequest) => phoneHandler(request, async () => ({ presets: await readOfferPresets() }));
export const PATCH = (request: NextRequest) => phoneHandler(request, async () => {
  try { return { presets: await saveOfferPresets(await request.json()) }; }
  catch (error) {
    if (error instanceof Error && error.message === 'presets_conflict') throw new DraftError('presets_conflict', 409);
    if (error instanceof Error && error.message === 'invalid_presets') throw new DraftError('invalid_presets', 400);
    throw error;
  }
});
