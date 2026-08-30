export const resolveLegacyDraftPolicy = ({
  updateExisting,
  existingIsActive,
}: {
  updateExisting: boolean;
  existingIsActive: boolean | null;
}) => ({
  isActive: false as const,
  allowWrite: !(updateExisting && existingIsActive === true),
});
