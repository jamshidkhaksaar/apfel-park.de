import he from 'he';

export type ResearchSource = { url: string; title: string; retrievedAt: string; text: string };

const manufacturerDomains = ['apple.com','samsung.com','samsungmobilepress.com','mi.com','xiaomi.com','nothing.tech','fairphone.com','hmd.com','nokia.com','honor.com','huawei.com','oneplus.com','oppo.com','realme.com','motorola.com','motorola.de','sony.com','sony.de','asus.com','lenovo.com'];
const exactGoogleHosts = ['store.google.com','support.google.com','safety.google'];

export const germanManufacturerUrl = (value: string): string => {
  const url = new URL(value);
  if (['apple.com','www.apple.com'].includes(url.hostname) && /^\/(?:iphone|ipad|mac|airpods|watch)(?:[-/]|$)/.test(url.pathname)) url.pathname = `/de${url.pathname}`;
  if (url.hostname === 'support.apple.com' && url.pathname.startsWith('/en-us/')) url.pathname = url.pathname.replace('/en-us/', '/de-de/');
  return url.toString();
};

export const approvedResearchUrl = (value: unknown, allowGroundingRedirect = false): URL | null => {
  if (typeof value !== 'string' || value.length > 4096) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null;
    const host = url.hostname.toLowerCase();
    if (/\/(?:community|thread|forums?)(?:\/|$)/i.test(url.pathname)) return null;
    const configured = (process.env.PRODUCT_INTAKE_ALLOWED_SOURCE_DOMAINS ?? '').split(',').map(domain => domain.trim().toLowerCase())
      .filter(domain => /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/.test(domain) && !['co.uk','com','org','net','de','google.com'].includes(domain));
    const manufacturer = [...manufacturerDomains, ...configured].some(domain => host === domain || host.endsWith(`.${domain}`));
    const regulator = host === 'eprel.ec.europa.eu';
    const groundingRedirect = allowGroundingRedirect && host === 'vertexaisearch.cloud.google.com' && url.pathname.startsWith('/grounding-api-redirect/');
    if (!manufacturer && !regulator && !exactGoogleHosts.includes(host) && !groundingRedirect) return null;
    url.hash = '';
    return url;
  } catch { return null; }
};

export const officialPageText = (html: string): string => {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  const productData: unknown[] = [];
  const collect = (value: unknown, depth = 0): void => {
    if (depth > 4 || productData.length >= 20 || !value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.slice(0, 20).forEach(item => collect(item, depth + 1)); return; }
    const record = value as Record<string, unknown>;
    if (['Product','ProductGroup'].some(type => [record['@type']].flat().includes(type))) {
      productData.push(Object.fromEntries(['name','description','brand','model','additionalProperty','width','height','depth','weight'].filter(key => record[key] !== undefined).map(key => [key, record[key]])));
    }
    for (const key of ['@graph','mainEntity','hasVariant']) collect(record[key], depth + 1);
  };
  for (const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    if (script[1].length > 250_000) continue;
    try { collect(JSON.parse(script[1])); } catch { /* malformed optional markup is not evidence */ }
  }
  return he.decode(main
    .replace(/<(script|style|noscript|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ').trim() + (productData.length ? `\nPublished product data: ${JSON.stringify(productData)}` : '');
};

export const sourceMatchesModel = (text: string, model: string): boolean => {
  const normalize = (value: string): string => value.toLocaleLowerCase('de-DE').normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const target = normalize(model);
  return target.length >= 4 && ` ${normalize(text)} `.includes(` ${target} `);
};

const readBounded = async (response: Response): Promise<string> => {
  const limit = 2_000_000;
  if (Number(response.headers.get('content-length') ?? 0) > limit || !response.body) throw new Error('source_size');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.length;
      if (length > limit) throw new Error('source_size');
      chunks.push(part.value);
    }
    return Buffer.concat(chunks).toString('utf8');
  } finally { await reader.cancel().catch(() => {}); }
};

export const fetchOfficialResearchSource = async (
  candidate: string,
  model: string,
  fetcher: typeof fetch = fetch,
): Promise<ResearchSource | null> => {
  let target = approvedResearchUrl(candidate, true);
  if (!target) return null;
  target = approvedResearchUrl(germanManufacturerUrl(target.toString()), true);
  if (!target) return null;
  const signal = AbortSignal.timeout(9000);
  try {
    for (let hop = 0; hop < 4; hop += 1) {
      const response = await fetcher(target.toString(), { redirect: 'manual', signal, headers: { 'User-Agent': 'ApfelPark-ProductResearch/1.0', Accept: 'text/html,text/plain;q=0.9', 'Accept-Language': 'de-DE,de;q=0.9,en;q=0.5' } });
      if ([301,302,303,307,308].includes(response.status)) {
        const location = response.headers.get('location');
        await response.body?.cancel();
        if (!location) return null;
        target = approvedResearchUrl(new URL(location, target).toString(), true);
        if (!target) return null;
        continue;
      }
      if (!response.ok || !approvedResearchUrl(target.toString()) || !/text\/(?:html|plain)/i.test(response.headers.get('content-type') ?? '')) {
        await response.body?.cancel();
        return null;
      }
      const raw = await readBounded(response);
      const text = officialPageText(raw).slice(0, 45_000);
      if (text.length < 200 || !sourceMatchesModel(text, model)) return null;
      const title = he.decode(raw.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? target.hostname).replace(/\s+/g, ' ').trim().slice(0, 180);
      return { url: target.toString(), title, retrievedAt: new Date().toISOString(), text };
    }
  } catch { return null; }
  return null;
};
