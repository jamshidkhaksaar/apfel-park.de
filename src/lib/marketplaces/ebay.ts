import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  createVerify,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { query } from "@/lib/db";

export type EbayEnvironment = "sandbox" | "production";

export const EBAY_USER_SCOPES = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.account",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
] as const;

type EbayCredentials = {
  clientId: string;
  clientSecret: string;
  devId?: string;
  ruName?: string;
};

type EbayTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
  token_type?: string;
};

type EbayOAuthState = {
  actor: string;
  environment: EbayEnvironment;
  issuedAt: number;
  nonce: string;
};

export type EbayConnectionSummary = {
  environment: EbayEnvironment;
  connectedAt: string;
  connectedBy: string | null;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  scopes: string[];
};

type PublicKeyResponse = {
  algorithm: string;
  digest: string;
  key: string;
};

const TOKEN_AAD = Buffer.from("apfel-park:ebay-token:v1", "utf8");
const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;
const PUBLIC_KEY_CACHE_MS = 60 * 60 * 1000;
const ACCESS_TOKEN_SKEW_MS = 2 * 60 * 1000;

const applicationTokenCache = new Map<EbayEnvironment, { token: string; expiresAt: number }>();
const publicKeyCache = new Map<string, { publicKey: PublicKeyResponse; expiresAt: number }>();

const isEbayEnvironment = (value: unknown): value is EbayEnvironment =>
  value === "sandbox" || value === "production";

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

const getCredentials = (environment: EbayEnvironment): EbayCredentials => {
  const prefix = environment === "sandbox" ? "EBAY_SANDBOX_" : "EBAY_";
  return {
    clientId: required(`${prefix}CLIENT_ID`),
    clientSecret: required(`${prefix}CLIENT_SECRET`),
    devId: process.env[`${prefix}DEV_ID`]?.trim() || undefined,
    ruName: process.env[`${prefix}RUNAME`]?.trim() || undefined,
  };
};

const getApiBaseUrl = (environment: EbayEnvironment): string =>
  environment === "sandbox" ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";

const getAuthorizationBaseUrl = (environment: EbayEnvironment): string =>
  environment === "sandbox" ? "https://auth.sandbox.ebay.com" : "https://auth.ebay.com";

const getSessionSecret = (): string => required("APP_SESSION_SECRET");

const getEncryptionKey = (encoded = process.env.MARKETPLACE_TOKEN_ENCRYPTION_KEY): Buffer => {
  const value = encoded?.trim();
  if (!value || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new Error("MARKETPLACE_TOKEN_ENCRYPTION_KEY must be a Base64-encoded 32-byte key");
  }
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) {
    throw new Error("MARKETPLACE_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes");
  }
  return key;
};

const safeEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

export const encryptEbayToken = (
  plaintext: string,
  encodedKey = process.env.MARKETPLACE_TOKEN_ENCRYPTION_KEY,
): string => {
  if (!plaintext) throw new Error("Cannot encrypt an empty eBay token");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(encodedKey), iv);
  cipher.setAAD(TOKEN_AAD);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
};

export const decryptEbayToken = (
  encrypted: string,
  encodedKey = process.env.MARKETPLACE_TOKEN_ENCRYPTION_KEY,
): string => {
  const [version, ivValue, tagValue, ciphertextValue, extra] = encrypted.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !ciphertextValue || extra) {
    throw new Error("Invalid encrypted eBay token format");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(encodedKey),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAAD(TOKEN_AAD);
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
};

export const createEbayOAuthState = (
  environment: EbayEnvironment,
  actor: string,
  now = Date.now(),
): string => {
  const payload: EbayOAuthState = {
    actor: actor.trim().toLowerCase(),
    environment,
    issuedAt: Math.floor(now / 1000),
    nonce: randomBytes(18).toString("base64url"),
  };
  if (!payload.actor) throw new Error("An authenticated actor is required for eBay OAuth");
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", getSessionSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
};

