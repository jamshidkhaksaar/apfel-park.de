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

/**
 * Validates email format and length.
 * Enforces a reasonable length limit (254 chars) and standard format.
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || email.length > 254) return false;

  // Standard email regex that doesn't allow spaces and requires domain part
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates input length to prevent DoS via massive payloads.
 */
export const isValidInputLength = (input: string, maxLength: number): boolean => {
  if (!input) return true; // Empty input is valid for length check (validation logic handles required fields)
  return input.length <= maxLength;
};

/**
 * Sanitizes input by trimming whitespace.
 * Handles non-string inputs by returning empty string.
 */
export const sanitizeInput = (input: unknown): string => {
  if (typeof input !== "string") return "";
  return input.trim();
};

export const safeJsonStringify = (value: unknown): string => {
  const json = JSON.stringify(value);
  if (typeof json !== "string") return "null";

  return json.replace(/[<>\u2028\u2029]/g, (char) => {
    switch (char) {
      case "<":
        return "\\u003c";
      case ">":
        return "\\u003e";
      case "\u2028":
        return "\\u2028";
      case "\u2029":
        return "\\u2029";
      default:
        return char;
    }
  });
};
