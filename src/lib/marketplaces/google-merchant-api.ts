import { createSign } from "node:crypto";

import { query } from "@/lib/db";
import { googleMerchantItemId } from "@/lib/google-merchant";
import type { ProductVariant } from "@/lib/products";
import { siteInfo } from "@/lib/site";
import { requireEnabledChannel } from "@/lib/marketplaces/channel-settings";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

let tokenCache: { token: string; expiresAt: number } | null = null;

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

const parseServiceAccount = (): ServiceAccount => {
  const raw = required("GOOGLE_MERCHANT_SERVICE_ACCOUNT_JSON");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  }
  if (!parsed || typeof parsed !== "object") throw new Error("Google Merchant service account JSON is invalid");
  const account = parsed as Partial<ServiceAccount>;
  if (!account.client_email || !account.private_key) throw new Error("Google Merchant service account is incomplete");
  return account as ServiceAccount;
};

const getAccessToken = async (): Promise<string> => {
  if (tokenCache && tokenCache.expiresAt - 120_000 > Date.now()) return tokenCache.token;
  const account = parseServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = account.token_uri || "https://oauth2.googleapis.com/token";
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/content",
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  })}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${signer.sign(account.private_key).toString("base64url")}`;
  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json().catch(() => null) as { access_token?: string; expires_in?: number; error_description?: string } | null;
  if (!response.ok || !payload?.access_token) {
    throw new Error(`Google OAuth failed with HTTP ${response.status}: ${payload?.error_description ?? "missing token"}`);
  }
  tokenCache = {
    token: payload.access_token,
    expiresAt: Date.now() + Math.max(300, Number(payload.expires_in ?? 3600)) * 1000,
  };
  return payload.access_token;
};

const merchantRequest = async (url: string, body: unknown): Promise<void> => {
  const token = await getAccessToken();
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 1200);
    throw new Error(`Google Merchant API HTTP ${response.status}: ${detail}`);
  }
};

const offerIdForSku = async (sku: string): Promise<string> => {
  const result = await query(
    `SELECT product.id AS product_id, product.sku AS product_sku, product.variants
       FROM inventory_skus inventory
       JOIN products product ON product.id = inventory.product_id
      WHERE inventory.sku = $1 AND inventory.location = 'local'
      LIMIT 1`,
    [sku],
  );
  const row = result.rows[0];
  if (!row) throw new Error(`Google inventory SKU ${sku} does not exist`);
  const variants = Array.isArray(row.variants) ? row.variants as ProductVariant[] : [];
  const variantIndex = variants.findIndex((variant) => variant.sku === sku);
  const variant = variantIndex >= 0 ? variants[variantIndex] : undefined;
  return googleMerchantItemId(String(row.product_id), variant, Math.max(0, variantIndex));
};

export const updateGoogleMerchantAvailability = async (sku: string, quantity: number): Promise<void> => {
  await requireEnabledChannel("google_merchant", "stock");
  const accountId = process.env.GOOGLE_MERCHANT_ACCOUNT_ID?.trim() || siteInfo.googleMerchantId;
  const dataSource = required("GOOGLE_MERCHANT_SUPPLEMENTAL_DATA_SOURCE");
  const storeCode = process.env.GOOGLE_MERCHANT_STORE_CODE?.trim() || siteInfo.googleBusinessProfile.storeCode;
  const offerId = await offerIdForSku(sku);
  const available = Math.max(0, Math.trunc(quantity));
  const availability = available > 0 ? "IN_STOCK" : "OUT_OF_STOCK";

  const onlineUrl = new URL(`https://merchantapi.googleapis.com/products/v1/accounts/${encodeURIComponent(accountId)}/productInputs:insert`);
  onlineUrl.searchParams.set("dataSource", dataSource);
  await merchantRequest(onlineUrl.toString(), {
    offerId,
    contentLanguage: "de",
    feedLabel: "DE",
    productAttributes: { availability },
  });

  const productName = Buffer.from(`de~DE~${offerId}`, "utf8").toString("base64url");
  const localUrl = `https://merchantapi.googleapis.com/inventories/v1/accounts/${encodeURIComponent(accountId)}/products/${productName}/localInventories:insert`;
  await merchantRequest(localUrl, {
    storeCode,
    localInventoryAttributes: {
      availability,
      quantity: String(available),
      pickupMethod: available > 0 ? "BUY" : "NOT_SUPPORTED",
      ...(available > 0 ? { pickupSla: "SAME_DAY" } : {}),
    },
  });
};
