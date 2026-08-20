import { canonicalJsonHash } from "./json";
import { assertRedacted } from "./redaction";
import { productIntakeConditions, type JsonObject, type ProductIntakeCondition, type ProductIntakeRun, type ProductIntakeStatus } from "./types";
import {
  allowedAcceptedPaths,
  productIntakeScopes,
  productIntakeWorkspaceViews,
  type ProductIntakeAcceptedPath,
  type ProductIntakeScope,
  type ProductIntakeWorkspaceView,
} from "./workspace-constants";

export { productIntakeConditions };
export {
  allowedAcceptedPaths,
  productIntakeScopes,
  productIntakeWorkspaceViews,
  type ProductIntakeAcceptedPath,
  type ProductIntakeScope,
  type ProductIntakeWorkspaceView,
};

export const productIntakeDispatchStatuses = [
  "queued",
  "collecting",
  "ready_for_review",
  "shadow",
  "stale",
  "applied",
  "blocked",
  "rejected",
  "cancelled",
] as const;
export type ProductIntakeDispatchStatus = (typeof productIntakeDispatchStatuses)[number];

const TERMINAL_STATUSES = new Set<ProductIntakeStatus>(["applied", "rejected", "cancelled"]);

export const catalogConditionToIntake = (condition: string | null | undefined): ProductIntakeCondition => {
  const value = (condition ?? "new").trim().toLowerCase();
  if (value === "open_box" || value === "refurbished") return "open_box";
  if (value === "used") return "used";
  return "sealed";
};

export const intakeConditionToCatalog = (condition: ProductIntakeCondition): "new" | "open_box" | "used" =>
  condition === "open_box" ? "open_box" : condition === "used" ? "used" : "new";

export const parseProductIntakeScopes = (value: unknown): ProductIntakeScope[] => {
  if (!Array.isArray(value) || value.length === 0) return ["commerce"];
  const unique = [...new Set(value.filter((entry): entry is ProductIntakeScope =>
    typeof entry === "string" && (productIntakeScopes as readonly string[]).includes(entry),
  ))];
  return unique.length > 0 ? unique : ["commerce"];
};

export const parseAcceptedPaths = (value: unknown): ProductIntakeAcceptedPath[] => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((entry): entry is ProductIntakeAcceptedPath =>
    typeof entry === "string" && (allowedAcceptedPaths as readonly string[]).includes(entry),
  ))];
};

export const defaultAcceptedPathsForScopes = (scopes: ProductIntakeScope[]): ProductIntakeAcceptedPath[] => {
  if (scopes.includes("full_review")) return [...allowedAcceptedPaths];
  const paths = new Set<ProductIntakeAcceptedPath>();
  if (scopes.includes("commerce")) {
    paths.add("changes.price");
    paths.add("changes.inventory");
  }
  if (scopes.includes("content")) {
    paths.add("product.title");
    paths.add("listingPreview.de");
    paths.add("listingPreview.en");
  }
  if (scopes.includes("identifiers")) {
    paths.add("product.model");
    paths.add("product.hardwareModel");
  }
  if (scopes.includes("specifications")) {
    paths.add("product.storage");
    paths.add("product.color");
    paths.add("product.category");
    paths.add("product.batteryHealth");
  }
  if (scopes.includes("images")) paths.add("images");
  return paths.size > 0 ? [...paths] : ["changes.price", "changes.inventory"];
};

export const acceptedPathsHash = (paths: string[]): string =>
  canonicalJsonHash(paths.slice().sort() as unknown as JsonObject);

export type CatalogSnapshot = {
  productId: string;
  title: string;
  brand: string | null;
  model: string | null;
  sku: string | null;
  mpn: string | null;
  gtin: string | null;
  condition: string;
  category: string;
  price: number;
  stock: number;
  slug: string | null;
  isActive: boolean;
  identifierStatus: string | null;
  updatedAt: string | null;
  inventoryVersion: number | null;
};

export const snapshotCatalogProduct = (input: CatalogSnapshot): { snapshot: JsonObject; hash: string } => {
  const snapshot = {
    productId: input.productId,
    title: input.title,
    brand: input.brand,
    model: input.model,
    sku: input.sku,
    mpn: input.mpn,
    gtin: input.gtin,
    condition: input.condition,
    category: input.category,
    price: input.price,
    stock: input.stock,
    slug: input.slug,
    isActive: input.isActive,
    identifierStatus: input.identifierStatus,
    updatedAt: input.updatedAt,
    inventoryVersion: input.inventoryVersion,
  };
  assertRedacted(snapshot);
  return { snapshot, hash: canonicalJsonHash(snapshot) };
};

export const dispatchStatusForRun = (run: Pick<ProductIntakeRun, "status" | "mode" | "staleAt">): ProductIntakeDispatchStatus => {
  if (run.staleAt) return "stale";
  if (run.status === "rejected") return "rejected";
  if (run.status === "cancelled") return "cancelled";
  if (run.status === "applied") return run.mode === "live" ? "applied" : "shadow";
  if (["blocked", "failed"].includes(run.status)) return "blocked";
  if (["proposal_ready", "needs_review", "approved_once", "approved_twice"].includes(run.status)) {
    return run.mode === "shadow" && run.status.startsWith("approved") ? "shadow" : "ready_for_review";
  }
  if (run.status === "awaiting_condition" || run.status === "collecting_assets") return "collecting";
  return "queued";
};

export const isTerminalIntakeStatus = (status: ProductIntakeStatus): boolean => TERMINAL_STATUSES.has(status);

export const workspaceViewFromParam = (value: string | null | undefined): ProductIntakeWorkspaceView => {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "intake") return "intake";
  if (normalized === "history") return "history";
  return "catalog";
};

export type IntakeCatalogStatus =
  | "none"
  | "collecting"
  | "ready"
  | "shadow"
  | "stale"
  | "blocked"
  | "rejected";

export const catalogStatusForRun = (run: ProductIntakeRun | null): IntakeCatalogStatus => {
  if (!run) return "none";
  const dispatch = dispatchStatusForRun(run);
  if (dispatch === "stale") return "stale";
  if (dispatch === "blocked") return "blocked";
  if (dispatch === "rejected" || dispatch === "cancelled") return "rejected";
  if (dispatch === "shadow" || dispatch === "applied") return "shadow";
  if (dispatch === "ready_for_review") return "ready";
  return "collecting";
};
