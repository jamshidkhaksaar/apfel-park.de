import type { CartInputItem } from "@/lib/checkout";

export const CART_STORAGE_KEY = "apfel-cart-v1";

export type StoredCartItem = CartInputItem;

const EMPTY_CART: StoredCartItem[] = [];
let cachedRaw: string | null = null;
let cachedCart: StoredCartItem[] = EMPTY_CART;

export const readStoredCart = (): StoredCartItem[] => {
  if (typeof window === "undefined") return EMPTY_CART;
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (raw === cachedRaw) return cachedCart;
    cachedRaw = raw;
    if (!raw) {
      cachedCart = EMPTY_CART;
      return cachedCart;
    }
    const parsed = JSON.parse(raw) as StoredCartItem[];
    cachedCart = Array.isArray(parsed) ? parsed : EMPTY_CART;
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
  const nextItems = items.map((item) => ({ ...item }));
  const raw = JSON.stringify(nextItems);
  cachedRaw = raw;
  cachedCart = nextItems;
  window.localStorage.setItem(CART_STORAGE_KEY, raw);
  window.dispatchEvent(new CustomEvent("apfel-cart-change", { detail: nextItems }));
};

export const getStoredCartCount = () =>
  readStoredCart().reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0);

export const addStoredCartItem = (item: StoredCartItem) => {
  const items = readStoredCart().map((cartItem) => ({ ...cartItem }));
  const key = `${item.productId}:${item.variantColor ?? ""}:${item.variantStorage ?? ""}`;
  const existing = items.find(
    (candidate) =>
      `${candidate.productId}:${candidate.variantColor ?? ""}:${candidate.variantStorage ?? ""}` === key,
  );

  if (existing) {
    existing.quantity = Math.min(10, Math.max(1, Number(existing.quantity) || 1) + Math.max(1, Number(item.quantity) || 1));
  } else {
    items.push({ ...item, quantity: Math.min(10, Math.max(1, Number(item.quantity) || 1)) });
  }

  writeStoredCart(items);
  return items;
};

export const clearStoredCart = () => writeStoredCart([]);
