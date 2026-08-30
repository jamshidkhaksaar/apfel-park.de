import { describe, expect, it } from "vitest";

import { buildAppBackupArgs, buildPgDumpInvocation } from "@/lib/database-backup";

describe("database backup command", () => {
  it("keeps credentials out of argv and passes the password through the child environment", () => {
    const invocation = buildPgDumpInvocation(
      "postgresql://backup-user:super-secret@127.0.0.1:5432/apfel_park?sslmode=disable",
    );

    expect(invocation.args.join(" ")).not.toContain("super-secret");
    expect(invocation.args).toEqual(expect.arrayContaining([
      "--host", "127.0.0.1",
      "--port", "5432",
      "--username", "backup-user",
      "--dbname", "apfel_park",
    ]));
    expect(invocation.env).toMatchObject({ PGPASSWORD: "super-secret", PGSSLMODE: "disable" });
  });

  it("rejects non-PostgreSQL URLs", () => {
    expect(() => buildPgDumpInvocation("https://example.com/db")).toThrow();
  });

  it("dereferences the live release symlink into a completed archive file", () => {
    const args = buildAppBackupArgs("/tmp/final.tar.gz");
    expect(args).toContain("--dereference");
    expect(args).toContain("--exclude=current/public/uploads");
    expect(args).toEqual(expect.arrayContaining(["-czf", "/tmp/final.tar.gz", "current"]));
  });
});
