import { cookies } from "next/headers";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

import type { User } from "@/lib/auth-types";

export const ADMIN_SESSION_COOKIE = "apfel_admin_session";

export const shouldUseSecureCookies = (): boolean => process.env.APP_SECURE_COOKIES === "true";

const getSessionSecret = (): string => {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) {
    throw new Error("APP_SESSION_SECRET is not configured");
  }
  return secret;
};

const getPrimaryAdminEmail = (): string => {
  const adminEmail = process.env.ADMIN_EMAILS?.split(",").map((value) => value.trim()).find(Boolean);
  if (!adminEmail) {
    throw new Error("ADMIN_EMAILS is not configured");
  }
  return adminEmail.toLowerCase();
};

const sign = (payload: string): string =>
  createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");

const encodeEmail = (email: string): string => Buffer.from(email, "utf8").toString("base64url");

const decodeEmail = (value: string): string | null => {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }
};

const parseToken = (token: string): { email: string; sessionId: string; signature: string } | null => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedEmail, sessionId, signature] = parts;
  if (!encodedEmail || !sessionId || !signature) return null;
  const email = decodeEmail(encodedEmail);
  if (!email) return null;
  return { email, sessionId, signature };
};

const buildPayload = (email: string, sessionId: string): string => `${encodeEmail(email)}.${sessionId}`;

export const createAdminUser = (email = getPrimaryAdminEmail()): User => ({
  id: email,
  email,
  app_metadata: { role: "admin" },
  user_metadata: { role: "admin" },
});

export const createSessionToken = (email: string): string => {
  const normalized = email.toLowerCase();
  const sessionId = randomUUID();
  const payload = buildPayload(normalized, sessionId);
  return `${payload}.${sign(payload)}`;
};

export const getSessionCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: shouldUseSecureCookies(),
  path: "/",
  maxAge: 60 * 60 * 24 * 14,
});

const verifyToken = (token: string): string | null => {
  const parsed = parseToken(token);
  if (!parsed) return null;

  const payload = buildPayload(parsed.email, parsed.sessionId);
  const expected = sign(payload);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(parsed.signature);
  if (expectedBuffer.length !== actualBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, actualBuffer)) return null;
  return parsed.email.toLowerCase();
};

export const readSessionUser = async (): Promise<User | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const email = verifyToken(token);
  if (!email) return null;

  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );

  if (!adminEmails.has(email)) return null;
  return createAdminUser(email);
};

export const setSessionCookie = async (email: string): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionToken(email), getSessionCookieOptions());
};

export const clearSessionCookie = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    expires: new Date(0),
  });
};

export const readSessionUserFromRequest = (request: NextRequest): User | null => {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const email = verifyToken(token);
  if (!email) return null;

  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );

  if (!adminEmails.has(email)) return null;
  return createAdminUser(email);
};
