import type { SqlExecutor } from './repository-types';
import { conditionToDatabaseValues } from './schemas';
import type {
  ProductMatchCandidate,
  ProductMatchInput,
  ProductMatchResult,
  ProductMatchStrategy,
} from './types';

export type ProductMatchLookup = {
  byProductId: (productId: string) => Promise<ProductMatchCandidate[]>;
  bySku: (sku: string) => Promise<ProductMatchCandidate[]>;
  byGtinAndCondition: (gtin: string, conditions: string[]) => Promise<ProductMatchCandidate[]>;
  byMpnAndCondition: (mpn: string, conditions: string[]) => Promise<ProductMatchCandidate[]>;
  byHardwareModelAndCondition: (
    hardwareModel: string,
    storage: string | null,
    color: string | null,
    conditions: string[],
  ) => Promise<ProductMatchCandidate[]>;
  byModelVariantAndCondition: (
    model: string,
    storage: string,
    color: string,
    conditions: string[],
  ) => Promise<ProductMatchCandidate[]>;
  byNormalizedModelAndCondition: (model: string, conditions: string[]) => Promise<ProductMatchCandidate[]>;
};

export const normalizeMatchText = (value: string): string => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '');

const uniqueCandidates = (candidates: ProductMatchCandidate[]): ProductMatchCandidate[] => {
  const byId = new Map<string, ProductMatchCandidate>();
  for (const candidate of candidates) {
    if (!byId.has(candidate.id)) byId.set(candidate.id, candidate);
  }
  return [...byId.values()].sort((left, right) => `${left.id}:${left.sku ?? ''}`.localeCompare(`${right.id}:${right.sku ?? ''}`));
};

const resultFor = (strategy: ProductMatchStrategy, candidates: ProductMatchCandidate[]): ProductMatchResult => {
  const unique = uniqueCandidates(candidates);
  if (unique.length === 0) return { state: 'none', strategy, candidates: [], productId: null };
  if (unique.length === 1) return { state: 'exact', strategy, candidates: unique, productId: unique[0].id };
  return { state: 'ambiguous', strategy, candidates: unique, productId: null };
};

const refineVariant = (input: ProductMatchInput, candidates: ProductMatchCandidate[]): ProductMatchCandidate[] => candidates.filter((candidate) => {
  if (input.storage && (!candidate.storage || normalizeMatchText(input.storage) !== normalizeMatchText(candidate.storage))) return false;
  if (input.color && (!candidate.color || normalizeMatchText(input.color) !== normalizeMatchText(candidate.color))) return false;
  return true;
});

const matchesAllSupplied = (input: ProductMatchInput, candidate: ProductMatchCandidate): boolean => {
  const conditions = conditionToDatabaseValues(input.condition);
  if (!conditions.includes(candidate.condition)) return false;
  const pairs: Array<[string | null, string | null]> = [
    [input.sku, candidate.sku],
    [input.gtin, candidate.gtin],
    [input.mpn, candidate.mpn],
    [input.hardwareModel, candidate.hardwareModel],
    [input.model, candidate.model],
    [input.storage, candidate.storage],
    [input.color, candidate.color],
  ];
  return pairs.every(([expected, actual]) =>
    !expected || Boolean(actual && normalizeMatchText(expected) === normalizeMatchText(actual)),
  );
};

export const findSafeProductMatch = async (
  input: ProductMatchInput,
  lookup: ProductMatchLookup,
): Promise<ProductMatchResult> => {
  if (input.productId) {
    const byId = await lookup.byProductId(input.productId);
    return resultFor('product_id', byId.filter((candidate) => matchesAllSupplied(input, candidate)));
  }
  if (input.sku) {
    const match = resultFor('sku', (await lookup.bySku(input.sku)).filter((candidate) => matchesAllSupplied(input, candidate)));
    if (match.state !== 'none') return match;
  }

  const conditions = conditionToDatabaseValues(input.condition);
  if (input.gtin) {
    const match = resultFor('gtin_condition', refineVariant(input, await lookup.byGtinAndCondition(input.gtin, conditions)));
    if (match.state !== 'none') return match;
  }
  if (input.mpn) {
    const match = resultFor('mpn_condition', refineVariant(input, await lookup.byMpnAndCondition(input.mpn, conditions)));
    if (match.state !== 'none') return match;
  }
  if (input.hardwareModel) {
    const match = resultFor(
      'hardware_model_condition',
      refineVariant(
        input,
        await lookup.byHardwareModelAndCondition(input.hardwareModel, input.storage, input.color, conditions),
      ),
    );
    if (match.state !== 'none') return match;
  }
  if (input.model && input.storage && input.color) {
    const variantMatch = resultFor(
      'model_variant_condition',
      await lookup.byModelVariantAndCondition(
        normalizeMatchText(input.model),
        normalizeMatchText(input.storage),
        normalizeMatchText(input.color),
        conditions,
      ),
    );
    if (variantMatch.state !== 'none') return variantMatch;
    return variantMatch;
  }
  if (input.model && (input.storage || input.color)) {
    return { state: 'none', strategy: 'model_variant_condition', candidates: [], productId: null };
  }
  if (input.model) {
    return resultFor(
      'normalized_model_condition',
      await lookup.byNormalizedModelAndCondition(normalizeMatchText(input.model), conditions),
    );
  }
  return { state: 'none', strategy: null, candidates: [], productId: null };
};

