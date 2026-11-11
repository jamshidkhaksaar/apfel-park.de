export type AuditUnusedSourceResult = {
  checked: number;
  candidates: string[];
  computedImports: string[];
};

export function auditUnusedSource(options: { root: string }): AuditUnusedSourceResult;
