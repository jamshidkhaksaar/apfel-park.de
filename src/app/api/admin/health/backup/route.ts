import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { chmod, mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";

import { NextRequest, NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin-auth";
import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { buildAppBackupArgs, buildPgDumpInvocation } from "@/lib/database-backup";
import { readSessionUserFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";

let backupInProgress = false;

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const methodNotAllowed = () => NextResponse.json(
  { error: "Method not allowed" },
  { status: 405, headers: { Allow: "POST" } },
);

const runCommand = (
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> => new Promise((resolve, reject) => {
  const child = spawn(command, args, {
    stdio: ["ignore", "ignore", "pipe"],
    env,
    signal: AbortSignal.timeout(15 * 60 * 1000),
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    if (stderr.length < 64_000) stderr += chunk.toString();
  });
  child.once("error", reject);
  child.once("close", (code, signal) => {
    if (code === 0) resolve();
    else reject(new Error(`${command} failed (${code ?? signal ?? "unknown"}): ${stderr.slice(0, 2_000)}`));
  });
});

export const GET = methodNotAllowed;

export async function POST(request: NextRequest) {
  const user = await readSessionUserFromRequest(request);
  if (!isAdminUser(user)) return unauthorized();
  const csrf = rejectCrossSiteAdminMutation(request, "Unauthorized");
  if (csrf) return csrf;
  if (backupInProgress) {
    return NextResponse.json({ error: "A backup is already running" }, { status: 409 });
  }

  const type = request.nextUrl.searchParams.get("type");
  if (type !== "database" && type !== "app") {
    return NextResponse.json({ error: "Invalid backup type" }, { status: 400 });
  }

  backupInProgress = true;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const database = type === "database";
  const filename = database
    ? `apfel-park-database-${timestamp}.sql`
    : `apfel-park-app-${timestamp}.tar.gz`;
  let directory = "";

  try {
    directory = await mkdtemp(path.join(tmpdir(), "apfel-backup-"));
    const filePath = path.join(directory, filename);
    if (database) {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) throw new Error("DATABASE_URL is not configured");
      const invocation = buildPgDumpInvocation(databaseUrl);
      await runCommand(
        "pg_dump",
        [...invocation.args, "--file", filePath],
        { ...process.env, ...invocation.env },
      );
    } else {
      await runCommand("tar", buildAppBackupArgs(filePath));
    }

    const info = await stat(filePath);
    if (!info.isFile() || info.size <= 0) throw new Error("Backup command produced no data");
    await chmod(filePath, 0o600);
    const stream = createReadStream(filePath);
    stream.once("close", () => {
      void rm(directory, { recursive: true, force: true });
    });
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": database ? "application/sql; charset=utf-8" : "application/gzip",
        "Content-Length": String(info.size),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (directory) await rm(directory, { recursive: true, force: true });
    console.error("[Admin Backup] Failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Backup could not be created" }, { status: 500 });
  } finally {
    backupInProgress = false;
  }
}
