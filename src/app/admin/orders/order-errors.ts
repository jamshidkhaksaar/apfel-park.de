export type OrderErrorMessageKey =
  | "generic"
  | "providerActive"
  | "providerCancelFailed"
  | "refundRequired"
  | "conflict";

export const getOrderErrorMessageKey = (error?: string): OrderErrorMessageKey => {
  if (error === "provider_active") return "providerActive";
  if (error === "provider_cancel_failed") return "providerCancelFailed";
  if (error === "refund_required" || error === "provider_paid") return "refundRequired";
  if (error === "conflict") return "conflict";
  return "generic";
};
