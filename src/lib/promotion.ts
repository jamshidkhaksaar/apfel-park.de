import { normalizeRepairRules, hamburgDate } from './repair-campaign-rules';
export const deviceCategories = ['smartphones','tablets','laptops'] as const;
export const bannerCategories = ['smartphones','tablets','laptops','accessories'] as const;
const isBannerCategory = (category:string) => (bannerCategories as readonly string[]).includes(category);
export type PromotionSettings = { enabled: boolean; campaignId: string | null; headline: {de:string;en:string}; updatedAt?:string; updatedBy?:string };
export type PublicPromotion = {
  id:string; code:string; discountType:'percent'|'fixed'; discountValue:number; minimumOrder:number;
  endsAt:string|null; startsAt:string|null; headline:{de:string;en:string};
  categories:string[]; includesSelected:boolean; selectedOnly:boolean; expiresInSeconds:number; repairRules?:import('./repair-campaign-rules').RepairCampaignRules;
};
export const emptyPromotion = (): PromotionSettings => ({enabled:false,campaignId:null,headline:{de:'',en:''}});
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const sanitizePromotionSettings = (input: unknown): PromotionSettings => {
  if (!input || typeof input !== 'object') throw new Error('invalid_settings');
  const value=input as Record<string,unknown>, headline=value.headline as Record<string,unknown>|undefined;
  const campaignId=typeof value.campaignId==='string' && uuid.test(value.campaignId) ? value.campaignId : null;
  if(value.enabled===true && !campaignId) throw new Error('select_campaign');
  const clean=(text:unknown)=>typeof text==='string'?text.trim().slice(0,100):'';
  return {enabled:value.enabled===true,campaignId,headline:{de:clean(headline?.de),en:clean(headline?.en)}};
};
export type PromotionCampaign = {
  id:string;code:string;discount_type:string;discount_value:number|string;minimum_order:number|string;
  eligible_categories:string[];eligible_product_ids:string[];starts_at:string|Date|null;ends_at:string|Date|null;
  maximum_redemptions:number|null;redemption_count:number;is_active:boolean;repair_rules?:unknown;
};
export const promotionCampaignIssue = (campaign: PromotionCampaign | null, selectedCategories:string[], now=Date.now()): string | null => {
  if(!campaign) return 'missing_campaign';
  if(!campaign.is_active) return 'inactive';
  const start=campaign.starts_at?new Date(campaign.starts_at).getTime():null, end=campaign.ends_at?new Date(campaign.ends_at).getTime():null;
  if((start!==null&&!Number.isFinite(start))||(end!==null&&!Number.isFinite(end))||(start!==null&&end!==null&&end<=start)) return 'invalid_window';
  if(end!==null&&end<=now) return 'expired';
  if(campaign.maximum_redemptions!==null&&campaign.redemption_count>=campaign.maximum_redemptions) return 'limit_reached';
  if(!/^[A-Z0-9][A-Z0-9_-]{2,63}$/i.test(campaign.code)||!Number.isFinite(Number(campaign.discount_value))||Number(campaign.discount_value)<=0||!['percent','fixed'].includes(campaign.discount_type)||(campaign.discount_type==='percent'&&Number(campaign.discount_value)>100)||!Number.isFinite(Number(campaign.minimum_order))||Number(campaign.minimum_order)<0) return 'invalid_campaign';
  if(campaign.eligible_categories.includes('repairs')){
    if(campaign.eligible_categories.length!==1||campaign.eligible_product_ids.length)return 'device_scope_required';
    const rules=normalizeRepairRules(campaign.repair_rules),today=hamburgDate(new Date(now));
    if(!rules.dates.some(d=>d>=today))return 'expired';
    if(rules.dateBasis==='booking_date'&&!rules.dates.includes(today))return 'scheduled';
    return start!==null&&start>now?'scheduled':null;
  }
  const categories=[...campaign.eligible_categories,...selectedCategories];
  if(!categories.length||categories.some(c=>!isBannerCategory(c))) return 'device_scope_required';
  if(start!==null&&start>now) return 'scheduled';
  return null;
};
export const promotionSurface = (pathname:string, query:string): {category?:string;slug?:string} | null => {
  const path=pathname.replace(/^\/(de|en)(?=\/|$)/,'') || '/';
  const category=new URLSearchParams(query).get('category');
  if(category && category!=='all' && !isBannerCategory(category) && category!=='open-box-smartphones-tablets') return null;
  if(path==='/repairs'||path.startsWith('/repairs/'))return {category:'repairs'};
  if(path==='/accessories')return {category:'accessories'};
  if(path==='/'||path==='/store') return category&&category!=='all'&&category!=='open-box-smartphones-tablets'?{category}:{};
  if(path==='/tablets'||path==='/laptops') return {category:path.slice(1)};
  if(['/smartphones','/samsung-handys','/xiaomi-redmi-handys','/handys-ohne-vertrag','/gebrauchte-handys','/gebrauchte-iphones','/iphone-17','/iphone-16-pro-max','/open-box'].includes(path)) return {category:'smartphones'};
  const product=/^\/store\/([^/]+)$/.exec(path);
  return product?{slug:product[1]}:null;
};
const labels:Record<string,[string,string]>={smartphones:['Smartphones','smartphones'],tablets:['Tablets','tablets'],laptops:['Laptops','laptops'],accessories:['Zubehör','accessories'],repairs:['Reparaturen','repairs']};
export const promotionScope = (promo:PublicPromotion,locale:'de'|'en'):string => {
  const names=promo.categories.map(c=>labels[c]?.[locale==='de'?0:1]).filter(Boolean).join(', ');
  if(promo.selectedOnly)return locale==='de'?`Auf ausgewählte ${names}`:`On selected ${names}`;
  return locale==='de'?`Auf ${names}${promo.includesSelected?' und weitere ausgewählte Geräte':''}`:`On ${names}${promo.includesSelected?' and other selected devices':''}`;
};
export const promotionDiscount = (promo:PublicPromotion,locale:'de'|'en'):string => promo.discountType==='percent'
  ? `${new Intl.NumberFormat(locale).format(promo.discountValue)} %`
  : new Intl.NumberFormat(locale,{style:'currency',currency:'EUR'}).format(promo.discountValue);
export const promotionExclusions = (promo:PublicPromotion,locale:'de'|'en'):string => {
  const de=locale==='de',accessories=promo.categories.includes('accessories'),devices=promo.categories.some(category=>(deviceCategories as readonly string[]).includes(category));
  if(accessories&&!devices)return de?'Geräte und Reparaturen sind ausgeschlossen.':'Devices and repairs are excluded.';
  if(accessories&&devices)return de?'Reparaturen sind ausgeschlossen.':'Repairs are excluded.';
  return de?'Zubehör und Reparaturen sind ausgeschlossen.':'Accessories and repairs are excluded.';
};
