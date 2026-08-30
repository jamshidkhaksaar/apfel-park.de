import { getProducts, type Product } from '@/lib/products';
import { validatedGtin } from '@/lib/product-identifiers';
import { germanyShippingAmount } from '@/lib/schema';
import { siteInfo } from '@/lib/site';

const categoryMap: Record<Product['category'], string> = {
  smartphones: 'Electronics > Communications > Telephony > Mobile Phones',
  tablets: 'Electronics > Computers > Tablet Computers',
  accessories: 'Electronics > Electronics Accessories',
  consoles: 'Electronics > Video Game Consoles',
  laptops: 'Electronics > Computers > Laptops',
};

const xmlEscape = (value: string | number): string =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const cleanText = (value: string, maxLength: number): string =>
  value.replace(/\s+/g, ' ').trim().slice(0, maxLength);

const stableSuffix = (value: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const variantTokenFor = (variant: Product["variants"][number] | undefined, index: number): string | undefined =>
  variant?.sku || [variant?.color, variant?.storage].filter(Boolean).join(" ") || (variant ? `variant-${index + 1}` : undefined);

export const googleMerchantItemId = (
  productId: string,
  variant: Product["variants"][number] | undefined,
  index: number,
): string => {
  const variantToken = variantTokenFor(variant, index);
  return variant
    ? `${productId.slice(0, 36)}-${stableSuffix(variantToken ?? `variant-${index + 1}`)}`
    : productId.slice(0, 50);
};

const absoluteUrl = (value: string): string => {
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value.startsWith('/') ? value : `/${value}`, siteInfo.url).toString();
};

const descriptionFor = (product: Product): string =>
  cleanText(
    product.description ||
      product.subtitle ||
      product.featureBullets.join(' ') ||
      `${product.title} bei ${siteInfo.name} in Hamburg.`,
    5000,
  );

const conditionFor = (product: Product): 'new' | 'used' =>
  product.condition === 'new' ? 'new' : 'used';

