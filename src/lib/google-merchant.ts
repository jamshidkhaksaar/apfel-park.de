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

const itemXml = (product: Product): string => {
  const hasSalePrice = Boolean(
    product.compareAtPrice && product.compareAtPrice > product.price,
  );
  const regularPrice = hasSalePrice ? product.compareAtPrice! : product.price;
  // Only a real manufacturer part number belongs here. Our own stock codes
  // used to be published as <g:mpn>, which asserted identifiers that do not exist.
  const identifier = product.mpn?.trim();
  const gtin = validatedGtin(product.gtin);
  const defaultColor = product.variants.find((variant) => variant.isDefault)?.color || product.variants[0]?.color;
  const additionalImages = product.images
    .slice(1, 11)
    .map((image) => `      <g:additional_image_link>${xmlEscape(absoluteUrl(image))}</g:additional_image_link>`)
    .join('\n');

  return [
    '    <item>',
    `      <g:id>${xmlEscape(product.id)}</g:id>`,
    `      <g:title>${xmlEscape(cleanText(product.title, 150))}</g:title>`,
    `      <g:description>${xmlEscape(descriptionFor(product))}</g:description>`,
    `      <g:link>${xmlEscape(`${siteInfo.url}/de/store/${product.slug}`)}</g:link>`,
    `      <g:image_link>${xmlEscape(absoluteUrl(product.image))}</g:image_link>`,
    additionalImages,
    `      <g:availability>${(product.stock ?? 0) > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>`,
    `      <g:condition>${conditionFor(product)}</g:condition>`,
    `      <g:price>${regularPrice.toFixed(2)} EUR</g:price>`,
    hasSalePrice ? `      <g:sale_price>${product.price.toFixed(2)} EUR</g:sale_price>` : '',
    product.brand ? `      <g:brand>${xmlEscape(product.brand)}</g:brand>` : '',
    gtin ? `      <g:gtin>${xmlEscape(gtin)}</g:gtin>` : '',
    identifier ? `      <g:mpn>${xmlEscape(identifier)}</g:mpn>` : '',
    defaultColor ? `      <g:color>${xmlEscape(defaultColor)}</g:color>` : '',
    `      <g:google_product_category>${xmlEscape(categoryMap[product.category])}</g:google_product_category>`,
    `      <g:product_type>${xmlEscape(product.category)}</g:product_type>`,
    `      <g:custom_label_0>${xmlEscape(product.condition)}</g:custom_label_0>`,
    '      <g:shipping>',
    '        <g:country>DE</g:country>',
    '        <g:service>Standard</g:service>',
    `        <g:price>${germanyShippingAmount().toFixed(2)} EUR</g:price>`,
    '      </g:shipping>',
    '    </item>',
  ].filter(Boolean).join('\n');
};

export const buildGoogleMerchantFeed = async (): Promise<string> => {
  const products = await getProducts(undefined, undefined, 'de');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '  <channel>',
    `    <title>${xmlEscape(siteInfo.name)} Produktfeed</title>`,
    `    <link>${xmlEscape(siteInfo.url)}</link>`,
    `    <description>${xmlEscape('Smartphones, Tablets, Zubehör, Konsolen und Laptops von Apfel Park.')}</description>`,
    ...products.map(itemXml),
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
};
