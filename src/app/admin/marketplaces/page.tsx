import Link from "next/link";

import AdminShell from "@/components/admin/AdminShell";
import { isAdminUser } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { listEbayConnectionSummaries } from "@/lib/marketplaces/ebay";
import { readSessionUser } from "@/lib/session";

import { queueMarketplaceOperation, updateChannelSettings, verifyMarketplaceCompliance } from "./actions";

export const dynamic = "force-dynamic";

type Listing = {
  sku: string;
  marketplace: string;
  status: string;
  price: string | null;
  fulfillment_mode: string | null;
  last_error: string | null;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
};

type ChannelSetting = {
  marketplace: "google_merchant" | "ebay_de" | "amazon_de";
  enabled: boolean;
  stock_sync_enabled: boolean;
  price_sync_enabled: boolean;
  order_sync_enabled: boolean;
  price_markup_percent: string;
  price_markup_fixed: string;
  price_rule_confirmed_at: string | null;
};

type Job = {
  marketplace: string;
  operation: string;
  status: string;
  attempts: number;
  last_error: string | null;
  created_at: string;
};

type PageParams = {
  ebay_connected?: string;
  error?: string;
  queued?: string;
  settings?: string;
  verified?: string;
};

const errorMessage = (code: string | undefined): string | null => {
  if (!code) return null;
  const messages: Record<string, string> = {
    auth: "You do not have permission for that marketplace action.",
    ebay_code: "eBay did not return a usable authorization code.",
    ebay_configuration: "The eBay OAuth redirect name is not configured yet.",
    ebay_declined: "eBay account access was not granted.",
    ebay_environment: "The selected eBay environment is invalid.",
    ebay_state: "The eBay connection request expired or failed its security check.",
    ebay_token: "eBay authorization could not be completed. Please try again.",
    blocked: "Publication is blocked until compliance, channel pricing, and product data are complete.",
    sku: "Choose a valid SKU for this action.",
    admin: "Only an owner/administrator may approve publication or channel price rules.",
    channel: "The sales channel is invalid.",
    price_rule: "The channel price adjustment is outside the allowed range.",
    price_confirmation: "The owner must confirm the marketplace price rule before enabling this channel.",
    channel_configuration: "This channel is still missing credentials, policies, a data source, or seller authorization.",
    compliance_incomplete: "All required LUCID, WEEE, battery, and GPSR evidence must be confirmed before verification.",
  };
  return messages[code] ?? "The marketplace action could not be completed.";
};

