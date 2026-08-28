import os from "node:os";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { promisify } from "node:util";

import { NextRequest, NextResponse } from "next/server";

import { query } from "@/lib/db";
import { readSessionUserFromRequest } from "@/lib/session";
import { isAdminUser } from "@/lib/admin-auth";

const execFileAsync = promisify(execFile);

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const parseLogDate = (value: string): number | null => {
  const match = value.match(/^(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, day, monthName, year, hour, minute, second] = match;
  const months: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };
  const month = months[monthName];
  if (month === undefined) return null;
  return Date.UTC(Number(year), month, Number(day), Number(hour), Number(minute), Number(second));
};

const collectDirectorySize = async (directory: string): Promise<number> => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  let total = 0;

  for (const entry of entries) {
    const target = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      total += await collectDirectorySize(target);
      continue;
    }

    if (entry.isFile()) {
      const stat = await fs.stat(target);
      total += stat.size;
    }
  }

  return total;
};

const readRecentTraffic = async () => {
  let output = "";

  try {
    const result = await execFileAsync("tail", ["-n", "20000", "/var/log/nginx/access.log"], {
      maxBuffer: 8 * 1024 * 1024,
    });
    output = result.stdout;
  } catch {
    return {
      requests24h: 0,
      requests7d: 0,
      visitors24h: 0,
      visitors7d: 0,
      bandwidth24hBytes: 0,
      topRoutes: [] as Array<{ path: string; hits: number }>,
      statusCounts: { s2xx: 0, s3xx: 0, s4xx: 0, s5xx: 0 },
    };
  }

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const visitors24 = new Set<string>();
  const visitors7 = new Set<string>();
  const topRoutes = new Map<string, number>();
  const statusCounts = { s2xx: 0, s3xx: 0, s4xx: 0, s5xx: 0 };
  let requests24h = 0;
  let requests7d = 0;
  let bandwidth24hBytes = 0;

  const lines = output.split("\n").filter(Boolean);

  for (const line of lines) {
    const match = line.match(/^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+)\s([^"]*?)\sHTTP\/[^"]+" (\d{3}) (\d+|-)/);
    if (!match) continue;

    const [, ip, rawDate, method, rawPath, statusText, sizeText] = match;
    const timestamp = parseLogDate(rawDate);
    if (!timestamp) continue;

    const normalizedPath = rawPath.split("?")[0] || "/";
    const status = Number(statusText);
    const size = sizeText === "-" ? 0 : Number(sizeText);

    if (timestamp >= sevenDaysAgo) {
      requests7d += 1;
      visitors7.add(ip);
    }

    if (timestamp >= oneDayAgo) {
      requests24h += 1;
      visitors24.add(ip);
      bandwidth24hBytes += Number.isFinite(size) ? size : 0;
      if (status >= 200 && status < 300) statusCounts.s2xx += 1;
      else if (status >= 300 && status < 400) statusCounts.s3xx += 1;
      else if (status >= 400 && status < 500) statusCounts.s4xx += 1;
      else if (status >= 500) statusCounts.s5xx += 1;

      if (
        method === "GET" &&
        !normalizedPath.startsWith("/_next") &&
        !normalizedPath.startsWith("/api") &&
        !normalizedPath.includes(".") &&
        normalizedPath !== "/favicon.ico"
      ) {
        topRoutes.set(normalizedPath, (topRoutes.get(normalizedPath) ?? 0) + 1);
      }
    }
  }

  return {
    requests24h,
    requests7d,
    visitors24h: visitors24.size,
    visitors7d: visitors7.size,
    bandwidth24hBytes,
    topRoutes: Array.from(topRoutes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([path, hits]) => ({ path, hits })),
    statusCounts,
  };
};

const readLogLines = async (command: string, args: string[]) => {
  try {
    const { stdout } = await execFileAsync(command, args, { maxBuffer: 2 * 1024 * 1024 });
    return stdout.split("\n").filter(Boolean).slice(-60);
  } catch {
    return [] as string[];
  }
};

const readSingleLine = async (command: string, args: string[]) => {
  try {
    const { stdout } = await execFileAsync(command, args, { maxBuffer: 256 * 1024 });
    return stdout.trim();
  } catch {
    return "Unavailable";
  }
};

export async function GET(request: NextRequest) {
  const user = await readSessionUserFromRequest(request);
  if (!isAdminUser(user)) return unauthorized();

  try {
    const [
      traffic,
      rootStat,
      uploadsStat,
      dbSizeResult,
      productCountResult,
      orderCountResult,
      repairCountResult,
      chatCountResult,
      recaptchaResult,
      appLogs,
      dbLogs,
      nginxLogs,
      firewallStatus,
      fail2banStatus,
      appService,
    ] = await Promise.all([
      readRecentTraffic(),
      fs.statfs("/"),
      collectDirectorySize("/srv/apfel-park/app/shared/uploads"),
      query(`SELECT pg_database_size(current_database())::bigint AS size`),
      query(`SELECT COUNT(*)::int AS count FROM products`),
      query(`SELECT COUNT(*)::int AS count FROM orders`),
      query(`SELECT COUNT(*)::int AS count FROM repairs`),
      query(`SELECT COUNT(*)::int AS count FROM chat_conversations`),
      query(`SELECT value FROM store_settings WHERE key = 'recaptcha' LIMIT 1`),
      readLogLines("journalctl", ["-u", "apfel-park-nextjs.service", "-n", "60", "--no-pager", "-o", "short-iso"]),
      readLogLines("journalctl", ["-u", "postgresql", "-n", "60", "--no-pager", "-o", "short-iso"]),
      readLogLines("tail", ["-n", "60", "/var/log/nginx/error.log"]),
      readSingleLine("ufw", ["status"]),
      readSingleLine("fail2ban-client", ["status"]),
      readSingleLine("systemctl", ["is-active", "apfel-park-nextjs.service"]),
    ]);

    const rootTotal = Number(rootStat.blocks) * Number(rootStat.bsize);
    const rootAvailable = Number(rootStat.bavail) * Number(rootStat.bsize);
    const rootUsed = rootTotal - rootAvailable;
    const recaptchaValue = (recaptchaResult.rows[0]?.value ?? {}) as { enabled?: boolean };
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const cpuLoads = os.loadavg();
    const cpuCount = os.cpus().length;
    const cpuLoadPercent = cpuCount > 0 ? (cpuLoads[0] / cpuCount) * 100 : 0;

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      overview: {
        requests24h: traffic.requests24h,
        visitors24h: traffic.visitors24h,
        topPage: traffic.topRoutes[0]?.path ?? "-",
        dbSizeBytes: Number(dbSizeResult.rows[0]?.size ?? 0),
        cpuLoadPercent,
        memoryUsagePercent: totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0,
        diskUsagePercent: rootTotal > 0 ? (rootUsed / rootTotal) * 100 : 0,
        uploadsUsageBytes: uploadsStat,
      },
      traffic,
      server: {
        platform: `${os.type()} ${os.release()}`,
        uptimeSeconds: os.uptime(),
        appService,
        ram: {
          total: totalMemory,
          used: usedMemory,
          free: freeMemory,
        },
        cpu: {
          cores: cpuCount,
          model: os.cpus()[0]?.model ?? "Unknown",
          load1: cpuLoads[0],
          load5: cpuLoads[1],
          load15: cpuLoads[2],
        },
        storage: {
          rootTotal,
          rootUsed,
          rootAvailable,
          uploadsUsed: uploadsStat,
        },
        database: {
          sizeBytes: Number(dbSizeResult.rows[0]?.size ?? 0),
          productCount: Number(productCountResult.rows[0]?.count ?? 0),
          orderCount: Number(orderCountResult.rows[0]?.count ?? 0),
          repairCount: Number(repairCountResult.rows[0]?.count ?? 0),
          chatCount: Number(chatCountResult.rows[0]?.count ?? 0),
        },
        security: {
          firewall: firewallStatus,
          fail2ban: fail2banStatus,
          secureCookies: process.env.APP_SECURE_COOKIES === "true",
          recaptcha: Boolean(recaptchaValue.enabled),
        },
      },
      logs: {
        app: appLogs,
        database: dbLogs,
        nginx: nginxLogs,
      },
    });
  } catch (error) {
    console.error("[Admin Health API] Failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
