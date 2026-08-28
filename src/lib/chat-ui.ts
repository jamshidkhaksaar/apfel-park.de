const normalizePathname = (pathname: string | null): string =>
  (pathname ?? "").split(/[?#]/, 1)[0].replace(/\/+$/, "");

export const shouldHideChatWidget = (pathname: string | null): boolean => {
  const path = normalizePathname(pathname);
  return path === "/login" ||
    path.startsWith("/admin") ||
    path === "/maintenance" ||
    /^\/(?:de|en)\/checkout(?:\/|$)/.test(path) ||
    /^\/(?:de|en)\/store\/(?!catalog$)[^/]+$/.test(path);
};

export const shouldHideChatWidgetOnMobile = (pathname: string | null): boolean => {
  const path = normalizePathname(pathname);
  return /^\/(?:de|en)$/.test(path) || /^\/(?:de|en)\/store(?:\/catalog)?$/.test(path);
};
