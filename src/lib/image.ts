/**
 * Whether next/image optimization must be skipped for a source.
 *
 * Runtime uploads are available through the public `/uploads/**` symlink and
 * are explicitly allowed by next.config.ts, so Next can resize and transcode
 * them safely. Inline data/blob sources cannot go through the optimizer.
 */
export const shouldBypassImageOptimization = (src: string): boolean =>
  !src || src.startsWith("data:") || src.startsWith("blob:");
