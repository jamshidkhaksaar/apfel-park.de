export type AiTextField = 'title' | 'description';

export const normalizeAiTextFields = (value: unknown): AiTextField[] =>
  Array.isArray(value) ? (['title', 'description'] as const).filter(field => value.includes(field)) : [];

/** Called only when staff applies a research result. Later edits retain AI lineage. */
export const appliedResearchTextFields = (
  previous: unknown,
  research: { title?: unknown; description?: unknown },
): AiTextField[] => normalizeAiTextFields([
  ...normalizeAiTextFields(previous),
  ...(['title', 'description'] as const).filter(field => typeof research[field] === 'string' && research[field].trim()),
]);
