type FamilyMemberInput = {
  productId: string;
  optionValues: Record<string, string>;
  isActive?: boolean;
};

export const normalizeFamilyOptionValues = (axes: string[], values: Record<string, string>): Record<string, string> => Object.fromEntries(
  axes.map((axis) => axis.trim()).filter(Boolean).map((axis) => [axis, typeof values?.[axis] === "string" ? values[axis].trim().slice(0, 100) : ""]).filter(([, value]) => Boolean(value)),
);

export const validateFamilyConfiguration = (axes: string[], members: FamilyMemberInput[]): void => {
  const normalizedAxes = axes.map((axis) => axis.trim()).filter(Boolean);
  const combinations = new Set<string>();
  for (const member of members.filter((item) => item.isActive !== false)) {
    const values = normalizedAxes.map((axis) => member.optionValues?.[axis]?.trim() || "");
    if (values.some((value) => !value)) throw new Error("family_axis_value_required");
    const combination = JSON.stringify(values.map((value) => value.toLocaleLowerCase("en-US")));
    if (combinations.has(combination)) throw new Error("duplicate_family_combination");
    combinations.add(combination);
  }
};
