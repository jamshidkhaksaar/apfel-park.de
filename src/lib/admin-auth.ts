import type { User } from "@supabase/supabase-js";

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

export const isAdminUser = (user: User | null): boolean => {
  if (!user) return false;

  const appRole = user.app_metadata?.role;
  if (typeof appRole === "string" && appRole.toLowerCase() === "admin") {
    return true;
  }

  const userRole = user.user_metadata?.role;
  if (typeof userRole === "string" && userRole.toLowerCase() === "admin") {
    return true;
  }

  const appRoles = toStringArray(user.app_metadata?.roles).map((role) => role.toLowerCase());
  if (appRoles.includes("admin")) {
    return true;
  }

  const adminEmails = getAdminEmails();
  if (adminEmails.size === 0) {
    // Sentinel Security Fix (2026-02-25):
    // Removed insecure fallback that allowed ANY authenticated user to be admin if ADMIN_EMAILS was unset.
    // Admins must now be explicitly configured via ADMIN_EMAILS or have 'admin' role in metadata.
    return false;
  }

  const email = user.email?.toLowerCase().trim();
  return Boolean(email && adminEmails.has(email));
};
