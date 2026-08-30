export type OfferSubscriberStatus = "active" | "pending" | "unsubscribed";

export type OfferSubscriberRow = {
  id: string;
  email: string;
  locale: string;
  confirmed_at: string | null;
  confirmation_sent_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
};

export const getOfferSubscriberStatus = (row: OfferSubscriberRow): OfferSubscriberStatus => {
  if (row.unsubscribed_at) return "unsubscribed";
  return row.confirmed_at ? "active" : "pending";
};

export const canReactivateOfferSubscriber = (row: OfferSubscriberRow): boolean =>
  Boolean(row.confirmed_at && row.unsubscribed_at);

export const filterOfferSubscribers = (
  rows: OfferSubscriberRow[],
  filters: { query: string; status: OfferSubscriberStatus | "all" },
): OfferSubscriberRow[] => {
  const query = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.status !== "all" && getOfferSubscriberStatus(row) !== filters.status) return false;
    if (!query) return true;
    return row.email.toLowerCase().includes(query) || row.locale.toLowerCase().includes(query);
  });
};

const escapeCsv = (value: string): string => {
  let safe = value;
  if (/^\s*[=+\-@\t\r]/.test(safe)) safe = `'${safe}`;
  if (safe.includes(",") || safe.includes("\n") || safe.includes('"')) {
    return `"${safe.replaceAll('"', '""')}"`;
  }
  return safe;
};

export const serializeOfferSubscribersCsv = (rows: OfferSubscriberRow[]): string => {
  const header = [
    "email",
    "locale",
    "status",
    "created_at",
    "confirmation_sent_at",
    "confirmed_at",
    "unsubscribed_at",
    "updated_at",
  ];
  const data = rows.map((row) => [
    row.email,
    row.locale,
    getOfferSubscriberStatus(row),
    row.created_at,
    row.confirmation_sent_at ?? "",
    row.confirmed_at ?? "",
    row.unsubscribed_at ?? "",
    row.updated_at,
  ].map(escapeCsv).join(","));
  return [header.join(","), ...data].join("\n");
};
