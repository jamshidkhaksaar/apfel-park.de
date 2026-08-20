export const productIntakeScopes = [
  "commerce",
  "content",
  "identifiers",
  "specifications",
  "compliance",
  "images",
  "full_review",
] as const;
export type ProductIntakeScope = (typeof productIntakeScopes)[number];

export const productIntakeWorkspaceViews = ["catalog", "intake", "history"] as const;
export type ProductIntakeWorkspaceView = (typeof productIntakeWorkspaceViews)[number];

export const allowedAcceptedPaths = [
  "changes.price",
  "changes.inventory",
  "product.title",
  "product.brand",
  "product.model",
  "product.hardwareModel",
  "product.storage",
  "product.color",
  "product.category",
  "product.batteryHealth",
  "listingPreview.de",
  "listingPreview.en",
  "images",
] as const;
export type ProductIntakeAcceptedPath = (typeof allowedAcceptedPaths)[number];
