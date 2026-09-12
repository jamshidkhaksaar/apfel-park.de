import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import type { User } from "@/lib/auth-types";
import { query } from "@/lib/db";

export const ADMIN_SESSION_COOKIE = "apfel_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
const FUTURE_TOLERANCE_SECONDS = 5 * 60;

export const shouldUseSecureCookies = (): boolean => process.env.APP_SECURE_COOKIES === "true";

const getSessionSecret = (): string => {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) throw new Error("APP_SESSION_SECRET is not configured");
  return secret;
};

const getPrimaryAdminEmail = (): string => {
  const adminEmail = process.env.ADMIN_EMAILS?.split(",").map((value) => value.trim()).find(Boolean);
  if (!adminEmail) throw new Error("ADMIN_EMAILS is not configured");
  return adminEmail.toLowerCase();
};

const sign = (payload: string): string => createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
const encodeEmail = (email: string): string => Buffer.from(email, "utf8").toString("base64url");
const decodeEmail = (value: string): string | null => {
  try { return Buffer.from(value, "base64url").toString("utf8"); } catch { return null; }
};

type ParsedToken = { email: string; role: string; sessionId: string; issuedAt: number; signature: string };

const buildPayload = (email: string, role: string, sessionId: string, issuedAt: number): string =>
  `${encodeEmail(email)}.${role}.${sessionId}.${issuedAt}`;

const parseToken = (token: string): ParsedToken | null => {
  const parts = token.split(".");
  if (parts.length !== 5) return null;
  const [encodedEmail, role, sessionId, issuedAtRaw, signature] = parts;
  if (!encodedEmail || !role || !sessionId || !issuedAtRaw || !signature) return null;
  const email = decodeEmail(encodedEmail);
  const issuedAt = Number(issuedAtRaw);
  if (!email || !Number.isSafeInteger(issuedAt)) return null;
  return { email, role, sessionId, issuedAt, signature };
};

export const createAdminUser = (email = getPrimaryAdminEmail(), role = "admin"): User => ({
  id: email,
  email,
  app_metadata: { role },
  user_metadata: { role },
});

// Low-level signing only. Login must use createPersistedSessionToken.
export const createSessionToken = (email: string, role = "admin", now = new Date()): string => {
  const normalized = email.toLowerCase();
  const sessionId = randomUUID();
  const issuedAt = Math.floor(now.getTime() / 1000);
  const payload = buildPayload(normalized, role, sessionId, issuedAt);
  return `${payload}.${sign(payload)}`;
};

// Cryptographic/age check only; never use this alone as an authorization decision.
export const verifySessionToken = (token: string, now = new Date()): { email: string; role: string } | null => {
  const parsed = parseToken(token);
  if (!parsed) return null;
  const nowSeconds = Math.floor(now.getTime() / 1000);
  if (parsed.issuedAt > nowSeconds + FUTURE_TOLERANCE_SECONDS) return null;
  if (nowSeconds - parsed.issuedAt > SESSION_MAX_AGE_SECONDS) return null;
  const payload = buildPayload(parsed.email, parsed.role, parsed.sessionId, parsed.issuedAt);
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(parsed.signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return { email: parsed.email.toLowerCase(), role: parsed.role };
};

export const getSessionCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: shouldUseSecureCookies(),
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
});

const tokenHash = (token: string): string => createHash('sha256').update(token).digest('hex');

// Signature verification alone is not authentication: every token needs a live record.
const resolveVerifiedUser = async (token: string): Promise<User | null> => {
  const verified = verifySessionToken(token);
  if (!verified) return null;
  const result = await query(
    `SELECT u.email, u.role FROM admin_sessions s
     JOIN users u ON u.id::text = s.user_id
     WHERE s.token_hash = $1 AND u.email = $2 AND u.is_active = true
       AND s.security_version = u.security_version AND s.expires_at > now()`,
    [tokenHash(token), verified.email],
  );
  const user = result.rows[0];
  return user ? createAdminUser(user.email, user.role) : null;
};

export const readSessionUser = async (): Promise<User | null> => {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return resolveVerifiedUser(token);
};

export const createPersistedSessionToken = async (
  email: string, role: string, securityVersion: number, userId: string,
): Promise<string> => {
  const token = createSessionToken(email, role);
  const result = await query(
    `INSERT INTO admin_sessions (token_hash, user_id, security_version, expires_at)
     SELECT $1, id::text, security_version, now() + interval '14 days' FROM users
     WHERE email = $2 AND is_active = true AND security_version = $3 AND id::text = $4
     RETURNING token_hash`,
    [tokenHash(token), email.toLowerCase().trim(), securityVersion, userId],
  );
  if (!result.rows.length) throw new Error('Session registration rejected');
  return token;
};

export const setSessionCookie = async (email: string, role: string, securityVersion: number, userId: string): Promise<void> => {
  const token = await createPersistedSessionToken(email, role, securityVersion, userId);
  (await cookies()).set(ADMIN_SESSION_COOKIE, token, getSessionCookieOptions());
};

export const clearSessionCookie = async (): Promise<void> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (token && verifySessionToken(token)) {
    // Do not report successful logout unless persistent revocation succeeds.
    await query('DELETE FROM admin_sessions WHERE token_hash = $1', [tokenHash(token)]);
  }
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    expires: new Date(0),
  });
};

export const readSessionUserFromRequest = async (request: NextRequest): Promise<User | null> => {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return resolveVerifiedUser(token);
};
