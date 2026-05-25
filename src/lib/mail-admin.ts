import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomBytes } from "node:crypto";

const execFileAsync = promisify(execFile);

const MAIL_CONTAINER = "mailserver";
const MAIL_DOMAIN = "apfel-park.de";
const SYSTEM_MAILBOXES = new Set([`postmaster@${MAIL_DOMAIN}`]);

export type MailboxRecord = {
  email: string;
  localPart: string;
  usedDisplay: string;
  quotaDisplay: string;
  usedBytes: number;
  quotaBytes: number | null;
  percentUsed: number | null;
  isSystem: boolean;
};

const parseSize = (value: string): number | null => {
  const normalized = value.trim();
  if (!normalized || normalized === "~") return null;

  const match = normalized.match(/^([\d.]+)\s*([KMGTP]?)(?:i?B?)?$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;

  const unit = match[2].toUpperCase();
  const multipliers: Record<string, number> = {
    "": 1,
    K: 1024,
    M: 1024 ** 2,
    G: 1024 ** 3,
    T: 1024 ** 4,
    P: 1024 ** 5,
  };

  return Math.round(amount * (multipliers[unit] ?? 1));
};

const quotaToDisplay = (quotaBytes: number | null): string => {
  if (quotaBytes === null) return "Unlimited";
  const units = [
    { unit: "TB", value: 1024 ** 4 },
    { unit: "GB", value: 1024 ** 3 },
    { unit: "MB", value: 1024 ** 2 },
    { unit: "KB", value: 1024 },
  ];

  for (const entry of units) {
    if (quotaBytes >= entry.value) {
      return `${(quotaBytes / entry.value).toFixed(quotaBytes % entry.value === 0 ? 0 : 1)} ${entry.unit}`;
    }
  }

  return `${quotaBytes} B`;
};

const runSetup = async (args: string[]) => {
  const result = await execFileAsync(
    "docker",
    ["exec", MAIL_CONTAINER, "setup", ...args],
    {
      timeout: 20_000,
      maxBuffer: 1024 * 1024,
      env: process.env,
    },
  );

  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
};

const normalizeMailbox = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  const email = trimmed.includes("@") ? trimmed : `${trimmed}@${MAIL_DOMAIN}`;
  if (!email.endsWith(`@${MAIL_DOMAIN}`)) {
    throw new Error("Only apfel-park.de mailboxes are allowed.");
  }

  const [localPart] = email.split("@");
  if (!/^[a-z0-9._+-]+$/i.test(localPart)) {
    throw new Error("Invalid mailbox name.");
  }

  return email;
};

const normalizeQuotaInput = (value: string | null | undefined): string => {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "0";
  if (trimmed === "0" || trimmed === "~") return "0";
  if (!/^\d+(?:\.\d+)?[KMGTP]?$/i.test(trimmed)) {
    throw new Error("Quota must look like 500M, 2G, or 0 for unlimited.");
  }
  return trimmed.toUpperCase();
};

const normalizeMailboxPassword = (value: string | null | undefined): string => {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return generateMailboxPassword();
  if (trimmed.length < 12) {
    throw new Error("Mailbox password must be at least 12 characters.");
  }
  if (trimmed.length > 128) {
    throw new Error("Mailbox password must be 128 characters or fewer.");
  }
  return trimmed;
};

export const generateMailboxPassword = (): string => randomBytes(18).toString("base64url");

export const listMailboxes = async (): Promise<MailboxRecord[]> => {
  const output = await runSetup(["email", "list"]);

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("* "))
    .map((line) => {
      const match = line.match(/^\*\s+([^\s]+)\s+\(\s*([^/]+)\s*\/\s*([^)]+)\)\s+\[(\d+)%\]$/);
      if (!match) return null;

      const email = match[1].trim().toLowerCase();
      const usedDisplay = match[2].trim();
      const quotaRaw = match[3].trim();
      const usedBytes = parseSize(usedDisplay) ?? 0;
      const quotaBytes = parseSize(quotaRaw);
      const [localPart] = email.split("@");
      const percentUsed = quotaBytes && quotaBytes > 0 ? Math.min(100, Math.round((usedBytes / quotaBytes) * 100)) : null;

      return {
        email,
        localPart,
        usedDisplay,
        quotaDisplay: quotaRaw === "~" ? "Unlimited" : quotaToDisplay(quotaBytes),
        usedBytes,
        quotaBytes,
        percentUsed,
        isSystem: SYSTEM_MAILBOXES.has(email),
      };
    })
    .filter((entry): entry is MailboxRecord => entry !== null)
    .sort((left, right) => left.email.localeCompare(right.email));
};

export const createMailbox = async ({
  localPart,
  password,
  quota,
}: {
  localPart: string;
  password?: string;
  quota?: string;
}) => {
  const email = normalizeMailbox(localPart);
  const resolvedPassword = normalizeMailboxPassword(password);
  const resolvedQuota = normalizeQuotaInput(quota);

  await runSetup(["email", "add", email, resolvedPassword]);
  await runSetup(["quota", "set", email, resolvedQuota]);

  return { email, password: resolvedPassword };
};

export const resetMailboxPassword = async ({
  email,
  password,
}: {
  email: string;
  password?: string;
}) => {
  const mailbox = normalizeMailbox(email);
  const resolvedPassword = normalizeMailboxPassword(password);
  await runSetup(["email", "update", mailbox, resolvedPassword]);
  return { email: mailbox, password: resolvedPassword };
};

export const deleteMailbox = async ({ email }: { email: string }) => {
  const mailbox = normalizeMailbox(email);
  if (SYSTEM_MAILBOXES.has(mailbox)) {
    throw new Error("System mailboxes cannot be deleted.");
  }

  await runSetup(["email", "del", mailbox]);
  return { email: mailbox };
};

export const updateMailboxQuota = async ({
  email,
  quota,
}: {
  email: string;
  quota: string;
}) => {
  const mailbox = normalizeMailbox(email);
  const resolvedQuota = normalizeQuotaInput(quota);
  await runSetup(["quota", "set", mailbox, resolvedQuota]);
  return { email: mailbox, quota: resolvedQuota };
};
