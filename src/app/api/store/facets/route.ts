import { NextResponse } from 'next/server';
import { parseFacetPreviewScope } from '@/lib/catalog-facet-preview';
import { getStoreCatalog, parseStoreCatalogFilters } from '@/lib/products';

export async function GET(request: Request): Promise<NextResponse> {
  const params=new URL(request.url).searchParams;
  const lang=params.get('lang') ?? 'de';
  const scope=parseFacetPreviewScope(params);
  if (request.url.length>4096 || (params.get('q')??'').length>80 || !scope || (lang!=='de' && lang!=='en')) {
    return NextResponse.json({error:'Invalid catalog filter request'},{status:400});
  }
  try {
    const catalog=await getStoreCatalog({...scope,locale:lang,filters:parseStoreCatalogFilters(Object.fromEntries(params)),pageSize:1,failOnError:true});
    return NextResponse.json({facets:catalog.facets,total:catalog.total},{headers:{'Cache-Control':'no-store'}});
  } catch {
    console.warn('[store] Facet preview unavailable.');
    return NextResponse.json({error:'Filter preview unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
