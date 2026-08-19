export type SqlResult<Row extends Record<string, unknown> = Record<string, unknown>> = {
  rows: Row[];
  rowCount: number | null;
};

export type SqlExecutor = {
  query: <Row extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ) => Promise<SqlResult<Row>>;
};

export type TransactionRunner = <T>(work: (executor: SqlExecutor) => Promise<T>) => Promise<T>;
