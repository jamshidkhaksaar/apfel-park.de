export const batchPhoneStatuses = ["bought", "listed", "sold", "returned", "scrapped"] as const;

export type BatchPhoneStatus = (typeof batchPhoneStatuses)[number];

export type BatchSeller = {
  id: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  phoneCount: number;
  lastPurchaseAt: string | null;
};

export type BatchPhone = {
  id: string;
  sellerId: string;
  sellerName: string;
  createdAt: string;
  updatedAt: string;
  phoneModel: string;
  catalogBrandId: string | null;
  catalogFamilyId: string | null;
  catalogModelId: string | null;
  imei: string;
  purchaseDate: string;
  notes: string | null;
  status: BatchPhoneStatus;
};

export const isBatchPhoneStatus = (value: unknown): value is BatchPhoneStatus =>
  typeof value === "string" && batchPhoneStatuses.includes(value as BatchPhoneStatus);

export const normalizeImei = (value: string): string => value.replace(/\D/g, "");
