import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createDbClient, query } from "@/lib/db";

export type UserRole = "admin" | "manager" | "product_editor";

export const VALID_ROLES: UserRole[] = ["admin", "manager", "product_editor"];

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UserPublic = {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password: string, stored: string): boolean => {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const computed = Buffer.from(scryptSync(password, salt, 64).toString("hex"));
  const expected = Buffer.from(hash);
  if (computed.length !== expected.length) return false;
  return timingSafeEqual(computed, expected);
};

const normalizeRole = (role: string): UserRole => {
  const normalized = role.toLowerCase().trim();
  if (VALID_ROLES.includes(normalized as UserRole)) {
    return normalized as UserRole;
  }
  return "product_editor";
};

const toPublic = (row: UserRow): UserPublic => ({
  id: row.id,
  email: row.email,
  role: row.role,
  is_active: row.is_active,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const getUserByEmail = async (email: string): Promise<UserRow | null> => {
  const db = createDbClient();
  const { data } = await db
    .from<UserRow>("users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .eq("is_active", true)
    .maybeSingle();
  return data ?? null;
};

export const getUserById = async (id: string): Promise<UserRow | null> => {
  const db = createDbClient();
  const { data } = await db.from<UserRow>("users").select("*").eq("id", id).maybeSingle();
  return data ?? null;
};

export const listUsers = async (): Promise<UserPublic[]> => {
  const db = createDbClient();
  const { data } = await db
    .from<UserRow>("users")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as UserRow[] | null)?.map(toPublic) ?? [];
};

export const createUser = async (params: {
  email: string;
  password: string;
  role: string;
}): Promise<UserPublic | null> => {
  const db = createDbClient();
  const email = params.email.toLowerCase().trim();
  const role = normalizeRole(params.role);

  const { data: existing } = await db
    .from<UserRow>("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) return null;

  const password_hash = hashPassword(params.password);
  const now = new Date().toISOString();

  const { data } = await db
    .from<UserRow>("users")
    .insert({
      email,
      password_hash,
      role,
      is_active: true,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  return data ? toPublic(data as UserRow) : null;
};

export const updateUser = async (
  id: string,
  params: {
    email?: string;
    password?: string;
    role?: string;
    isActive?: boolean;
  },
): Promise<UserPublic | null> => {
  const existing = await getUserById(id);
  if (!existing) return null;

  const setParts: string[] = [];
  const values: unknown[] = [id];
  let idx = 2;

  if (params.email !== undefined) {
    setParts.push(`"email" = $${idx++}`);
    values.push(params.email.toLowerCase().trim());
  }
  if (params.password) {
    setParts.push(`"password_hash" = $${idx++}`);
    values.push(hashPassword(params.password));
  }
  if (params.role !== undefined) {
    setParts.push(`"role" = $${idx++}`);
    values.push(normalizeRole(params.role));
  }
  if (params.isActive !== undefined) {
    setParts.push(`"is_active" = $${idx++}`);
    values.push(params.isActive);
  }

  if (setParts.length === 0) return toPublic(existing);

  setParts.push(`"updated_at" = $${idx++}`);
  values.push(new Date().toISOString());

  const result = await query(
    `UPDATE "users" SET ${setParts.join(", ")} WHERE "id" = $1 RETURNING *`,
    values,
  );

  const row = result.rows[0] as UserRow | undefined;
  return row ? toPublic(row) : null;
};

export const deleteUser = async (id: string): Promise<boolean> => {
  const db = createDbClient();

  const { data: existing } = await db
    .from<UserRow>("users")
    .select("id, email")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return false;

  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean),
  );
  if (adminEmails.has((existing as { email: string }).email.toLowerCase())) return false;

  await query('DELETE FROM "users" WHERE "id" = $1', [id]);
  return true;
};

export const verifyUserCredentials = async (
  email: string,
  password: string,
): Promise<{ valid: false } | { valid: true; role: UserRole }> => {
  const user = await getUserByEmail(email);
  if (!user) return { valid: false };
  if (!verifyPassword(password, user.password_hash)) return { valid: false };
  return { valid: true, role: user.role };
};
