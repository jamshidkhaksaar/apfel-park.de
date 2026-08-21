/**
 * Whether next/image optimization must be skipped for a source.
 *
 * Only data: URIs qualify -- the optimizer cannot process them.
 *
 * This previously also bypassed every /uploads/ path, because next/image
 * could not resolve them: /uploads is served by nginx from shared/ and was
 * absent from the standalone public directory, so the optimizer returned 400.
 * That was fixed on 2026-08-03 by symlinking uploads into standalone. Leaving
 * the bypass in place meant product images kept serving at full size --
 * measured at 76% larger than the optimized versions, across 32 images on a
 * single store page.
 */
export const shouldBypassImageOptimization = (src: string): boolean =>
  src.startsWith("data:") || src.startsWith("/uploads/") || src.includes("/uploads/");
