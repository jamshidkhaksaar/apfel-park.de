const present = (value: unknown): boolean => value !== undefined && value !== null && (typeof value !== 'string' || value.trim() !== '');

export const validEnergyEndurance = (value: unknown): boolean => {
  if (typeof value !== 'string' || value.length > 80) return false;
  const text = value.trim();
  const hours = text.match(/^(\d+(?:[.,]\d+)?)\s*(?:h|hrs?|hours?|std\.?|stunden?)(?:\s*(\d{1,2})\s*(?:min\.?|minutes?|minuten?))?$/i);
  const clock = text.match(/^(\d+):([0-5]\d)$/);
  const minutes = text.match(/^(\d+)\s*(?:min\.?|minutes?|minuten?)$/i);
  const total = hours ? Number(hours[1].replace(',', '.')) * 60 + Number(hours[2] ?? 0)
    : clock ? Number(clock[1]) * 60 + Number(clock[2])
      : minutes ? Number(minutes[1]) : NaN;
  return Number.isFinite(total) && total > 0 && total <= Number.MAX_SAFE_INTEGER && (!hours?.[2] || Number(hours[2]) < 60);
};

/** Syntax is not supplier verification. Missing fields remain allowed in drafts. */
export const energyLabelError = (label: unknown, eprelId: unknown, publishing = false): 'format' | 'reference' | null => {
  const hasReference = typeof eprelId === 'string' && /^[1-9]\d{0,15}$/.test(eprelId.trim());
  if (present(eprelId) && !hasReference) return 'format';
  if (label === undefined || label === null) return null;
  if (typeof label !== 'object' || Array.isArray(label)) return 'format';
  const data = label as Record<string, unknown>;
  for (const [field, pattern] of [['efficiencyClass', /^[A-G]$/], ['reliabilityClass', /^[A-E]$/], ['repairabilityClass', /^[A-E]$/], ['ipRating', /^(?:IP[0-6X][0-9X]|IP[0-6X]9K)$/]] as const) {
    if (present(data[field]) && (typeof data[field] !== 'string' || !pattern.test(data[field].trim().toUpperCase()))) return 'format';
  }
  if (present(data.batteryEndurance) && !validEnergyEndurance(data.batteryEndurance)) return 'format';
  if (present(data.batteryCycles) && (typeof data.batteryCycles !== 'number' || !Number.isSafeInteger(data.batteryCycles) || data.batteryCycles <= 0)) return 'format';
  const claims = ['efficiencyClass', 'reliabilityClass', 'repairabilityClass', 'batteryEndurance', 'batteryCycles'].some(key => present(data[key]));
  return publishing && claims && !hasReference ? 'reference' : null;
};
