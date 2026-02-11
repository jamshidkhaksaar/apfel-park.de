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

export const validateImageFileExtension = (filename: string, mimeType: string): boolean => {
  const ext = filename.toLowerCase().split('.').pop();
  if (!ext) return false;

  const validExtensions: Record<string, string[]> = {
    'image/png': ['png'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/jpg': ['jpg', 'jpeg'],
    'image/svg+xml': ['svg'],
    'image/webp': ['webp'],
    'image/gif': ['gif'],
    'image/x-icon': ['ico'],
    'image/vnd.microsoft.icon': ['ico'],
    'application/octet-stream': ['ico'],
  };

  const allowed = validExtensions[mimeType];
  return allowed ? allowed.includes(ext) : false;
};
