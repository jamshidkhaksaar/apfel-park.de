import type { TransactionClient } from '@/lib/db';
import { normalizeFamilyOptionValues, validateFamilyConfiguration } from '@/lib/product-family-validation';
import { sanitizeProductExperienceProfile } from '@/lib/product-experience';

type FamilySaveInput = {
  id?: string;
  name: string;
  slug: string;
  optionAxes: string[];
  isActive: boolean;
  members: Array<{ productId: string; optionValues: Record<string, string>; position?: number; isActive?: boolean }>;
};

const familyText = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);

export const persistProfile = async (client: TransactionClient, productId: string, input: unknown) => {
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended('product-experience:' || $1,0))", [productId]);
  const profile = sanitizeProductExperienceProfile(input);
  await client.query(`INSERT INTO product_experience_profiles
    (product_id,enabled_sections,package_contents,condition_guide,refurbishment_steps,trust_points,dimensions,comparison_product_ids,bundle_product_ids,campaign,updated_at)
    VALUES ($1,$2::jsonb,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8::uuid[],$9::uuid[],$10::jsonb,now())
    ON CONFLICT(product_id) DO UPDATE SET enabled_sections=excluded.enabled_sections,package_contents=excluded.package_contents,condition_guide=excluded.condition_guide,refurbishment_steps=excluded.refurbishment_steps,trust_points=excluded.trust_points,dimensions=excluded.dimensions,comparison_product_ids=excluded.comparison_product_ids,bundle_product_ids=excluded.bundle_product_ids,campaign=excluded.campaign,updated_at=now()`, [productId,JSON.stringify(profile.enabledSections),JSON.stringify(profile.packageContents),JSON.stringify(profile.conditionGuide),JSON.stringify(profile.refurbishmentSteps),JSON.stringify(profile.trustPoints),JSON.stringify(profile.dimensions),profile.comparisonProductIds,profile.bundleProductIds,JSON.stringify(profile.campaign)]);
  return profile;
};

export const persistFamily = async (client: TransactionClient, input: FamilySaveInput): Promise<string | null> => {
  const axes=Array.from(new Set((input.optionAxes??[]).map(axis=>familyText(axis,40)).filter(Boolean))).slice(0,6);
  const members=(input.members??[]).filter(member=>/^[0-9a-f-]{36}$/i.test(member.productId)).slice(0,100).map(member=>({...member,optionValues:{...normalizeFamilyOptionValues(axes,member.optionValues??{}),...(member.optionValues?.device===member.productId?{device:member.productId}:{})}}));
  if(!members.length){if(input.id){await client.query(`UPDATE product_families SET is_active=false,updated_at=now() WHERE id=$1`,[input.id]);await client.query(`DELETE FROM product_family_members WHERE family_id=$1`,[input.id]);}return null;}
  validateFamilyConfiguration(axes,members);
  const name=familyText(input.name,160);const slug=slugify(input.slug||name);if(!name||!slug)throw new Error("invalid_family");
  const result=input.id?await client.query(`UPDATE product_families SET name=$2,slug=$3,option_axes=$4::jsonb,is_active=$5,updated_at=now() WHERE id=$1 RETURNING id`,[input.id,name,slug,JSON.stringify(axes),input.isActive]):await client.query(`INSERT INTO product_families(name,slug,option_axes,is_active) VALUES($1,$2,$3::jsonb,$4) RETURNING id`,[name,slug,JSON.stringify(axes),input.isActive]);
  const familyId=String(result.rows[0]?.id??"");if(!familyId)throw new Error("family_not_found");await client.query(`DELETE FROM product_family_members WHERE family_id=$1`,[familyId]);
  for(let index=0;index<members.length;index+=1){const member=members[index];await client.query(`INSERT INTO product_family_members(family_id,product_id,option_values,position,is_active) VALUES($1,$2,$3::jsonb,$4,$5) ON CONFLICT(product_id) DO UPDATE SET family_id=excluded.family_id,option_values=excluded.option_values,position=excluded.position,is_active=excluded.is_active`,[familyId,member.productId,JSON.stringify(member.optionValues),member.position??index,member.isActive!==false]);}
  return familyId;
};

