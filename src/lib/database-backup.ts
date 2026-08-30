export const buildPgDumpInvocation = (databaseUrl: string): {
  args: string[];
  env: Record<string, string>;
} => {
  const url = new URL(databaseUrl);
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use PostgreSQL");
  }
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  const username = decodeURIComponent(url.username);
  if (!url.hostname || !database || !username) {
    throw new Error("DATABASE_URL is incomplete");
  }
  const port = url.port || "5432";
  const env: Record<string, string> = {};
  if (url.password) env.PGPASSWORD = decodeURIComponent(url.password);
  const sslMode = url.searchParams.get("sslmode");
  if (sslMode) env.PGSSLMODE = sslMode;

  return {
    args: [
      "--no-owner",
      "--no-privileges",
      "--host", url.hostname,
      "--port", port,
      "--username", username,
      "--dbname", database,
    ],
    env,
  };
};

export const buildAppBackupArgs = (filePath: string): string[] => [
  "--dereference",
  "-czf", filePath,
  "--exclude=.next",
  "--exclude=node_modules",
  "--exclude=.git",
  "--exclude=current/public/uploads",
  "-C", "/srv/apfel-park/app",
  "current",
  "shared/uploads",
  "shared/private",
];