export const verifyEbayOAuthState = (state: string, now = Date.now()): EbayOAuthState | null => {
  const [encoded, signature, extra] = state.split(".");
  if (!encoded || !signature || extra) return null;
  const expected = createHmac("sha256", getSessionSecret()).update(encoded).digest("base64url");
  if (!safeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<EbayOAuthState>;
    const nowSeconds = Math.floor(now / 1000);
    if (
      !isEbayEnvironment(payload.environment) ||
      typeof payload.actor !== "string" ||
      !payload.actor ||
      typeof payload.nonce !== "string" ||
      payload.nonce.length < 16 ||
      typeof payload.issuedAt !== "number" ||
      payload.issuedAt > nowSeconds + 60 ||
      nowSeconds - payload.issuedAt > OAUTH_STATE_MAX_AGE_SECONDS
    ) {
      return null;
    }
    return payload as EbayOAuthState;
  } catch {
    return null;
  }
};

export const buildEbayConsentUrl = (environment: EbayEnvironment, actor: string): string => {
  const credentials = getCredentials(environment);
  if (!credentials.ruName) {
    const name = environment === "sandbox" ? "EBAY_SANDBOX_RUNAME" : "EBAY_RUNAME";
    throw new Error(`${name} is not configured`);
  }
  const url = new URL("/oauth2/authorize", getAuthorizationBaseUrl(environment));
  url.searchParams.set("client_id", credentials.clientId);
  url.searchParams.set("locale", "de-DE");
  url.searchParams.set("redirect_uri", credentials.ruName);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", EBAY_USER_SCOPES.join(" "));
  url.searchParams.set("state", createEbayOAuthState(environment, actor));
  return url.toString();
};

const requestToken = async (
  environment: EbayEnvironment,
  body: URLSearchParams,
): Promise<EbayTokenResponse> => {
  const credentials = getCredentials(environment);
  const response = await fetch(`${getApiBaseUrl(environment)}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`, "utf8").toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as Partial<EbayTokenResponse> | null;
  if (!response.ok || !payload?.access_token || !Number.isFinite(payload.expires_in)) {
    throw new Error(`eBay token request failed with HTTP ${response.status}`);
  }
  return payload as EbayTokenResponse;
};

export const exchangeEbayAuthorizationCode = async (
  environment: EbayEnvironment,
  code: string,
): Promise<EbayTokenResponse> => {
  const credentials = getCredentials(environment);
  if (!credentials.ruName) throw new Error("The eBay RuName is not configured");
  return requestToken(
    environment,
    new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: credentials.ruName,
    }),
  );
};

export const saveEbayConnection = async (
  environment: EbayEnvironment,
  token: EbayTokenResponse,
  actor: string,
): Promise<void> => {
  if (!token.refresh_token || !Number.isFinite(token.refresh_token_expires_in)) {
    throw new Error("eBay did not return a refresh token");
  }
  const now = Date.now();
  const scopes = (token.scope?.split(/\s+/).filter(Boolean) ?? [...EBAY_USER_SCOPES]) as string[];
  await query(
    `INSERT INTO marketplace_connections (
       marketplace, environment, access_token_ciphertext, refresh_token_ciphertext,
       access_token_expires_at, refresh_token_expires_at, scopes, token_type,
       connected_by, connected_at, updated_at
     ) VALUES ('ebay_de', $1, $2, $3, $4, $5, $6, $7, $8, now(), now())
     ON CONFLICT (marketplace, environment) DO UPDATE SET
       access_token_ciphertext = EXCLUDED.access_token_ciphertext,
       refresh_token_ciphertext = EXCLUDED.refresh_token_ciphertext,
       access_token_expires_at = EXCLUDED.access_token_expires_at,
       refresh_token_expires_at = EXCLUDED.refresh_token_expires_at,
       scopes = EXCLUDED.scopes,
       token_type = EXCLUDED.token_type,
       connected_by = EXCLUDED.connected_by,
       connected_at = now(),
       updated_at = now()`,
    [
      environment,
      encryptEbayToken(token.access_token),
      encryptEbayToken(token.refresh_token),
      new Date(now + token.expires_in * 1000),
      new Date(now + (token.refresh_token_expires_in ?? 0) * 1000),
      scopes,
      token.token_type ?? "User Access Token",
      actor.trim().toLowerCase(),
    ],
  );
};

