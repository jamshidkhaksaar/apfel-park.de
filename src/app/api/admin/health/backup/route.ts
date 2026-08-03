import { spawn } from "node:child_process";
import { Readable } from "node:stream";

import { NextRequest, NextResponse } from "next/server";

import { readSessionUserFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(request: NextRequest) {
  if (!readSessionUserFromRequest(request)) {
    return unauthorized();
  }

  const type = request.nextUrl.searchParams.get("type");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  if (type === "database") {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json({ error: "DATABASE_URL is not configured" }, { status: 500 });
    }

    const child = spawn("pg_dump", ["--no-owner", "--no-privileges", databaseUrl], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stderr.on("data", (chunk) => console.error("[Admin Backup] pg_dump:", chunk.toString()));
    return new NextResponse(Readable.toWeb(child.stdout) as ReadableStream, {
      headers: {
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": `attachment; filename="apfel-park-database-${timestamp}.sql"`,
        "Cache-Control": "no-store",
      },
    });
  }

  if (type === "app") {
    const child = spawn(
      "tar",
      [
        "-czf", "-",
        "--exclude=.next", "--exclude=node_modules", "--exclude=.git",
        "-C", "/srv/apfel-park/app",
        "current", "shared/uploads", "shared/private",
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    child.stderr.on("data", (chunk) => console.error("[Admin Backup] tar:", chunk.toString()));
    return new NextResponse(Readable.toWeb(child.stdout) as ReadableStream, {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="apfel-park-app-${timestamp}.tar.gz"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({ error: "Invalid backup type" }, { status: 400 });
}
