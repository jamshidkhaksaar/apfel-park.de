import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

type OrderExportRow = {
  order_number: number | null;
  customer_name: string | null;
  customer_email: string;
  status: string | null;
  total_amount: number | string;
  created_at: string;
};

const escapeCsv = (value: string): string => {
  let processedValue = value;

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("orders")
    .select("order_number,customer_name,customer_email,status,total_amount,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as OrderExportRow[];
  const header = ["order_number", "customer_name", "customer_email", "status", "total_amount", "created_at"];

  const csvRows = rows.map((row) =>
    (() => {
      const amount = Number(row.total_amount);
      return [
        row.order_number?.toString() ?? "",
        row.customer_name ?? "",
        row.customer_email,
        row.status ?? "",
        Number.isFinite(amount) ? amount.toString() : "",
        row.created_at,
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
