import { Pool } from "pg";

type QueryResponse<T> = { data: T | null; error: { message: string } | null; count?: number | null };

type Filter =
  | { type: "eq"; column: string; value: unknown }
  | { type: "in"; column: string; value: unknown[] }
  | { type: "or"; value: string };

type Order = { column: string; ascending: boolean };

type QueryAction =
  | { type: "select"; columns: string; head?: boolean; count?: string | null }
  | { type: "insert"; values: Record<string, unknown>[]; returning?: string | null }
  | { type: "upsert"; values: Record<string, unknown>[]; onConflict: string; returning?: string | null };

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const quoteIdentifier = (value: string): string => {
  if (!VALID_IDENTIFIER.test(value)) {
    throw new Error(`Invalid SQL identifier: ${value}`);
  }
  return `"${value}"`;
};

const parseColumns = (columns: string): string => {
  if (columns.trim() === "*") return "*";
  return columns
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => quoteIdentifier(part))
    .join(", ");
};

const buildWhere = (filters: Filter[], startIndex = 1): { sql: string; values: unknown[] } => {
  if (filters.length === 0) {
    return { sql: "", values: [] };
  }

  const values: unknown[] = [];
  const clauses = filters.map((filter) => {
    if (filter.type === "eq") {
      values.push(filter.value);
      return `${quoteIdentifier(filter.column)} = $${startIndex + values.length - 1}`;
    }

    if (filter.type === "in") {
      values.push(filter.value);
      return `${quoteIdentifier(filter.column)} = ANY($${startIndex + values.length - 1})`;
    }

    const orClauses = filter.value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [column, operator, pattern] = part.split(".");
        if (operator !== "ilike") {
          throw new Error(`Unsupported OR operator: ${operator}`);
        }
        values.push(pattern.replaceAll("*", "%"));
        return `${quoteIdentifier(column)} ILIKE $${startIndex + values.length - 1}`;
      });

    return `(${orClauses.join(" OR ")})`;
  });

  return { sql: ` WHERE ${clauses.join(" AND ")}`, values };
};

class QueryBuilder<T = Record<string, unknown>> implements PromiseLike<QueryResponse<T>> {
  private filters: Filter[] = [];
  private orderBy: Order[] = [];
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private singleMode: "single" | "maybeSingle" | null = null;
  private action: QueryAction | null = null;

  constructor(private readonly table: string) {}

  select(columns: string, options?: { head?: boolean; count?: string | null }) {
    if (this.action?.type === "insert" || this.action?.type === "upsert") {
      this.action.returning = columns;
      return this;
    }
    this.action = { type: "select", columns, head: options?.head, count: options?.count };
    return this;
  }

  insert(values: Record<string, unknown> | Record<string, unknown>[]) {
    this.action = { type: "insert", values: Array.isArray(values) ? values : [values] };
    return this;
  }

