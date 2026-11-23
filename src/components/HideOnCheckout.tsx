"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Hides campaign chrome (countdown ribbon) during checkout, where it only
 * distracts from finishing the order. A client wrapper, because the shared
 * layout does not re-render when the shopper moves from cart to checkout.
 */
export default function HideOnCheckout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  if (/^\/(?:de|en)\/checkout(?:\/|$)/.test(pathname)) return null;
  return <>{children}</>;
}
