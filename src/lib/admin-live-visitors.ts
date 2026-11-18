import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const parseLogDate = (value: string): number | null => {
  const match = value.match(/^(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, day, monthName, year, hour, minute, second] = match;
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const month = months[monthName];
  if (month === undefined) return null;
  return Date.UTC(Number(year), month, Number(day), Number(hour), Number(minute), Number(second));
};

/** Distinct visitor IPs on public pages in the last five minutes (nginx log). */
export const readActiveVisitors = async () => {
  try {
    const { stdout } = await execFileAsync("tail", ["-n", "8000", "/var/log/nginx/access.log"], {
      maxBuffer: 4 * 1024 * 1024,
    });
    const lines = stdout.split("\n").filter(Boolean);
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const visitors = new Set<string>();

    for (const line of lines) {
      const match = line.match(/^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+)\s([^"]*?)\sHTTP\/[^"]+"/);
      if (!match) continue;
      const [, ip, rawDate, method, rawPath] = match;
      if (method !== "GET") continue;
      if (rawPath.startsWith("/_next") || rawPath.startsWith("/api")) continue;
      const timestamp = parseLogDate(rawDate);
      if (!timestamp || timestamp < fiveMinutesAgo) continue;
      visitors.add(ip);
    }

    return visitors.size;
  } catch {
    return 0;
  }
};

