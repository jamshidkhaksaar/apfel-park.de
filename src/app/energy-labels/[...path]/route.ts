import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { findEprelAssetFile } from '@/lib/eprel-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.pdf': 'application/pdf',
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const segments = (await context.params).path;
  const missing = () => new Response(null, { status: 404 });
  if (segments.length !== 1) return missing();
  const fileName = segments[0];
  const contentType = MIME_TYPES[path.extname(fileName).toLowerCase()];
  if (!contentType) return missing();

  const filePath = await findEprelAssetFile(fileName);
  if (!filePath) return missing();

  const content = await readFile(/*turbopackIgnore: true*/ filePath);
  return new Response(new Uint8Array(content), {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(content.length),
      'Cache-Control': 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
