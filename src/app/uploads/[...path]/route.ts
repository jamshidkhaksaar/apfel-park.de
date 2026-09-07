import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const imageTypes: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
};

// The optimizer resolves local URLs inside Next, bypassing nginx's upload
// alias. public/ is indexed only at startup, so new uploads need a live route.
export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const segments = (await context.params).path;
  const missing = () => new Response(null, { status: 404 });
  if (!segments.length || segments.some((segment) => !/^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(segment))) {
    return missing();
  }
  const contentType = imageTypes[path.extname(segments[segments.length - 1]).toLowerCase()];
  if (!contentType) return missing();

  try {
    const root = await realpath(/*turbopackIgnore: true*/ process.env.UPLOADS_DIR || '/srv/apfel-park/app/shared/uploads');
    const filePath = await realpath(/*turbopackIgnore: true*/ path.join(root, ...segments));
    if (!filePath.startsWith(`${root}${path.sep}`)) return missing();
    if (!(await stat(/*turbopackIgnore: true*/ filePath)).isFile()) return missing();
    const content = await readFile(/*turbopackIgnore: true*/ filePath);
    return new Response(new Uint8Array(content), {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(content.length),
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (['ENOENT', 'ENOTDIR', 'ELOOP'].includes((error as NodeJS.ErrnoException).code ?? '')) {
      return missing();
    }
    throw error;
  }
}