export const listEbayConnectionSummaries = async (): Promise<EbayConnectionSummary[]> => {
  const result = await query(
    `SELECT environment, connected_at, connected_by, access_token_expires_at,
            refresh_token_expires_at, scopes
       FROM marketplace_connections
      WHERE marketplace = 'ebay_de'
      ORDER BY environment`,
  );
  return result.rows.map((row) => ({
    environment: row.environment as EbayEnvironment,
    connectedAt: new Date(row.connected_at).toISOString(),
    connectedBy: row.connected_by ? String(row.connected_by) : null,
    accessTokenExpiresAt: new Date(row.access_token_expires_at).toISOString(),
    refreshTokenExpiresAt: new Date(row.refresh_token_expires_at).toISOString(),
    scopes: Array.isArray(row.scopes) ? row.scopes.map(String) : [],
  }));
};

export const getEbayUserAccessToken = async (environment: EbayEnvironment): Promise<string> => {
  const result = await query(
    `SELECT access_token_ciphertext, refresh_token_ciphertext, access_token_expires_at,
            refresh_token_expires_at, scopes
       FROM marketplace_connections
      WHERE marketplace = 'ebay_de' AND environment = $1
      LIMIT 1`,
    [environment],
  );
  const row = result.rows[0];
  if (!row) throw new Error(`eBay ${environment} is not connected`);

  const accessExpiresAt = new Date(row.access_token_expires_at).getTime();
  if (accessExpiresAt - ACCESS_TOKEN_SKEW_MS > Date.now()) {
    return decryptEbayToken(String(row.access_token_ciphertext));
  }
  if (new Date(row.refresh_token_expires_at).getTime() <= Date.now()) {
    throw new Error(`eBay ${environment} refresh token has expired`);
  }

  const refreshToken = decryptEbayToken(String(row.refresh_token_ciphertext));
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const scopes = Array.isArray(row.scopes) ? row.scopes.map(String).filter(Boolean) : [];
  if (scopes.length) body.set("scope", scopes.join(" "));
  const token = await requestToken(environment, body);
  await query(
    `UPDATE marketplace_connections
        SET access_token_ciphertext = $2, access_token_expires_at = $3, updated_at = now()
      WHERE marketplace = 'ebay_de' AND environment = $1`,
    [environment, encryptEbayToken(token.access_token), new Date(Date.now() + token.expires_in * 1000)],
  );
  return token.access_token;
};

const getApplicationAccessToken = async (environment: EbayEnvironment): Promise<string> => {
  const cached = applicationTokenCache.get(environment);
  if (cached && cached.expiresAt - ACCESS_TOKEN_SKEW_MS > Date.now()) return cached.token;
  const token = await requestToken(
    environment,
    new URLSearchParams({
      grant_type: "client_credentials",
      scope: "https://api.ebay.com/oauth/api_scope",
    }),
  );
  applicationTokenCache.set(environment, {
    token: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  });
  return token.access_token;
};

export const getEbayNotificationEndpoint = (): string => {
  const configured = process.env.EBAY_NOTIFICATION_ENDPOINT?.trim();
  if (configured) return configured;
  return new URL(
    "/api/webhooks/marketplaces/ebay_de",
    required("SITE_URL"),
  ).toString();
};

