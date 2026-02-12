import he from "he";

export const isSecureSvg = (content: string): boolean => {
  const decodedContent = he.decode(content);

  // Prevent bypass via encoding (e.g. UTF-16) that leaves null bytes
  if (decodedContent.includes("\0")) return false;

  if (/<script/i.test(decodedContent)) return false;
  if (/javascript:/i.test(decodedContent)) return false;
  if (/on\w+\s*=/i.test(decodedContent)) return false;
  if (/<foreignObject/i.test(decodedContent)) return false;

  // Block SMIL animation tags and external references
  if (/<(?:set|animate|animateMotion|animateTransform|use)/i.test(decodedContent)) return false;

  // Block dangerous data: URIs
  if (/data:(?:image\/svg\+xml|text\/html)/i.test(decodedContent)) return false;

  return true;
};

export const escapeHtml = (str: string): string => {
  if (!str) return "";
  return he.encode(str, { useNamedReferences: true });
};

/**
 * Validates a URL for safe internal redirection.
 * Ensures the URL is relative (starts with /) and prevents open redirects.
 */
export const isSafeRedirect = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== "string") return false;

  // Must start with / to be a relative path
  if (!url.startsWith("/")) return false;

  // Prevent protocol-relative URLs (//example.com)
  if (url.startsWith("//")) return false;

  // Prevent backslash usage which some browsers treat as path separators
  // or could be part of esoteric open redirect payloads
  if (url.includes("\\")) return false;

  return true;
};
