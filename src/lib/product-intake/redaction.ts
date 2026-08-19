import { SchemaValidationError } from './errors';

const forbiddenKey = /^(?:imei|eid|serial|serialnumber|seriennummer|seriennr)$/i;
const labelledSensitiveValue = /\b(?:imei|eid|serial(?:\s*(?:number|no\.?))?|serien\s*(?:nummer|nr\.?))\s*[:=#-]?\s*[a-z0-9][a-z0-9\s-]{5,}\b/i;
const standaloneImei = /(^|\D)\d{15}(?=\D|$)/;
const standaloneEid = /(^|\D)\d{32}(?=\D|$)/;

const inspect = (value: unknown, path: string, issues: string[], seen: Set<object>): void => {
  if (typeof value === 'string') {
    if (labelledSensitiveValue.test(value) || standaloneImei.test(value) || standaloneEid.test(value)) {
      issues.push(`${path} contains a prohibited device identifier`);
    }
    return;
  }
  if (value === null || typeof value !== 'object') return;
  if (seen.has(value)) {
    issues.push(`${path} contains a circular value`);
    return;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach((entry, index) => inspect(entry, `${path}[${index}]`, issues, seen));
  } else {
    for (const [key, entry] of Object.entries(value)) {
      if (forbiddenKey.test(key.replace(/[^a-z0-9]/gi, ''))) {
        issues.push(`${path}.${key} is a prohibited sensitive field`);
        continue;
      }
      inspect(entry, `${path}.${key}`, issues, seen);
    }
  }
  seen.delete(value);
};

export const findSensitiveDataIssues = (value: unknown): string[] => {
  const issues: string[] = [];
  inspect(value, '$', issues, new Set());
  return issues;
};

export const assertRedacted = (value: unknown): void => {
  const issues = findSensitiveDataIssues(value);
  if (issues.length > 0) throw new SchemaValidationError(issues);
};