type MatchRow = {
  id: string;
  title: string;
  slug: string | null;
  condition: string;
  sku: string | null;
  gtin: string | null;
  mpn: string | null;
  hardware_model: string | null;
  model: string | null;
  storage: string | null;
  color: string | null;
};

const rowsToCandidates = (rows: MatchRow[]): ProductMatchCandidate[] => rows.map((row) => ({
  id: String(row.id),
  title: String(row.title),
  slug: row.slug ? String(row.slug) : null,
  condition: String(row.condition),
  sku: row.sku ? String(row.sku) : null,
  gtin: row.gtin ? String(row.gtin) : null,
  mpn: row.mpn ? String(row.mpn) : null,
  hardwareModel: row.hardware_model ? String(row.hardware_model) : null,
  model: row.model ? String(row.model) : null,
  storage: row.storage ? String(row.storage) : null,
  color: row.color ? String(row.color) : null,
}));

const variantJoin = `
  left join lateral jsonb_array_elements(
    case when jsonb_typeof(product.variants) = 'array' then product.variants else '[]'::jsonb end
  ) as variant(value) on true`;

const projection = `
  select distinct product.id, product.title, product.slug, product.condition,
         coalesce(nullif(btrim(variant.value ->> 'sku'), ''), nullif(btrim(product.sku), '')) as sku,
         coalesce(nullif(btrim(variant.value ->> 'gtin'), ''), nullif(btrim(product.gtin), '')) as gtin,
         coalesce(nullif(btrim(variant.value ->> 'mpn'), ''), nullif(btrim(product.mpn), '')) as mpn,
         product.hardware_model,
         product.model,
         nullif(btrim(variant.value ->> 'storage'), '') as storage,
         nullif(btrim(variant.value ->> 'color'), '') as color
    from products product`;

export const createPostgresProductMatchLookup = (executor: SqlExecutor): ProductMatchLookup => {
  const run = async (sql: string, values: unknown[]): Promise<ProductMatchCandidate[]> => {
    const response = await executor.query<MatchRow>(sql, values);
    return rowsToCandidates(response.rows);
  };
  return {
    byProductId: (productId) => run(`${projection}${variantJoin} where product.id = $1::uuid`, [productId]),
    bySku: (sku) => run(
      `${projection}${variantJoin}
       left join inventory_skus inventory
         on inventory.product_id = product.id and inventory.location = 'local'
      where lower(btrim(product.sku)) = lower(btrim($1))
         or lower(btrim(variant.value ->> 'sku')) = lower(btrim($1))
         or lower(btrim(inventory.sku)) = lower(btrim($1))`,
      [sku],
    ),
    byGtinAndCondition: (gtin, conditions) => run(
      `${projection}${variantJoin}
       where product.condition = any($2::text[])
         and (btrim(product.gtin) = $1 or btrim(variant.value ->> 'gtin') = $1)`,
      [gtin, conditions],
    ),
    byMpnAndCondition: (mpn, conditions) => run(
      `${projection}${variantJoin}
       where product.condition = any($2::text[])
         and (
           lower(btrim(product.mpn)) = lower(btrim($1))
           or lower(btrim(variant.value ->> 'mpn')) = lower(btrim($1))
         )`,
      [mpn, conditions],
    ),
    byHardwareModelAndCondition: (hardwareModel, storage, color, conditions) => run(
      `${projection}${variantJoin}
       where product.condition = any($4::text[])
         and lower(btrim(coalesce(product.hardware_model, ''))) = lower(btrim($1))
         and ($2::text is null or lower(regexp_replace(coalesce(variant.value ->> 'storage', ''), '[^a-zA-Z0-9]+', '', 'g')) = $2)
         and ($3::text is null or lower(regexp_replace(coalesce(variant.value ->> 'color', ''), '[^a-zA-Z0-9]+', '', 'g')) = $3)`,
      [hardwareModel, storage ? normalizeMatchText(storage) : null, color ? normalizeMatchText(color) : null, conditions],
    ),
    byModelVariantAndCondition: (model, storage, color, conditions) => run(
      `${projection}${variantJoin}
       where product.condition = any($4::text[])
         and lower(regexp_replace(coalesce(product.model, ''), '[^a-zA-Z0-9]+', '', 'g')) = $1
         and lower(regexp_replace(coalesce(variant.value ->> 'storage', ''), '[^a-zA-Z0-9]+', '', 'g')) = $2
         and lower(regexp_replace(coalesce(variant.value ->> 'color', ''), '[^a-zA-Z0-9]+', '', 'g')) = $3`,
      [model, storage, color, conditions],
    ),
    byNormalizedModelAndCondition: (model, conditions) => run(
      `${projection}${variantJoin}
       where product.condition = any($2::text[])
         and lower(regexp_replace(coalesce(product.model, ''), '[^a-zA-Z0-9]+', '', 'g')) = $1`,
      [model, conditions],
    ),
  };
};
