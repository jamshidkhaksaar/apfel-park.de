import type { CartInputItem } from "@/lib/checkout";

export const CART_STORAGE_KEY = "apfel-cart-v1";
const MAX_CART_LINES = 20;
const MAX_QUANTITY = 10;

export type StoredCartItem = CartInputItem;

const EMPTY_CART: StoredCartItem[] = [];
let cachedRaw: string | null = null;
let cachedCart: StoredCartItem[] = EMPTY_CART;

const normalizeVariant = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= 120 ? normalized : null;
};

const normalizeStoredItems = (value: unknown): StoredCartItem[] => {
  if (!Array.isArray(value)) return EMPTY_CART;
  const merged = new Map<string, StoredCartItem>();

  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const item = candidate as Record<string, unknown>;
    const productId = typeof item.productId === "string" ? item.productId.trim() : "";
    if (!productId || productId.length > 128) continue;
    const variantColor = normalizeVariant(item.variantColor);
    const variantStorage = normalizeVariant(item.variantStorage);
    const parsedQuantity = Math.floor(Number(item.quantity));
    const quantity = Number.isFinite(parsedQuantity)
      ? Math.min(MAX_QUANTITY, Math.max(1, parsedQuantity))
      : 1;
    const key = `${productId}:${variantColor ?? ""}:${variantStorage ?? ""}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity = Math.min(MAX_QUANTITY, existing.quantity + quantity);
      continue;
    }
    if (merged.size >= MAX_CART_LINES) continue;
    merged.set(key, { productId, variantColor, variantStorage, quantity });
  }

  return Array.from(merged.values());
};

export const parseStoredCart = (raw: string | null): StoredCartItem[] => {
  if (!raw) return EMPTY_CART;
  try {
    return normalizeStoredItems(JSON.parse(raw));
  } catch {
    return EMPTY_CART;
  }
};

export const readStoredCart = (): StoredCartItem[] => {
  if (typeof window === "undefined") return EMPTY_CART;
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (raw === cachedRaw) return cachedCart;
    cachedRaw = raw;
    cachedCart = parseStoredCart(raw);
    return cachedCart;
  } catch {
    cachedRaw = null;
    cachedCart = EMPTY_CART;
    return cachedCart;
  }
};

export const getServerCartSnapshot = () => EMPTY_CART;

export const subscribeStoredCart = (callback: () => void) => {
  const handler = () => callback();
  window.addEventListener("apfel-cart-change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("apfel-cart-change", handler);
    window.removeEventListener("storage", handler);
  };
};

export const writeStoredCart = (items: StoredCartItem[]) => {
  const nextItems = normalizeStoredItems(items);
  const raw = JSON.stringify(nextItems);
  cachedRaw = raw;
  cachedCart = nextItems;
  window.localStorage.setItem(CART_STORAGE_KEY, raw);
  window.dispatchEvent(new CustomEvent("apfel-cart-change", { detail: nextItems }));
};

export const getStoredCartCount = () =>
  readStoredCart().reduce((sum, item) => sum + item.quantity, 0);

export const addStoredCartItem = (item: StoredCartItem) => {
  const items = normalizeStoredItems([...readStoredCart(), item]);
  writeStoredCart(items);
  return items;
};

export const clearStoredCart = () => writeStoredCart([]);
