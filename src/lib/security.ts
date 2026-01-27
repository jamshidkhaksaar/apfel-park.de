export const isSecureSvg = (content: string): boolean => {
  if (/<script/i.test(content)) return false;
  if (/javascript:/i.test(content)) return false;
  if (/on\w+\s*=/i.test(content)) return false;
  if (/<foreignObject/i.test(content)) return false;
  return true;
};
