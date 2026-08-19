import { createHmac, timingSafeEqual } from "node:crypto";

import { ProductIntakeError } from "./errors";
import { canonicalJson } from "./json";

type AssetClaims = {
  v: 1;
  aud: "apfel-product-intake-redacted-asset";
  assetKey: string;
  sha256: string;
  iat: number;
  exp: number;
};

const lifetimeSeconds = 10 * 60;
const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");

export const createIntakeAssetToken = (
  input: { assetKey: string; sha256: string },
  secret: string,
  now = new Date(),
): { token: string; expiresAt: string } => {
  if (secret.length < 32) throw new ProductIntakeError("forbidden", "Asset signing is not configured", 503);
  const iat = Math.floor(now.getTime() / 1000);
  const claims: AssetClaims = {
    v: 1,
    aud: "apfel-product-intake-redacted-asset",
    assetKey: input.assetKey,
    sha256: input.sha256,
    iat,
    exp: iat + lifetimeSeconds,
  };
  const encoded = Buffer.from(canonicalJson(claims), "utf8").toString("base64url");
  return { token: `${encoded}.${sign(encoded, secret)}`, expiresAt: new Date(claims.exp * 1000).toISOString() };
};

export const verifyIntakeAssetToken = (token: string, secret: string, now = new Date()): AssetClaims => {
  if (secret.length < 32) throw new ProductIntakeError("forbidden", "Asset signing is not configured", 503);
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) throw new ProductIntakeError("forbidden", "Invalid asset token", 401);
  const expected = Buffer.from(sign(encoded, secret));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    throw new ProductIntakeError("forbidden", "Invalid asset token", 401);
  }
  let claims: AssetClaims;
  try {
    claims = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as AssetClaims;
  } catch {
    throw new ProductIntakeError("forbidden", "Invalid asset token", 401);
  }
  const nowSeconds = Math.floor(now.getTime() / 1000);
  if (
    claims.v !== 1 || claims.aud !== "apfel-product-intake-redacted-asset"
    || !/^[A-Za-z0-9][A-Za-z0-9/_.-]{0,511}$/.test(claims.assetKey)
    || claims.assetKey.includes("..") || !/^[a-f0-9]{64}$/.test(claims.sha256)
    || claims.exp - claims.iat !== lifetimeSeconds || claims.iat > nowSeconds + 60
  ) throw new ProductIntakeError("forbidden", "Invalid asset token", 401);
  if (nowSeconds >= claims.exp) throw new ProductIntakeError("forbidden", "Asset token has expired", 401);
  return claims;
};
