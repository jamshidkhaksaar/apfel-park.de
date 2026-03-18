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

  // 🛡️ Sentinel: Removed user_metadata role check.
  // user_metadata is editable by the user via the Supabase Auth API.
  // Relying on it for authorization leads to privilege escalation.
  // Only app_metadata (which requires a service role key to modify) is safe for roles.

  const appRoles = toStringArray(user.app_metadata?.roles).map((role) => role.toLowerCase());
  if (appRoles.includes("admin")) {
    return true;
  }

  const adminEmails = getAdminEmails();
  if (adminEmails.size === 0) {
    // Secure default: if no admin emails are configured, deny access.
    // This prevents accidental exposure of admin routes.
    return false;
  }

  const email = user.email?.toLowerCase().trim();
  return Boolean(email && adminEmails.has(email));
};
