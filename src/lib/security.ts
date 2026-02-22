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

export const isSafeRedirect = (value: string | null | undefined): boolean => {
  if (!value) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (/[\u0000-\u001F\u007F]/.test(value)) return false;
  return true;
};

/**
 * Validates email format and length.
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || email.length > 254) return false;
  // Standard email regex for web applications
  // Enforces at least one dot in domain and 2+ char TLD
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validates that the input is a string and does not exceed the maximum length.
 */
export const isValidInputLength = (input: unknown, maxLength: number): boolean => {
  if (typeof input !== "string") return false;
  return input.length <= maxLength;
};

/**
 * Sanitizes input string by trimming whitespace and removing null bytes.
 * Returns empty string if input is not a string.
 */
export const sanitizeInput = (input: unknown): string => {
  if (typeof input !== "string") return "";
  // Remove null bytes and trim
  return input.replace(/\0/g, "").trim();
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
