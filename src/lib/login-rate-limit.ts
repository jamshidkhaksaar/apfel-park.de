// In-memory brute-force protection for the admin login route. The app runs as a
// single Node process (systemd, standalone output), so process-local state is
// sufficient; a restart resets counters, which is acceptable for this use case.

type Entry = {
  count: number;
  windowStart: number;
  blockedUntil: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_ENTRIES = 10_000;

const attempts = new Map<string, Entry>();

const prune = (now: number) => {
  if (attempts.size < MAX_ENTRIES) return;
  for (const [key, entry] of attempts) {
    if (now - entry.windowStart > WINDOW_MS && entry.blockedUntil < now) {
      attempts.delete(key);
    }
  }
};

export const isLoginBlocked = (key: string): boolean => {
  const entry = attempts.get(key);
  if (!entry) return false;
  const now = Date.now();
  if (entry.blockedUntil > now) return true;
  if (now - entry.windowStart > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return false;
};

export const recordLoginFailure = (key: string): void => {
  const now = Date.now();
  prune(now);
  const entry = attempts.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attempts.set(key, { count: 1, windowStart: now, blockedUntil: 0 });
    return;
  }
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_MS;
  }
};

export const clearLoginFailures = (key: string): void => {
  attempts.delete(key);
};
