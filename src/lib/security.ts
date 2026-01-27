export const isSecureSvg = (content: string): boolean => {
  if (/<script/i.test(content)) return false;
  if (/javascript:/i.test(content)) return false;
  if (/on\w+\s*=/i.test(content)) return false;
  if (/<foreignObject/i.test(content)) return false;

  // Block dangerous data: URIs
  if (/data:(?:image\/svg\+xml|text\/html)/i.test(content)) return false;

  // Check for entity-encoded javascript:
  const decodedContent = content.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
                                .replace(/&#([0-9]+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  if (/javascript:/i.test(decodedContent)) return false;

  return true;
};
