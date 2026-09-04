import he from "he";

// Deliberately accept only a small static SVG language, not arbitrary XML that
// a denylist attempts to sanitize. Unknown syntax/namespaces fail closed. Logos
// using paths, shapes and local gradients remain vectors; CSS, links, entities,
// animation, foreign content and external resources must be exported as raster.
const staticSvgElements = new Set([
  "svg", "g", "defs", "path", "rect", "circle", "ellipse", "line", "polyline",
  "polygon", "title", "desc", "text", "tspan", "linearGradient", "radialGradient",
  "stop", "clipPath", "mask",
]);
const staticSvgAttributes = new Set([
  "id", "viewBox", "width", "height", "x", "y", "x1", "x2", "y1", "y2",
  "cx", "cy", "r", "rx", "ry", "dx", "dy", "d", "points", "transform",
  "fill", "fill-rule", "fill-opacity", "stroke", "stroke-width", "stroke-linecap",
  "stroke-linejoin", "stroke-miterlimit", "stroke-dasharray", "stroke-dashoffset",
  "stroke-opacity", "opacity", "clip-path", "clip-rule", "mask", "offset",
  "stop-color", "stop-opacity", "gradientUnits", "gradientTransform", "spreadMethod",
  "fx", "fy", "fr", "clipPathUnits", "maskUnits", "maskContentUnits",
  "preserveAspectRatio", "font-family", "font-size", "font-weight", "text-anchor",
  "dominant-baseline", "vector-effect",
]);

export const isSecureSvg = (content: string): boolean => {
  if (content.length > 1_000_000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F&]/.test(content)) return false;
  const input = content.trim().replace(/^<\?xml\s+version=["']1\.0["'](?:\s+encoding=["']UTF-8["'])?\s*\?>\s*/i, "");
  const stack: string[] = [];
  let rootSeen = false;
  let position = 0;
  while (position < input.length) {
    if (input[position] !== "<") {
      const next = input.indexOf("<", position);
      const end = next === -1 ? input.length : next;
      const text = input.slice(position, end);
      if (text.trim() && !["title", "desc", "text", "tspan"].includes(stack.at(-1) || "")) return false;
      position = end;
      continue;
    }
    const token = /^<(\/)?([A-Za-z]+)((?:\s+[A-Za-z][A-Za-z0-9-]*\s*=\s*(?:"[^"<>]*"|'[^'<>]*'))*)\s*(\/?)>/.exec(input.slice(position));
    if (!token) return false;
    const [, closing, name, attributes, selfClosing] = token;
    if (!staticSvgElements.has(name)) return false;
    if (closing) {
      if (attributes || selfClosing || stack.pop() !== name) return false;
    } else {
      if (!stack.length) {
        if (rootSeen || name !== "svg") return false;
        rootSeen = true;
      }
      const seen = new Set<string>();
      for (const attribute of attributes.matchAll(/([A-Za-z][A-Za-z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
        const key = attribute[1];
        const value = attribute[2] ?? attribute[3];
        if (seen.has(key)) return false;
        seen.add(key);
        if (key === "xmlns") {
          if (name !== "svg" || stack.length || value !== "http://www.w3.org/2000/svg") return false;
          continue;
        }
        if (!staticSvgAttributes.has(key) || !/^[a-zA-Z0-9\s#.,%()+-]*$/.test(value)) return false;
        if (/url\s*\(/i.test(value) && !/^(?:fill|stroke|clip-path|mask)$/.test(key)) return false;
        if (/url\s*\(/i.test(value) && !/^url\(#[a-zA-Z0-9_-]+\)$/.test(value)) return false;
      }
      if (!selfClosing) stack.push(name);
      if (stack.length > 100) return false;
    }
    position += token[0].length;
  }
  return rootSeen && stack.length === 0;
};

export const escapeHtml = (str: string): string => {
  if (!str) return "";
  return he.encode(str, { useNamedReferences: true });
};

export const isSafeRedirect = (value: string | null | undefined): boolean => {
  if (!value) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (/[\\\u0000-\u001F\u007F]/.test(value)) return false;
  // Reject encoded structural characters, including nested percent encodings.
  if (/%(?:25|2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(value)) return false;
  try {
    const origin = "https://apfel-park.de";
    return new URL(value, origin).origin === origin;
  } catch {
    return false;
  }
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
