import { timingSafeEqual } from "node:crypto";

import { createServerDbClient } from "@/lib/db";
import { clearSessionCookie, readSessionUser, setSessionCookie } from "@/lib/session";

const comparePasswords = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
};

export const createAdminServerClient = async () => {
  return createServerDbClient({
    getUser: async () => ({
      data: { user: await readSessionUser() },
      error: null,
    }),
    signInWithPassword: async ({ email, password }) => {
      const adminEmails = new Set(
        (process.env.ADMIN_EMAILS ?? "")
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean),
      );
      const expectedPassword = process.env.ADMIN_PASSWORD;
      if (
        !expectedPassword ||
        !adminEmails.has(email.trim().toLowerCase()) ||
        !comparePasswords(password, expectedPassword)
      ) {
        return { error: { message: "Invalid login" } };
      }

      await setSessionCookie(email.trim().toLowerCase());
      return { error: null };
    },
    signOut: async () => {
      await clearSessionCookie();
      return { error: null };
    },
  });
};
