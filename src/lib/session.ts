import { cookies } from "next/headers";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

import type { User } from "@/lib/auth-types";
import { getUserByEmail } from "@/lib/users";

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

type ParsedToken = {
  email: string;
  role: string;
  sessionId: string;
  signature: string;
};

const parseToken = (token: string): ParsedToken | null => {
  const parts = token.split(".");
  if (parts.length === 3) {
    const [encodedEmail, sessionId, signature] = parts;
    if (!encodedEmail || !sessionId || !signature) return null;
    const email = decodeEmail(encodedEmail);
    if (!email) return null;
    return { email, role: "admin", sessionId, signature };
  }
  if (parts.length === 4) {
    const [encodedEmail, role, sessionId, signature] = parts;
    if (!encodedEmail || !role || !sessionId || !signature) return null;
    const email = decodeEmail(encodedEmail);
    if (!email) return null;
    return { email, role, sessionId, signature };
  }
  return null;
};

const buildPayload = (email: string, sessionId: string, role?: string): string => {
  if (role) {
    return `${encodeEmail(email)}.${role}.${sessionId}`;
  }
  return `${encodeEmail(email)}.${sessionId}`;
};

export const createAdminUser = (email = getPrimaryAdminEmail(), role = "admin"): User => ({
  id: email,
  email,
  app_metadata: { role },
  user_metadata: { role },
});

export const createSessionToken = (email: string, role?: string): string => {
  const normalized = email.toLowerCase();
  const sessionId = randomUUID();
  const payload = buildPayload(normalized, sessionId, role);
  const parts = role
    ? `${encodeEmail(normalized)}.${role}.${sessionId}`
    : `${encodeEmail(normalized)}.${sessionId}`;
  return `${parts}.${sign(payload)}`;
};

export const getSessionCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: shouldUseSecureCookies(),
  path: "/",
  maxAge: 60 * 60 * 24 * 14,
});

const verifyToken = (token: string): { email: string; role: string } | null => {
  const parsed = parseToken(token);
  if (!parsed) return null;

  let payload = buildPayload(parsed.email, parsed.sessionId, parsed.role);
  let expected = sign(payload);
  let expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(parsed.signature);

  if (expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)) {
    return { email: parsed.email.toLowerCase(), role: parsed.role };
  }

  payload = buildPayload(parsed.email, parsed.sessionId);
  expected = sign(payload);
  expectedBuffer = Buffer.from(expected);

  if (expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)) {
    return { email: parsed.email.toLowerCase(), role: "admin" };
  }

  return null;
};

export const readSessionUser = async (): Promise<User | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const verified = verifyToken(token);
  if (!verified) return null;

  if (verified.role === "admin") {
    const adminEmails = new Set(
      (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    );

    if (adminEmails.has(verified.email)) {
      return createAdminUser(verified.email, verified.role);
    }

    const dbUser = await getUserByEmail(verified.email);
    if (dbUser && dbUser.role === "admin") {
      return createAdminUser(verified.email, dbUser.role);
    }

    return null;
  }

  const dbUser = await getUserByEmail(verified.email);
  if (!dbUser) return null;

  return createAdminUser(verified.email, dbUser.role);
};

export const setSessionCookie = async (email: string, role?: string): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionToken(email, role), getSessionCookieOptions());
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

  const verified = verifyToken(token);
  if (!verified) return null;

  if (verified.role === "admin") {
    const adminEmails = new Set(
      (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    );

    if (!adminEmails.has(verified.email)) return null;
    return createAdminUser(verified.email, verified.role);
  }

  return createAdminUser(verified.email, verified.role);
};
