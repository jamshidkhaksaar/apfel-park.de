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
 * Validates that the file extension matches the MIME type.
 * This prevents extension spoofing (e.g. uploading .html as image/png).
 */
export const validateImageFileExtension = (file: File): boolean => {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  const allowedExtensions: Record<string, string[]> = {
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/webp": [".webp"],
    "image/svg+xml": [".svg"],
    "image/x-icon": [".ico"],
    "image/vnd.microsoft.icon": [".ico"],
    // Allow octet-stream for .ico as it's common for favicons
    "application/octet-stream": [".ico"],
  };

  const extensions = allowedExtensions[type];
  if (!extensions) return false;

  return extensions.some(ext => name.endsWith(ext));
};
