import type {Product} from './products';

export type StorageValue = {label:string;gb:number};
type StorageProduct = Pick<Product,'category'|'title'|'model'|'specs'|'variants'|'stock'>;
export type StorageEvidence = {values:string[];source:'variants'|'specs'|'title'|'unknown'|'conflict'};

/** A capacity token, not RAM, a transfer rate, or a manufacturer option list. */
export const normalizeStorageValue = (value?: string): StorageValue | null => {
  const match=value?.trim().match(/^(\d+(?:[.,]\d+)?)\s*(GB|TB)$/i);
  if(!match) return null;
  const amount=Number(match[1].replace(',','.'));
  if(!Number.isFinite(amount)||amount<=0) return null;
  const unit=match[2].toUpperCase();
  return {label:`${amount}${unit}`,gb:amount*(unit==='TB'?1024:1)};
};

export const parseStorageFilterValues = (value:string):string[] => {
  const decimalNormalized=value.replace(/(\d),(\d+\s*(?:GB|TB))\b/gi,'$1.$2');
  return [...new Set(decimalNormalized.split(',').map(part=>normalizeStorageValue(part)?.label).filter((part):part is string=>Boolean(part)))];
};

const capacityTokens = (input:string): StorageValue[] => {
  // The advertised maximum of an optional memory card is not built-in storage.
  const value=input.split(/\b(?:erweiterbar|expandable|expand|micro\s*sd|up to|bis zu)\b/i)[0];
  const found=new Map<number,StorageValue>();
  for(const match of value.matchAll(/\b(\d+(?:[.,]\d+)?)\s*(GB|TB)\b/gi)) {
    const before=value.slice(Math.max(0,match.index!-24),match.index);
    const after=value.slice(match.index!+match[0].length);
    if(/(?:^|[\s:(=])-\s*$/.test(before)) continue;
    if(/\d+\s*(?:\/|,|\bor\b|\boder\b)\s*$/i.test(before)) continue;
    const explicitStorage=/^\s*(?:ssd|hdd|rom|storage|speicher)\b/i.test(after);
    if((!explicitStorage && /\b(?:ram|arbeitsspeicher|sd[- ]?karte|memory card)\s*[:=]?\s*$/i.test(before))
      || /^\s*(?:ram|arbeitsspeicher|lpddr|ddr|sd[- ]?karte|memory card|micro\s*sd|\/s|ps)\b/i.test(after)) continue;
    const normalized=normalizeStorageValue(match[0]);
    if(normalized) found.set(normalized.gb,normalized);
  }
  return [...found.values()];
};

const deviceCategories = new Set(['smartphones','tablets','laptops']);
const ordered = (values:StorageValue[]):string[] => [...new Map(values.map(v=>[v.gb,v])).values()].sort((a,b)=>a.gb-b.gb).map(v=>v.label);

export const readProductStorage = (product:StorageProduct):StorageEvidence => {
  if(!deviceCategories.has(product.category)) return {values:[],source:'unknown'};
  const variants=product.variants.map(v=>normalizeStorageValue(v.storage)).filter((v):v is StorageValue=>Boolean(v));
  // Explicit offer capacities beat generic family specifications and parent titles.
  if(variants.length) return {values:ordered(variants),source:'variants'};
  const specs:StorageValue[]=[];
  for(const spec of product.specs) {
    const label=spec.label.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if(/\bram\b|arbeitsspeicher|battery|akku|external|extern|erweiter|expand|sd[- ]?card|sd[- ]?karte/.test(label)) continue;
    if(/\b(?:speicher|interner speicher|speicherkapazitat|speichergrosse|storage|internal storage|internal memory|rom|ssd|hdd|festplatte)\b/.test(label)) specs.push(...capacityTokens(spec.value));
  }
  const uniqueSpecs=[...new Map(specs.map(v=>[v.gb,v])).values()];
  const ambiguousRamTitle=(product.title.match(/\d+\s*(?:gb|tb)\b/gi)??[]).length>1
    && /\bram\b|arbeitsspeicher/i.test(product.title)
    && !/\b(?:ssd|hdd|rom|storage|speicher|festplatte)\b/i.test(product.title);
  const title=ambiguousRamTitle || (product.category==='laptops'&&!/\b(?:ssd|hdd|storage|festplatte)\b/i.test(product.title))
    ? [] : capacityTokens(product.title);
  if(uniqueSpecs.length===1) {
    if(title.length===1 && title[0].gb!==uniqueSpecs[0].gb) return {values:[],source:'conflict'};
    return {values:ordered(uniqueSpecs),source:'specs'};
  }
  if(title.length===1) {
    if(uniqueSpecs.length && !uniqueSpecs.some(s=>s.gb===title[0].gb)) return {values:[],source:'conflict'};
    return {values:[title[0].label],source:'title'};
  }
  return {values:[],source:'unknown'};
};

export const productStorages = (product:StorageProduct,availableOnly=false):string[] => {
  const evidence=readProductStorage(product);
  if(!availableOnly) return evidence.values;
  if((product.stock??0)<=0) return [];
  if(evidence.source==='variants') {
    const available=product.variants.filter(v=>(v.stock ?? (product.variants.length===1?product.stock:0) ?? 0)>0)
      .map(v=>normalizeStorageValue(v.storage)).filter((v):v is StorageValue=>Boolean(v));
    return ordered(available);
  }
  return (product.stock??0)>0?evidence.values:[];
};
