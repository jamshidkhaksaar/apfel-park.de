const MAX_CHECKOUT_QUANTITY = 10;

export const resolveCheckoutQuantity = (
  requested: unknown,
  stock: number | null | undefined,
  productTitle: string,
): number => {
  if (typeof stock !== "number" || !Number.isFinite(stock) || stock <= 0) {
    throw new Error(`${productTitle} is out of stock`);
  }
  const available = Math.floor(stock);
  if (available <= 0) throw new Error(`${productTitle} is out of stock`);
  const parsed = Math.floor(Number(requested));
  const normalized = Number.isFinite(parsed)
    ? Math.min(MAX_CHECKOUT_QUANTITY, Math.max(1, parsed))
    : 1;
  return Math.min(normalized, available);
};
