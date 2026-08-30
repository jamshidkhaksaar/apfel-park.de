import type { User } from "@/lib/auth-types";

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return [value];
  }
  return [];
};

const getAdminEmails = (): Set<string> => {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
};

const getUserRole = (user: User | null): string | null => {
  if (!user) return null;

  const appRole = user.app_metadata?.role;
  if (typeof appRole === "string") return appRole.toLowerCase();

  const userRole = user.user_metadata?.role;
  if (typeof userRole === "string") return userRole.toLowerCase();

  return null;
};

export const isAdminUser = (user: User | null): boolean => {
  if (!user) return false;

  const role = getUserRole(user);
  if (role === "admin") return true;

  const appRoles = toStringArray(user.app_metadata?.roles).map((r) => r.toLowerCase());
  if (appRoles.includes("admin")) return true;

  const adminEmails = getAdminEmails();
  if (adminEmails.size === 0) return false;

  const email = user.email?.toLowerCase().trim();
  return Boolean(email && adminEmails.has(email));
};

export const canManageUsers = (user: User | null): boolean => {
  return isAdminUser(user);
};

export const canManageProducts = (user: User | null): boolean => {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  const role = getUserRole(user);
  return role === "manager" || role === "product_editor";
};

export const canManageOrders = (user: User | null): boolean => {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  const role = getUserRole(user);
  return role === "manager";
};

export const canManageCampaigns = (user: User | null): boolean => {
  return canManageOrders(user);
};

export const canManageRepairs = (user: User | null): boolean => {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  const role = getUserRole(user);
  return role === "manager";
};

export const canManageBatchBuy = (user: User | null): boolean => {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  const role = getUserRole(user);
  return role === "manager";
};

export const canAccessAdmin = (user: User | null): boolean => {
  if (!user) return false;
  const role = getUserRole(user);
  return role !== null;
};

export const getUserRoleString = getUserRole;

export const getAuthorizedPaths = (user: User | null): string[] => {
  if (!user) return [];
  if (isAdminUser(user)) return [];

  const role = getUserRole(user);
  const paths = ["/admin"];

  if (role === "manager") {
    paths.push(
      "/admin/products",
      "/admin/campaigns",
      "/admin/inventory",
      "/admin/orders",
      "/admin/repairs",
      "/admin/repair-estimates",
      "/admin/batch-buy",
      "/admin/reviews",
      "/admin/chat",
      "/admin/marketplaces",
    );
  } else if (role === "product_editor") {
    paths.push("/admin/products", "/admin/inventory");
  }

  return paths;
};

export const canAccessAdminPath = (user: User | null, pathname: string): boolean => {
  if (!user || !pathname.startsWith("/admin")) return false;
  if (isAdminUser(user)) return true;
  const role = getUserRole(user);
  if (role !== "manager" && role !== "product_editor") return false;
  return getAuthorizedPaths(user).some(
    (allowed) => pathname === allowed || (allowed !== "/admin" && pathname.startsWith(`${allowed}/`)),
  );
};

export const canManageMarketplaces = (user: User | null): boolean => canManageOrders(user);
