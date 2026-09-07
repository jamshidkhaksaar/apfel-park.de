# Apfel Park category photography and brand-card refresh

Created 7 September 2026 with the built-in image-generation tool.

## Deliverables

`webp/` contains four 800 × 600 category illustrations. Original generated PNGs remain in `originals/` with their generation provenance. WebP derivatives include an IPTC DigitalSourceType of trainedAlgorithmicMedia; re-encoding does not preserve the signed C2PA manifest, so originals are retained. These are illustrative category photographs, not exact stock photography, staff portraits, or customer endorsements. A localized disclosure is shown below the category cards. No product listing photographs or Merchant feeds were modified.

`brands/google-wordmark.svg` was downloaded unchanged from Google's official asset host:
https://www.gstatic.com/images/branding/googlelogo/svg/googlelogo_clr_74x24px.svg

Other brand marks use the project's existing Simple Icons 16.29.0 package (server-side SVG paths), with its listed manufacturer sources:
- Apple: https://www.apple.com
- Samsung: https://www.samsung.com/us/about-us/brand-identity/logo/
- Xiaomi: https://www.mi.com/global
- Huawei: https://e.huawei.com/ph/material/partner/0a72728b864949c48b22106454352483

Brand marks identify product categories only. They do not claim certified reseller or manufacturer partnership status. Trademark rights remain with the respective owners.

## Generation prompt set

Each scene used the following shared prefix and suffix, with its scene paragraph in between.

Prefix: Use case: photorealistic-natural. Asset type: premium ecommerce accessory category card for Apfel Park. Create ONE photographic image, landscape 4:3 composition.

### Cases
A candid close-up of an adult woman in a cream knit sweater holding a smartphone in an elegant matte taupe protective case at a sunlit Hamburg cafe. Three-quarter back of phone prominently visible, her natural hands and partial relaxed face in background. The CASE is the unmistakable focal point.

### Audio
A candid portrait of an adult man with short dark hair wearing cream over-ear wireless headphones on a quiet Hamburg street, eyes open, relaxed expression, beige jacket. Headphones prominently framed, natural face and believable proportions. Headphones are the unmistakable focal point.

### Charging
A candid close-up of an adult person in a cream shirt at a pale oak desk connecting a white USB-C cable to an unbranded smartphone beside a compact cream power bank. Natural hands, realistic connector alignment, small part of person's torso visible. Cable and charging accessories are the focal point.

### Protection
A meticulous close-up of an adult person's natural hands aligning one clear tempered glass screen protector just above the screen of an unbranded smartphone on a cream work mat in a clean modern electronics shop. A softly blurred cream-shirted torso in background. Transparent protector edges and pristine phone are clearly visible. Realistic hands and single protector.

Suffix: Professional editorial lifestyle photography, authentic skin texture, soft window light, ivory/oatmeal/warm grey palette and restrained gold warmth, sharp focal accessory, softly blurred uncluttered background. Framing must remain legible as a small 400px-wide category thumbnail. Main subject centered with safe margins for cropping. No text, no logos, no watermarks, no composite grid, no illustration, no fake website interface. Generic accessory design, do not depict identifiable customers or staff.
