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

export interface ContactFormInput {
  name: string;
  email: string;
  device?: string;
  message: string;
}

export const validateContactForm = (
  data: ContactFormInput,
): { isValid: boolean; error?: string } => {
  if (!data.name || !data.email || !data.message) {
    return { isValid: false, error: "Missing required fields" };
  }

  // Max lengths to prevent DoS/Storage exhaustion
  const MAX_NAME_LENGTH = 100;
  const MAX_EMAIL_LENGTH = 254;
  const MAX_DEVICE_LENGTH = 100;
  const MAX_MESSAGE_LENGTH = 5000;

  if (data.name.length > MAX_NAME_LENGTH) {
    return {
      isValid: false,
      error: `Name is too long (max ${MAX_NAME_LENGTH} chars)`,
    };
  }
  if (data.email.length > MAX_EMAIL_LENGTH) {
    return {
      isValid: false,
      error: `Email is too long (max ${MAX_EMAIL_LENGTH} chars)`,
    };
  }
  if (data.device && data.device.length > MAX_DEVICE_LENGTH) {
    return {
      isValid: false,
      error: `Device name is too long (max ${MAX_DEVICE_LENGTH} chars)`,
    };
  }
  if (data.message.length > MAX_MESSAGE_LENGTH) {
    return {
      isValid: false,
      error: `Message is too long (max ${MAX_MESSAGE_LENGTH} chars)`,
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { isValid: false, error: "Invalid email format" };
  }

  return { isValid: true };
};
