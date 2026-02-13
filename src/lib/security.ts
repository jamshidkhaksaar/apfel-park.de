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
 * Validates that the file extension matches the provided MIME type.
 * This prevents MIME type spoofing (e.g. uploading a .exe as image/png).
 */
export const validateImageFileExtension = (filename: string, mimeType: string): boolean => {
  if (!filename || !mimeType) return false;

  const parts = filename.toLowerCase().split('.');
  if (parts.length < 2) return false;

  const ext = parts.pop();
  if (!ext) return false;

  switch (mimeType.toLowerCase()) {
    case 'image/png':
      return ext === 'png';
    case 'image/jpeg':
      return ext === 'jpg' || ext === 'jpeg';
    case 'image/webp':
      return ext === 'webp';
    case 'image/svg+xml':
      return ext === 'svg';
    case 'image/gif':
      return ext === 'gif';
    case 'image/x-icon':
    case 'image/vnd.microsoft.icon':
      return ext === 'ico';
    case 'application/octet-stream':
      // Often used for .ico files when mime type detection fails or is generic
      return ext === 'ico';
    default:
      return false;
  }
};
