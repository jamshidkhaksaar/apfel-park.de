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
 * Validates a redirect URL to prevent Open Redirect vulnerabilities.
 * Ensures the URL is a relative path starting with / and not // or containing \.
 */
export const isSafeRedirect = (to: string | null | undefined): boolean => {
  if (!to || typeof to !== "string") {
    return false;
  }

  // Must start with /
  if (!to.startsWith("/")) {
    return false;
  }

  // Prevent double slashes (protocol relative URLs)
  if (to.startsWith("//")) {
    return false;
  }

  // Prevent backslashes which can be interpreted as slashes by some browsers
  if (to.includes("\\")) {
    return false;
  }

  // Prevent control characters (e.g. newline, null byte)
  if (/[\x00-\x1F\x7F]/.test(to)) {
    return false;
  }

  return true;
};
