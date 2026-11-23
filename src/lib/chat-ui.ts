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

// Product grids: on phones the floating button covered card text
// and prices, and these pages already offer "Preis anfragen" and WhatsApp.
const MOBILE_SHOPPING_PAGES = /^\/(?:de|en)\/(?:smartphones|tablets|laptops|gaming|parts|accessories(?:\/[^/]+)?|gebrauchte-handys|gebrauchte-iphones|open-box|samsung-handys|xiaomi-redmi-handys|handys-ohne-vertrag|black-friday|black-week|blackfriday)$/;

export const shouldHideChatWidgetOnMobile = (pathname: string | null): boolean => {
  const path = normalizePathname(pathname);
  return /^\/(?:de|en)$/.test(path) || /^\/(?:de|en)\/store(?:\/catalog)?$/.test(path) || MOBILE_SHOPPING_PAGES.test(path);
};