export const createEbayNotificationChallengeResponse = (
  challengeCode: string,
  verificationToken = process.env.EBAY_NOTIFICATION_VERIFICATION_TOKEN?.trim(),
  endpoint = getEbayNotificationEndpoint(),
): string => {
  if (!challengeCode || challengeCode.length > 1024) throw new Error("Invalid eBay challenge code");
  if (!verificationToken || !/^[A-Za-z0-9_-]{32,80}$/.test(verificationToken)) {
    throw new Error("EBAY_NOTIFICATION_VERIFICATION_TOKEN must contain 32 to 80 allowed characters");
  }
  if (!endpoint.startsWith("https://")) throw new Error("The eBay notification endpoint must use HTTPS");
  return createHash("sha256")
    .update(challengeCode, "utf8")
    .update(verificationToken, "utf8")
    .update(endpoint, "utf8")
    .digest("hex");
};

const notificationEnvironment = (): EbayEnvironment => {
  const value = process.env.EBAY_NOTIFICATION_ENVIRONMENT?.trim().toLowerCase() || "production";
  if (!isEbayEnvironment(value)) throw new Error("EBAY_NOTIFICATION_ENVIRONMENT is invalid");
  return value;
};

const parseSignatureHeader = (header: string): { kid: string; signature: string } => {
  if (header.length > 4096) throw new Error("eBay signature header is too large");
  const decoded = JSON.parse(Buffer.from(header, "base64").toString("utf8")) as {
    kid?: unknown;
    signature?: unknown;
  };
  if (
    typeof decoded.kid !== "string" ||
    !decoded.kid ||
    decoded.kid.length > 256 ||
    typeof decoded.signature !== "string" ||
    !decoded.signature
  ) {
    throw new Error("Invalid eBay signature header");
  }
  return { kid: decoded.kid, signature: decoded.signature };
};

const getNotificationPublicKey = async (
  environment: EbayEnvironment,
  keyId: string,
): Promise<PublicKeyResponse> => {
  const cacheKey = `${environment}:${keyId}`;
  const cached = publicKeyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.publicKey;

  const token = await getApplicationAccessToken(environment);
  const response = await fetch(
    `${getApiBaseUrl(environment)}/commerce/notification/v1/public_key/${encodeURIComponent(keyId)}`,
    {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  const payload = (await response.json().catch(() => null)) as Partial<PublicKeyResponse> | null;
  if (
    !response.ok ||
    !payload?.key ||
    typeof payload.algorithm !== "string" ||
    typeof payload.digest !== "string"
  ) {
    throw new Error(`eBay public-key request failed with HTTP ${response.status}`);
  }
  const publicKey = payload as PublicKeyResponse;
  publicKeyCache.set(cacheKey, { publicKey, expiresAt: Date.now() + PUBLIC_KEY_CACHE_MS });
  return publicKey;
};

const normalizeDigest = (digest: string): "sha1" | "sha256" | "sha384" | "sha512" => {
  const normalized = digest.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalized === "sha1" || normalized === "sha256" || normalized === "sha384" || normalized === "sha512") {
    return normalized;
  }
  throw new Error(`Unsupported eBay notification digest: ${digest}`);
};

const formatPublicKey = (key: string): string =>
  key.includes("\n")
    ? key
    : key
        .replace("-----BEGIN PUBLIC KEY-----", "-----BEGIN PUBLIC KEY-----\n")
        .replace("-----END PUBLIC KEY-----", "\n-----END PUBLIC KEY-----");

export const verifyEbayNotificationSignature = async (
  payload: unknown,
  signatureHeader: string | null,
): Promise<boolean> => {
  if (!signatureHeader) return false;
  try {
    const environment = notificationEnvironment();
    const signature = parseSignatureHeader(signatureHeader);
    const publicKey = await getNotificationPublicKey(environment, signature.kid);
    if (!/ecdsa/i.test(publicKey.algorithm)) throw new Error("Unsupported eBay notification key algorithm");
    const verifier = createVerify(normalizeDigest(publicKey.digest));
    verifier.update(JSON.stringify(payload), "utf8");
    verifier.end();
    return verifier.verify(formatPublicKey(publicKey.key), signature.signature, "base64");
  } catch {
    return false;
  }
};
