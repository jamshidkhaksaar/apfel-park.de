import { createServerDbClient } from "@/lib/db";
import { clearSessionCookie, readSessionUser, setSessionCookie } from "@/lib/session";
import { verifyUserCredentials } from "@/lib/users";

export const createAdminServerClient = async () => {
  return createServerDbClient({
    getUser: async () => ({
      data: { user: await readSessionUser() },
      error: null,
    }),
    signInWithPassword: async ({ email, password }) => {
      const normalizedEmail = email.trim().toLowerCase();

      const dbResult = await verifyUserCredentials(normalizedEmail, password);
      if (dbResult.valid) {
        await setSessionCookie(normalizedEmail, dbResult.role, dbResult.securityVersion, dbResult.userId);
        return { error: null };
      }

      return { error: { message: "Invalid login" } };
    },
    signOut: async () => {
      await clearSessionCookie();
      return { error: null };
    },
  });
};
