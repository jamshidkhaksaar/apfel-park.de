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

export const isSafeRedirect = (to: string): boolean => {
  if (!to || typeof to !== "string") {
    return false;
  }

  // Prevent open redirects (//, http:, https:, /\)
  if (
    to.startsWith("//") ||
    to.startsWith("http:") ||
    to.startsWith("https:") ||
    to.startsWith("/\\") ||
    to.trim() !== to // Prevent whitespace bypasses
  ) {
    return false;
  }

  // Must start with /
  return to.startsWith("/");
};
