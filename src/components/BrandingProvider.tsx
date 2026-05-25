"use client";

import { createContext, useContext, type ReactNode } from "react";

export type BrandingAssets = {
  logo: string;
  logoWhite: string;
  favicon: string;
  ogImage: string;
};

const DEFAULT_BRANDING: BrandingAssets = {
  logo: "/branding/logo.jpg",
  logoWhite: "/branding/apfel-park-white.png",
  favicon: "/favicon.ico",
  ogImage: "/images/shop2.jpg",
};

const BrandingContext = createContext<BrandingAssets>(DEFAULT_BRANDING);

export function BrandingProvider({
  children,
  branding,
}: {
  children: ReactNode;
  branding: Partial<BrandingAssets> | null | undefined;
}) {
  return (
    <BrandingContext.Provider
      value={{
        ...DEFAULT_BRANDING,
        ...(branding ?? {}),
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

export const shouldBypassImageOptimization = (src: string): boolean =>
  src.startsWith("data:") || src.startsWith("/uploads/");