  upsert(values: Record<string, unknown> | Record<string, unknown>[], options?: { onConflict?: string }) {
    this.action = {
      type: "upsert",
      values: Array.isArray(values) ? values : [values],
      onConflict: options?.onConflict ?? "id",
    };
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ type: "eq", column, value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ type: "in", column, value });
    return this;
  }

  or(value: string) {
    this.filters.push({ type: "or", value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  range(from: number, to: number) {
    this.offsetValue = Math.max(0, Math.floor(from));
    this.limitValue = Math.max(0, Math.floor(to) - this.offsetValue + 1);
    return this;
  }

  single() {
    this.singleMode = "single";
    return this;
  }

  maybeSingle() {
    this.singleMode = "maybeSingle";
    return this;
  }

  then<TResult1 = QueryResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<QueryResponse<T>> {
    try {
      if (!this.action) {
        throw new Error("No query action configured");
      }

      if (this.action.type === "select") {
        return await this.executeSelect();
      }

      if (this.action.type === "insert") {
        return await this.executeInsert();
      }

      return await this.executeUpsert();
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : "Unknown database error" },
        count: null,
      };
    }
  }

  private async executeSelect(): Promise<QueryResponse<T>> {
    const action = this.action as Extract<QueryAction, { type: "select" }>;
    const selectedColumns = action.head && action.count === "exact" ? "COUNT(*)::int AS __count" : parseColumns(action.columns);
    const { sql: whereSql, values } = buildWhere(this.filters);
    const orderSql =
      this.orderBy.length > 0
        ? ` ORDER BY ${this.orderBy
            .map((entry) => `${quoteIdentifier(entry.column)} ${entry.ascending ? "ASC" : "DESC"}`)
            .join(", ")}`
        : "";
    const limitSql =
      this.singleMode || this.limitValue
        ? ` LIMIT ${this.singleMode ? 1 : this.limitValue}`
        : "";
    const offsetSql = this.offsetValue !== null ? ` OFFSET ${this.offsetValue}` : "";

    const result = await pool.query(
      `SELECT ${selectedColumns} FROM ${quoteIdentifier(this.table)}${whereSql}${orderSql}${limitSql}${offsetSql}`,
      values,
    );

    if (action.head && action.count === "exact") {
      return {
        data: null,
        error: null,
        count: result.rows[0]?.__count ?? 0,
      };
    }

    if (this.singleMode === "single") {
      if (result.rows.length !== 1) {
        return { data: null, error: { message: "Expected a single row" } };
      }
      return { data: result.rows[0] as T, error: null };
    }

    if (this.singleMode === "maybeSingle") {
      if (result.rows.length > 1) {
        return { data: null, error: { message: "Expected zero or one row" } };
      }
      return { data: (result.rows[0] ?? null) as T | null, error: null };
    }

    return { data: result.rows as T, error: null };
  }

  private async executeInsert(): Promise<QueryResponse<T>> {
    const action = this.action as Extract<QueryAction, { type: "insert" }>;
    const values = action.values;
    if (values.length === 0) {
      return { data: null, error: null };
    }

    const columns = Object.keys(values[0]);
    const queryValues: unknown[] = [];
    const valueGroups = values.map((row) => {
      const placeholders = columns.map((column) => {
        queryValues.push(row[column] ?? null);
        return `$${queryValues.length}`;
      });
      return `(${placeholders.join(", ")})`;
    });

    const returning = action.returning ? ` RETURNING ${parseColumns(action.returning)}` : "";
    const result = await pool.query(
      `INSERT INTO ${quoteIdentifier(this.table)} (${columns.map(quoteIdentifier).join(", ")}) VALUES ${valueGroups.join(", ")}${returning}`,
      queryValues,
    );

    const rows = result.rows;
    if (this.singleMode === "single") {
      return { data: (rows[0] ?? null) as T, error: null };
    }
    return { data: rows as T, error: null };
  }

  private async executeUpsert(): Promise<QueryResponse<T>> {
    const action = this.action as Extract<QueryAction, { type: "upsert" }>;
    const values = action.values;
    if (values.length === 0) {
      return { data: null, error: null };
    }

    const columns = Object.keys(values[0]);
    const queryValues: unknown[] = [];
    const valueGroups = values.map((row) => {
      const placeholders = columns.map((column) => {
        queryValues.push(row[column] ?? null);
        return `$${queryValues.length}`;
      });
      return `(${placeholders.join(", ")})`;
    });

    const conflictColumn = quoteIdentifier(action.onConflict);
    const updateColumns = columns
      .filter((column) => column !== action.onConflict)
      .map((column) => `${quoteIdentifier(column)} = EXCLUDED.${quoteIdentifier(column)}`)
      .join(", ");

    const returning = action.returning ? ` RETURNING ${parseColumns(action.returning)}` : "";
    const result = await pool.query(
      `INSERT INTO ${quoteIdentifier(this.table)} (${columns.map(quoteIdentifier).join(", ")})
       VALUES ${valueGroups.join(", ")}
       ON CONFLICT (${conflictColumn}) DO UPDATE SET ${updateColumns}${returning}`,
      queryValues,
    );

    if (this.singleMode === "single") {
      return { data: (result.rows[0] ?? null) as T, error: null };
    }

    return { data: result.rows as T, error: null };
  }
}

type LocalAuth = {
  getUser: () => Promise<{ data: { user: import("@/lib/auth-types").User | null }; error: null }>;
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ error: { message: string } | null }>;
  signOut: () => Promise<{ error: null }>;
};

export const createServerDbClient = (auth: LocalAuth) => ({
  auth,
  from: <T = Record<string, unknown>>(table: string) => new QueryBuilder<T>(table),
});

export const createDbClient = () => ({
  from: <T = Record<string, unknown>>(table: string) => new QueryBuilder<T>(table),
});

export const query = (text: string, values?: unknown[]) => pool.query(text, values);