export default async function MarketplacesPage({
  searchParams,
}: {
  searchParams: Promise<PageParams>;
}) {
  const [
    params,
    user,
    listingResult,
    jobResult,
    complianceResult,
    orderResult,
    deletionResult,
    ebayConnections,
    channelResult,
  ] = await Promise.all([
    searchParams,
    readSessionUser(),
    query(
      "SELECT sku, marketplace, status, price, fulfillment_mode, last_error, updated_at, approved_at, approved_by FROM marketplace_listings ORDER BY updated_at DESC LIMIT 50",
    ),
    query(
      "SELECT marketplace, operation, status, attempts, last_error, created_at FROM marketplace_jobs ORDER BY created_at DESC LIMIT 15",
    ),
    query(
      `SELECT verified_at, verified_by, evidence FROM marketplace_compliance_profiles
        WHERE verified_at IS NOT NULL
          AND evidence @> '{"lucid":true,"weee":true,"batteries":true,"gpsr":true}'::jsonb
        ORDER BY verified_at DESC LIMIT 1`,
    ),
    query(
      "SELECT marketplace, external_order_id, status, imported_at FROM marketplace_orders ORDER BY imported_at DESC LIMIT 20",
    ),
    query(
      "SELECT count(*)::int AS pending_count FROM marketplace_account_deletion_requests WHERE status = 'pending_review'",
    ),
    listEbayConnectionSummaries().catch(() => []),
    query(
      `SELECT marketplace, enabled, stock_sync_enabled, price_sync_enabled, order_sync_enabled,
              price_markup_percent, price_markup_fixed, price_rule_confirmed_at
         FROM marketplace_channel_settings
        ORDER BY CASE marketplace WHEN 'google_merchant' THEN 1 WHEN 'ebay_de' THEN 2 ELSE 3 END`,
    ),
  ]);

  const isAdmin = isAdminUser(user);
  const compliance = complianceResult.rows[0] as
    | { verified_at?: string; verified_by?: string }
    | undefined;
  const listings = listingResult.rows as Listing[];
  const jobs = jobResult.rows as Job[];
  const sandboxConnected = ebayConnections.some((item) => item.environment === "sandbox");
  const productionConnected = ebayConnections.some((item) => item.environment === "production");
  const pendingDeletionCount = Number(deletionResult.rows[0]?.pending_count ?? 0);
  const displayedError = errorMessage(params.error);
  const channelSettings = channelResult.rows as ChannelSetting[];

  return (
    <AdminShell title="Marketplaces">
      <div className="space-y-6">
        {params.queued ? (
          <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-600">
            Marketplace work was queued for the background worker.
          </p>
        ) : null}
        {params.ebay_connected ? (
          <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-600">
            eBay {params.ebay_connected} OAuth was connected. Publishing remains disabled until the
            business-policy and pilot-SKU checks are complete.
          </p>
        ) : null}
        {params.settings ? (
          <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-600">
            Channel synchronization and owner-approved price rules were updated.
          </p>
        ) : null}
        {displayedError ? (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">
            {displayedError}
          </p>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="glass-panel rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[.2em] text-muted">Compliance gate</p>
            <p className="mt-2 text-lg font-semibold">{compliance ? "Verified" : "Publication blocked"}</p>
            <p className="mt-2 text-sm text-muted">
              {compliance
                ? `Verified by ${compliance.verified_by}`
                : "LUCID, WEEE, battery and GPSR evidence must be reviewed first."}
            </p>
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[.2em] text-muted">Amazon.de</p>
            <p className="mt-2 text-sm text-muted">
              New items only. Used, open-box and refurbished remain blocked until Amazon Renewed
              approval is recorded.
            </p>
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[.2em] text-muted">eBay.de</p>
            <p className="mt-2 text-sm text-muted">
              Sandbox OAuth: {sandboxConnected ? "connected" : "not connected"}
              <br />
              Production OAuth: {productionConnected ? "connected" : "not connected"}
            </p>
            <p className="mt-2 text-xs text-muted">
              OAuth access does not publish products. German payment, fulfillment and return policies
              plus an approved pilot SKU are still required.
            </p>
            <p
              className={`mt-2 text-xs ${
                pendingDeletionCount ? "text-amber-600" : "text-muted"
              }`}
            >
              Account-deletion requests pending review: {pendingDeletionCount}
            </p>
            {isAdmin ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  className="btn-secondary px-3 py-2 text-xs"
                  href="/api/admin/marketplaces/ebay/connect?environment=sandbox"
                >
                  {sandboxConnected ? "Reconnect Sandbox" : "Connect Sandbox"}
                </Link>
                <Link
                  className="btn-secondary px-3 py-2 text-xs"
                  href="/api/admin/marketplaces/ebay/connect?environment=production"
                >
                  {productionConnected ? "Reconnect Production" : "Connect Production"}
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-6">
          <div className="max-w-3xl">
            <h2 className="text-lg font-semibold">Channel controls</h2>
            <p className="mt-2 text-sm text-muted">
              The website price remains the base. No marketplace is activated until an owner saves
              and confirms its rule. Disabling a channel stops new outbound synchronization without
              changing the authoritative local stock.
            </p>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {channelSettings.map((setting) => {
              const isGoogle = setting.marketplace === "google_merchant";
              const label = isGoogle ? "Google Merchant" : setting.marketplace === "ebay_de" ? "eBay.de" : "Amazon.de";
              return (
                <form key={setting.marketplace} action={updateChannelSettings} className="rounded-xl border border-border/60 p-4">
                  <input type="hidden" name="marketplace" value={setting.marketplace} />
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{label}</h3>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${setting.enabled ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                      {setting.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <label className="flex items-center gap-2"><input name="enabled" type="checkbox" defaultChecked={setting.enabled} /> Channel enabled</label>
                    <label className="flex items-center gap-2"><input name="stockSync" type="checkbox" defaultChecked={setting.stock_sync_enabled} /> Stock synchronization</label>
                    {!isGoogle ? <label className="flex items-center gap-2"><input name="priceSync" type="checkbox" defaultChecked={setting.price_sync_enabled} /> Price synchronization</label> : null}
                    {!isGoogle ? <label className="flex items-center gap-2"><input name="orderSync" type="checkbox" defaultChecked={setting.order_sync_enabled} /> Import seller-fulfilled orders</label> : null}
                  </div>
                  {!isGoogle ? (
                    <>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <label className="text-xs text-muted">Markup %<input name="priceMarkupPercent" type="number" step="0.01" min="-50" max="500" defaultValue={Number(setting.price_markup_percent)} className="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-foreground" /></label>
                        <label className="text-xs text-muted">Fixed EUR<input name="priceMarkupFixed" type="number" step="0.01" min="-1000" max="10000" defaultValue={Number(setting.price_markup_fixed)} className="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-foreground" /></label>
                      </div>
                      <label className="mt-3 flex items-start gap-2 text-xs">
                        <input name="confirmPriceRule" type="checkbox" defaultChecked={Boolean(setting.price_rule_confirmed_at)} />
                        <span>I am the owner and confirm this marketplace price rule.</span>
                      </label>
                    </>
                  ) : (
                    <p className="mt-4 text-xs text-muted">Google uses the website price; this channel synchronizes online and Hamburg local availability.</p>
                  )}
                  <button disabled={!isAdmin} className="btn-secondary mt-4 w-full px-4 py-2 text-sm disabled:opacity-40">Save controls</button>
                </form>
              );
            })}
          </div>
        </section>

        {isAdmin ? (
          <section className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Administrator compliance review</h2>
            <form action={verifyMarketplaceCompliance} className="mt-4 flex flex-wrap gap-4 text-sm">
              <label>
                <input name="lucid" type="checkbox" /> LUCID packaging
              </label>
              <label>
                <input name="weee" type="checkbox" /> WEEE / ElektroG
              </label>
              <label>
                <input name="batteries" type="checkbox" /> Batteries
              </label>
              <label>
                <input name="gpsr" type="checkbox" /> GPSR contacts &amp; safety
              </label>
              <input
                name="notes"
                placeholder="Evidence reference"
                className="rounded-lg border border-border bg-transparent px-3 py-2"
              />
              <button className="btn-primary px-4 py-2">Mark verified</button>
            </form>
          </section>
        ) : null}

        <section className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Listings</h2>
            <form action={queueMarketplaceOperation}>
              <input type="hidden" name="marketplace" value="amazon_de" />
              <input type="hidden" name="operation" value="reconcile" />
              <button className="btn-secondary px-4 py-2 text-sm">Queue reconciliation</button>
            </form>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr>
                  <th className="p-2">SKU</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Fulfillment</th>
                  <th>Issue</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {listings.length ? (
                  listings.map((item) => (
                    <tr key={`${item.sku}-${item.marketplace}`} className="border-t border-border/50">
                      <td className="p-2 font-mono">{item.sku}</td>
                      <td>{item.marketplace}</td>
                      <td>{item.status}</td>
                      <td>{item.price ?? "—"}</td>
                      <td>{item.fulfillment_mode ?? "—"}</td>
                      <td className="max-w-xs text-red-500">
                        {item.last_error ?? (item.approved_at ? `Approved by ${item.approved_by ?? "owner"}` : "Awaiting approval")}
                      </td>
                      <td>
                        <form action={queueMarketplaceOperation}>
                          <input type="hidden" name="marketplace" value={item.marketplace} />
                          <input type="hidden" name="sku" value={item.sku} />
                          <input type="hidden" name="operation" value="publish" />
                          <button className="text-xs underline">Publish / retry</button>
                        </form>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-6 text-muted" colSpan={7}>
                      No listings yet. Add compliant product data, then publish a pilot SKU.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Recent sync activity</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {jobs.length ? (
                jobs.map((job, index) => (
                  <li key={index} className="border-b border-border/50 pb-2">
                    <span className="font-medium">
                      {job.marketplace} · {job.operation}
                    </span>{" "}
                    — {job.status}
                    {job.last_error ? `: ${job.last_error}` : ""}
                  </li>
                ))
              ) : (
                <li className="text-muted">No work queued.</li>
              )}
            </ul>
          </div>
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Marketplace orders</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {orderResult.rows.length ? (
                orderResult.rows.map(
                  (order: { marketplace: string; external_order_id: string; status: string }) => (
                    <li key={`${order.marketplace}-${order.external_order_id}`}>
                      {order.marketplace} · <span className="font-mono">{order.external_order_id}</span> —{" "}
                      {order.status}
                    </li>
                  ),
                )
              ) : (
                <li className="text-muted">Imported channel orders will appear here once connected.</li>
              )}
            </ul>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
