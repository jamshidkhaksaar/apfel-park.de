import { NextResponse } from "next/server";

import { createAdminDbClient } from "@/lib/admin-db";
import { readSessionUser } from "@/lib/session";

type OrderExportRow = {
  order_number: number | null;
  customer_name: string | null;
  customer_email: string | null;
  status: string | null;
  payment_status: string | null;
  provider: string | null;
  shipping_method: string | null;
  total_amount: number | string | null;
  currency: string | null;
  created_at: string | null;
};

const toCsvString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  return String(value);
};

const escapeCsv = (value: unknown): string => {
  let processedValue = toCsvString(value);

  // Prevent CSV Injection (Formula Injection) by prefixing potentially dangerous characters
  // Accounting for leading spaces which some spreadsheet applications ignore before a formula
  if (/^\s*[=+\-@\t\r]/.test(processedValue)) {
    processedValue = `'${processedValue}`;
  }

  if (processedValue.includes(",") || processedValue.includes("\n") || processedValue.includes('"')) {
    return `"${processedValue.replaceAll('"', '""')}"`;
  }
  return processedValue;
};

export async function GET() {
  const user = await readSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminDbClient();
  const { data, error } = await admin
    .from("orders")
    .select("order_number,customer_name,customer_email,status,payment_status,provider,shipping_method,total_amount,currency,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as OrderExportRow[];
  const header = ["order_number", "customer_name", "customer_email", "status", "payment_status", "provider", "shipping_method", "total_amount", "currency", "created_at"];

  const csvRows = rows.map((row) =>
    (() => {
      const amount = Number(row.total_amount);
      return [
        row.order_number ?? "",
        row.customer_name ?? "",
        row.customer_email ?? "",
        row.status ?? "",
        row.payment_status ?? "",
        row.provider ?? "",
        row.shipping_method ?? "",
        Number.isFinite(amount) ? amount.toString() : "",
        row.currency ?? "EUR",
        row.created_at ?? "",
      ];
    })()
      .map((value) => escapeCsv(value))
      .join(","),
  );

  const csv = [header.join(","), ...csvRows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
