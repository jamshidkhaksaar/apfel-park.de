export type AuditUnusedSourceResult = {
  checked: number;
  entries: number;
  edges: number;
  candidates: string[];
  computedImports: string[];
  unresolvedAliases: string[];
};

export type AuditHealthInput = {
  checked: number;
  edges: number;
  minChecked: number;
  minEdges: number;
};

export function auditHealthProblems(input: AuditHealthInput): string[];

export function auditUnusedSource(options: { root: string }): AuditUnusedSourceResult;
