#!/usr/bin/env node
/**
 * Migration runner for supabase/migrations/*.sql
 *
 * Despite the directory name this project does not use Supabase -- it is plain
 * PostgreSQL via `pg`, and these are plain SQL files. Until now they were
 * applied by hand with nothing recording which had run, so the only way to know
 * the schema state was to inspect the database.
 *
 *   node scripts/migrate.mjs status     list applied / pending
 *   node scripts/migrate.mjs up         apply pending migrations
 *   node scripts/migrate.mjs baseline   record all as applied WITHOUT running
 *
 * `baseline` is for a database whose migrations were already applied by hand.
 * Each migration runs inside a transaction; a failure rolls back that file and
 * stops, leaving later migrations unapplied.
 */
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "migrations");
const cmd = process.argv[2] ?? "status";

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}

const sha = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);
const files = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

await client.query(`
  create table if not exists public.schema_migrations (
    filename   text primary key,
    checksum   text        not null,
    applied_at timestamptz not null default now()
  )
`);

const { rows } = await client.query("select filename, checksum from public.schema_migrations");
const applied = new Map(rows.map((r) => [r.filename, r.checksum]));

if (cmd === "status") {
  let pending = 0;
  for (const f of files) {
    const disk = sha(readFileSync(join(DIR, f), "utf8"));
    if (!applied.has(f)) { console.log(`  PENDING  ${f}`); pending++; }
    else if (applied.get(f) !== disk) console.log(`  CHANGED  ${f}  (applied checksum differs from file on disk)`);
    else console.log(`  applied  ${f}`);
  }
  console.log(`\n${files.length} migration(s), ${pending} pending`);
} else if (cmd === "baseline") {
  let n = 0;
  for (const f of files) {
    if (applied.has(f)) continue;
    await client.query(
      "insert into public.schema_migrations (filename, checksum) values ($1, $2) on conflict do nothing",
      [f, sha(readFileSync(join(DIR, f), "utf8"))],
    );
    console.log(`  recorded (not executed)  ${f}`);
    n++;
  }
  console.log(`\nbaselined ${n} migration(s)`);
} else if (cmd === "up") {
  let n = 0;
  for (const f of files) {
    if (applied.has(f)) continue;
    const sql = readFileSync(join(DIR, f), "utf8");
    process.stdout.write(`  applying ${f} ... `);
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query(
        "insert into public.schema_migrations (filename, checksum) values ($1, $2)",
        [f, sha(sql)],
      );
      await client.query("commit");
      console.log("ok");
      n++;
    } catch (err) {
      await client.query("rollback");
      console.log("FAILED");
      console.error(`\n${f}: ${err.message}`);
      await client.end();
      process.exit(1);
    }
  }
  console.log(`\napplied ${n} migration(s)`);
} else {
  console.error(`unknown command: ${cmd} (expected status|up|baseline)`);
  await client.end();
  process.exit(1);
}

await client.end();
