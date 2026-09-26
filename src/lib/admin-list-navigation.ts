export const adminListReturnTo = (value: unknown): string => {
  if (typeof value !== "string" || !value.startsWith("/admin/") || value.length > 4000) return "/admin/products";
  try {
    const url = new URL(value, "https://admin.local");
    if (url.origin !== "https://admin.local" || !["/admin/products", "/admin/inventory"].includes(url.pathname)) return "/admin/products";
    return `${url.pathname}${url.search}`;
  } catch { return "/admin/products"; }
};

export const withAdminListReturnTo = (href: string, returnTo: string): string => {
  const url = new URL(href, "https://admin.local");
  url.searchParams.set("returnTo", adminListReturnTo(returnTo));
  return `${url.pathname}${url.search}${url.hash}`;
};

export const markAdminListsChanged = (): void => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem("apfel-admin-list-dirty:/admin/products", "1");
    sessionStorage.setItem("apfel-admin-list-dirty:/admin/inventory", "1");
  } catch { /* Storage is optional. */ }
};
