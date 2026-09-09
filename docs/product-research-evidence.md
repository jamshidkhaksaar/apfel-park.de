# Product research evidence boundaries

The staff-only `/api/admin/products/research` endpoint returns an editable draft. It never saves a product or changes stock, price, condition, publication state, GTIN or MPN.

## Research

The default model remains `gemini-3.7-flash`. `GEMINI_RESEARCH_MODEL` may select an explicitly configured compatible model. The key is sent only in the Gemini API header, never in a URL. There is no silent fallback to an older model's knowledge.

The discovery call proposes official URLs; its product facts are discarded. The server then fetches approved manufacturer/regulator pages, validates the destination on every redirect, bounds the response size, and checks the requested model. Published Product JSON-LD may supplement page text; scripts are not executed. A second call generates from this fresh source pack without further search tools. Missing sources, unusable output, private identifiers and unsupported model results fail without changing the form. Source titles, URLs, fetch dates and review notes are displayed to staff.

German Apple routes are preferred where their standard path exists. Regional SIM, battery endurance and weight claims are withheld without matching hardware evidence; store language alone does not establish a device's regional variant. Human review remains required. HTML/plain-text source support is currently implemented; PDF-only documentation requires a separate supported extraction path or manual review.

## Identifiers and offers

Only locally decoded, checksum-valid retail barcodes may appear as GTIN suggestions. Photo/OCR MPNs are suggestions, not automatically entered fields. Manufacturer colour/storage combinations are displayed as informational options, not created as stock offers. A blank SKU may receive a new internal `AP-…` code; an existing SKU and existing variants are preserved.

EPREL auto-fill requires an exact hardware/model identifier and matching supplier, without ambiguity. The candidate is checked against the live register. No class A or cycle-count default is fabricated. Register cycle units are converted using `eprelCycles`; missing values remain missing. Links to mirrored artwork are included only when files exist.

## Photo privacy

Research photos use the localhost OCR/redaction service at `127.0.0.1:8730`. The app uses `APFEL_INTAKE_VISION_TOKEN`, or the existing protected `/etc/apfel-intake-vision.env` token on the VPS. Only the hash-checked derivative from the generated run directory can reach Gemini. There is no raw-photo fallback.

The local extractor rejects recognizable identity, invoice and shipping documents. It masks detected device/account identifiers; About screens expose only recognized public device rows. A labelled serial value is not treated as a GTIN merely because its checksum is valid. OCR is fallible: staff should crop sensitive fields where possible and review warnings. The existing private-file retention/cleanup policy remains in effect. Research photos are not cover/gallery images.

## Licensed additional images

Search-index image results do not establish usage rights and are not downloaded. Additional images are selected only from an operator-maintained manifest:

`/srv/apfel-park/app/shared/licensed-product-images.json`

Start with an empty manifest; this does not assert any licence:

```json
{"version":1,"assets":[]}
```

Each real entry needs `brand`, exact `model`, `color`, optional `colorAliases`, `localUrl`, `sha256`, `sourceUrl`, `licenseReference`, and `rightsStatus: "licensed"`. Record only rights actually obtained for commercial use. Upload/optimize the permitted asset through the existing image workflow first; the manifest references its existing `/uploads/products/*.webp` URL and checksum. Keep private licence records out of Git and public pages.

The selector requires an exact model and requested colour, verifies the local WebP/checksum, and returns nothing for open-box/used devices. Missing records are non-blocking: staff uploads shop-owned photographs. Additional images never precede the original cover or shift existing variant image indices. The standard new-product form requires an owned cover after AI use.

## Testing and rollout

Focused TypeScript tests cover URL boundaries, evidence filtering, regional claims, exact EPREL matching, identifier/offer preservation, photo failures, authorization and CSRF. Python tests cover redaction and document rejection. Synthetic real-OCR fixtures are kept outside the repository. No real customer/KYC images should be used for diagnostics.

Deploy the matching local extractor with a recoverable code backup and a health check, then deploy the app through the atomic release process. Keep `PRODUCT_INTAKE_LIVE_ENABLED=false` and n8n v2 inactive unless the owner separately authorizes their rollout. The existing Merchant account restriction is not resolved by research-code changes or successful feed processing.
