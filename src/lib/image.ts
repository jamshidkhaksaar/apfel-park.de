/**
 * Whether next/image optimization must be skipped for a source.
 *
 * /uploads/ is served directly by Nginx from /srv/apfel-park/app/shared/uploads/
 * where images are already saved in optimized WebP format. Bypassing Next.js
 * internal image optimization prevents 400 errors for runtime user uploads.
 */
export const shouldBypassImageOptimization = (src: string): boolean =>
  !src || src.startsWith("data:") || src.startsWith("/uploads/");