const itemXml = (product: Product, variant: Product["variants"][number] | undefined, index: number): string => {
  const price = variant?.price ?? product.price;
  const compareAtPrice = variant?.compareAtPrice ?? product.compareAtPrice;
  const hasSalePrice = Boolean(
    compareAtPrice && compareAtPrice > price,
  );
  const regularPrice = hasSalePrice ? compareAtPrice! : price;
  // Only a real manufacturer part number belongs here. Our own stock codes
  // used to be published as <g:mpn>, which asserted identifiers that do not exist.
  const mayUseProductIdentifier = !variant || product.variants.length === 1;
  const identifier = variant?.mpn?.trim() || (mayUseProductIdentifier ? product.mpn?.trim() : undefined);
  const gtin = validatedGtin(variant?.gtin || (mayUseProductIdentifier ? product.gtin : undefined));
  const identifierStatus = variant?.identifierStatus ?? (mayUseProductIdentifier ? product.identifierStatus : "unknown");
  const color = variant?.color;
  const storage = variant?.storage;
  const variantToken = variantTokenFor(variant, index);
  const itemId = googleMerchantItemId(product.id, variant, index);
  const link = `${siteInfo.url}/de/store/${product.slug}${variantToken ? `?variant=${encodeURIComponent(variantToken)}` : ""}`;
  const variantImages = variant?.images?.filter(Boolean) ?? [];
  const indexedImage = variant?.imageIndex !== undefined ? product.images[variant.imageIndex] : undefined;
  const primaryImage = variantImages[0] || indexedImage || product.image;
  const imagePool = variantImages.length > 0 ? variantImages : product.images;
  const additionalImages = imagePool
    .filter((image) => image !== primaryImage)
    .slice(0, 10)
    .map((image) => `      <g:additional_image_link>${xmlEscape(absoluteUrl(image))}</g:additional_image_link>`)
    .join('\n');
  const titleSuffix = [color, storage].filter(Boolean).join(" ");
  const title = titleSuffix && !product.title.toLowerCase().includes(titleSuffix.toLowerCase())
    ? `${product.title} ${titleSuffix}`
    : product.title;
  const googleCategory = product.marketplaceCategoryMappings?.google?.category || categoryMap[product.category];
  const variantOptions = variant
    ? [
        color
          ? [
              '      <g:variant_option>',
              '        <g:name>color</g:name>',
              `        <g:value>${xmlEscape(color)}</g:value>`,
              '      </g:variant_option>',
            ].join('\n')
          : '',
        storage
          ? [
              '      <g:variant_option>',
              '        <g:name>storage</g:name>',
              `        <g:value>${xmlEscape(storage)}</g:value>`,
              '      </g:variant_option>',
            ].join('\n')
          : '',
      ].filter(Boolean)
    : [];
  const certification = product.eprelId
    ? [
        '      <g:certification>',
        '        <g:certification_authority>EC</g:certification_authority>',
        '        <g:certification_name>EPREL</g:certification_name>',
        `        <g:certification_code>${xmlEscape(product.eprelId)}</g:certification_code>`,
        '      </g:certification>',
      ].join('\n')
    : '';

  return [
    '    <item>',
    `      <g:id>${xmlEscape(itemId)}</g:id>`,
    `      <g:title>${xmlEscape(cleanText(title, 150))}</g:title>`,
    `      <g:description>${xmlEscape(descriptionFor(product))}</g:description>`,
    `      <g:link>${xmlEscape(link)}</g:link>`,
    `      <g:image_link>${xmlEscape(absoluteUrl(primaryImage))}</g:image_link>`,
    additionalImages,
    `      <g:availability>${(variant?.stock ?? product.stock ?? 0) > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>`,
    `      <g:condition>${conditionFor(product)}</g:condition>`,
    `      <g:price>${regularPrice.toFixed(2)} EUR</g:price>`,
    hasSalePrice ? `      <g:sale_price>${price.toFixed(2)} EUR</g:sale_price>` : '',
    product.brand ? `      <g:brand>${xmlEscape(product.brand)}</g:brand>` : '',
    gtin ? `      <g:gtin>${xmlEscape(gtin)}</g:gtin>` : '',
    identifier ? `      <g:mpn>${xmlEscape(identifier)}</g:mpn>` : '',
    identifierStatus === "not_applicable" ? '      <g:identifier_exists>no</g:identifier_exists>' : '',
    variant ? `      <g:item_group_id>${xmlEscape(product.id)}</g:item_group_id>` : '',
    variant ? `      <g:item_group_title>${xmlEscape(cleanText(product.title, 150))}</g:item_group_title>` : '',
    ...variantOptions,
    color ? `      <g:color>${xmlEscape(color)}</g:color>` : '',
    `      <g:google_product_category>${xmlEscape(googleCategory)}</g:google_product_category>`,
    `      <g:product_type>${xmlEscape(product.category)}</g:product_type>`,
    `      <g:custom_label_0>${xmlEscape(product.condition)}</g:custom_label_0>`,
    certification,
    product.packageWeightKg ? `      <g:shipping_weight>${product.packageWeightKg.toFixed(3)} kg</g:shipping_weight>` : '',
    product.packageLengthCm ? `      <g:shipping_length>${product.packageLengthCm.toFixed(2)} cm</g:shipping_length>` : '',
    product.packageWidthCm ? `      <g:shipping_width>${product.packageWidthCm.toFixed(2)} cm</g:shipping_width>` : '',
    product.packageHeightCm ? `      <g:shipping_height>${product.packageHeightCm.toFixed(2)} cm</g:shipping_height>` : '',
    '      <g:shipping>',
    '        <g:country>DE</g:country>',
    '        <g:service>Standard</g:service>',
    `        <g:price>${germanyShippingAmount().toFixed(2)} EUR</g:price>`,
    '      </g:shipping>',
    '    </item>',
  ].filter(Boolean).join('\n');
};

export const buildGoogleMerchantFeedForProducts = (products: Product[]): string => {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '  <channel>',
    `    <title>${xmlEscape(siteInfo.name)} Produktfeed</title>`,
    `    <link>${xmlEscape(siteInfo.url)}</link>`,
    `    <description>${xmlEscape('Smartphones, Tablets und Zubehör von Apfel Park.')}</description>`,
    ...products.flatMap((product) =>
      product.variants.length > 0
        ? product.variants.map((variant, index) => itemXml(product, variant, index))
        : [itemXml(product, undefined, 0)],
    ),
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
};

export const buildGoogleMerchantFeed = async (): Promise<string> =>
  buildGoogleMerchantFeedForProducts(
    await getProducts(undefined, undefined, 'de', { failOnError: true }),
  );
