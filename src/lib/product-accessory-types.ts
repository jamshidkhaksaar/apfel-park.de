import type {AccessoryType,Product} from './products';
type AccessoryProduct = Pick<Product,'category'|'title'|'model'|'subcategory'|'description'|'featureBullets'|'specs'>;

const primaryPart = (value:string):string => value.toLowerCase().split(/\b(?:for|für|fuer|with|mit|compatible|kompatibel|passend)\b/)[0];
const casePattern=/\b(?:hardcases?|softcases?|phonecases?|cases?|covers?)\b|hülle|huelle|handytasche/;

/** Identify the sold item, not other devices mentioned in its compatibility copy. */
export const classifyAccessoryTypes = (product:AccessoryProduct):AccessoryType[] => {
  if(product.category!=='accessories') return [];
  const identity=`${primaryPart(product.title)} ${primaryPart(product.model??'')}`;
  const fullIdentity=`${product.title} ${product.model??''}`.toLowerCase();
  const types:AccessoryType[]=[];
  const isCase=product.subcategory?.startsWith('cases-')||casePattern.test(identity);
  const isPowerBank=/power\s*bank|externer akku|external battery/.test(identity);
  const headphoneName=/headphones?|kopfhörer|kopfhoerer|earbuds?|earphones?|headset|airpods|over-ear|in-ear/.test(identity);
  const adapterOrPart=/adapter|converter|konverter|kabel(?:n)?\b|\bcables?\b|ständer|staender|\bstand\b|\bholder\b|halter|ersatzteil/.test(identity);
  const isHeadphone=headphoneName&&!isCase&&!isPowerBank&&!adapterOrPart;
  const cableIdentity=/kabel(?:n)?\b|\bcables?\b/.test(fullIdentity)||(/\bhdmi\b/.test(fullIdentity)&&/(?:kabel|cable)box\b/.test(fullIdentity));
  const isCable=cableIdentity&&!isCase&&!isPowerBank&&!headphoneName;
  if(isCase) types.push('cases');
  if(!isCase&&/screen protector|displayschutz|panzerglas|schutzfolie|tempered glass/.test(identity)) types.push('screen-protectors');
  if(!isCase&&!isPowerBank&&!isHeadphone&&!isCable&&!/\botg\b|audio.*adapter/.test(identity)
    &&/\bchargers?\b|ladegerät|ladegeraet|netzteil|charging adapter|wall adapter|power adapter/.test(identity)) types.push('chargers');
  if(isCable) types.push('cables');
  if(isHeadphone) types.push('headphones');
  const audioDevice=isHeadphone||/speaker|lautsprecher/.test(identity);
  if(!isCase&&!isPowerBank&&(audioDevice||/bluetooth/.test(identity))) {
    const details=[product.title,product.description,...product.featureBullets,...product.specs.map(s=>`${s.label}: ${s.value}`)].join(' ').toLowerCase();
    const explicitlyNoBluetooth=/\b(?:no|without|ohne)\s+bluetooth\b|bluetooth\s*:\s*(?:no|nein|false|nicht)/.test(details);
    if(!explicitlyNoBluetooth&&/bluetooth/.test(details)) types.push('bluetooth');
  }
  if(isPowerBank) types.push('power-banks');
  if(/sd card|sd-karte|microsd|memory card|speicherkarte/.test(identity)&&!isCase) types.push('sd-cards');
  if(/smart home|smarthome|homekit|smart plug|smart light|wifi camera/.test(identity)&&!isCase) types.push('smart-home');
  return types;
};
