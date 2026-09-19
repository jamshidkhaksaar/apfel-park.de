import 'server-only';
import { normalizeRepairRules } from './repair-campaign-rules';
import { campaignDateToIso } from './campaign-dates';
import { query } from './db';
import { emptyPromotion, promotionCampaignIssue, sanitizePromotionSettings, type PromotionCampaign, type PromotionSettings, type PublicPromotion } from './promotion';

export const readPromotionSettings = async (): Promise<PromotionSettings> => {
  const result=await query("SELECT value FROM store_settings WHERE key='promotion_banner' LIMIT 1");
  return result.rows[0]?.value ? sanitizePromotionSettings(result.rows[0].value) : emptyPromotion();
};
export const readPromotionCampaign = async (id:string) => {
  const result=await query('SELECT id,code,discount_type,discount_value,minimum_order,eligible_categories,eligible_product_ids,starts_at,ends_at,maximum_redemptions,redemption_count,is_active,repair_rules FROM store_campaigns WHERE id=$1',[id]);
  const campaign=(result.rows[0]??null) as PromotionCampaign|null;
  const products=campaign?.eligible_product_ids.length ? await query('SELECT id,category,is_active FROM products WHERE id=ANY($1::uuid[])',[campaign.eligible_product_ids]) : {rows:[]};
  const selectedCategories=[...new Set(products.rows.map(row=>String(row.category)))];
  const selectedProducts=products.rows.filter(row=>row.is_active===true).map(row=>({id:String(row.id),category:String(row.category)}));
  return {campaign,selectedCategories,selectedProducts};
};
export const getPublicPromotion = async (context:{category?:string;slug?:string}={}): Promise<PublicPromotion|null> => {
  const settings=await readPromotionSettings();
  if(!settings.enabled||!settings.campaignId)return null;
  const {campaign,selectedCategories,selectedProducts}=await readPromotionCampaign(settings.campaignId);
  if(!campaign||promotionCampaignIssue(campaign,selectedCategories))return null;
  const categories=[...new Set([...campaign.eligible_categories,...selectedProducts.map(product=>product.category)])];
  if(!categories.length)return null;
  if(context.category&&!categories.includes(context.category))return null;
  if(context.slug){
    const result=await query('SELECT id,category FROM products WHERE slug=$1 AND is_active=true AND stock>0 LIMIT 1',[context.slug]);
    const product=result.rows[0];
    if(!product||(!campaign.eligible_categories.includes(String(product.category))&&!campaign.eligible_product_ids.includes(String(product.id))))return null;
  }
  const repairRules=campaign.eligible_categories.includes('repairs')?normalizeRepairRules(campaign.repair_rules):undefined;
  const dateEnd=repairRules?.dates.length?campaignDateToIso(repairRules.dates.at(-1)+'T23:59:59'):null;
  const savedEnd=campaign.ends_at?new Date(campaign.ends_at).toISOString():null;
  const endsAt=dateEnd&&(!savedEnd||dateEnd<savedEnd)?dateEnd:savedEnd;
  return {repairRules,id:campaign.id,code:campaign.code,discountType:campaign.discount_type as 'percent'|'fixed',discountValue:Number(campaign.discount_value),minimumOrder:Number(campaign.minimum_order),
    startsAt:campaign.starts_at?new Date(campaign.starts_at).toISOString():null,endsAt,headline:settings.headline,
    categories,categoryWide:campaign.eligible_categories,selectedProductIds:selectedProducts.map(product=>product.id),includesSelected:selectedProducts.length>0,selectedOnly:campaign.eligible_categories.length===0,
    expiresInSeconds:endsAt?Math.max(0,Math.floor((new Date(endsAt).getTime()-Date.now())/1000)):0};
};
