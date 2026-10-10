import { NextRequest, NextResponse } from 'next/server';
import { canManageProducts } from '@/lib/admin-auth';
import { createAdminServerClient } from '@/lib/admin-auth-server';
import { GalleryPathError, listUploadedImages } from '@/lib/upload-gallery';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const admin = await createAdminServerClient();
  const { data: { user } } = await admin.auth.getUser();
  if (!canManageProducts(user)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const params = request.nextUrl.searchParams;
  try {
    const gallery = await listUploadedImages(params.get('folder') ?? 'products', params.get('q') ?? '', Number(params.get('page') ?? 1));
    return NextResponse.json(gallery, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof GalleryPathError) return NextResponse.json({ error: error.message }, { status: 400 });
    if (['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    console.error('Upload gallery failed:', error);
    return NextResponse.json({ error: 'Gallery could not be loaded' }, { status: 500 });
  }
}
