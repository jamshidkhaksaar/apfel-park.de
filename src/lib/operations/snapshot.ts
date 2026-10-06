import { withTransaction, type TransactionClient } from '@/lib/db';

export const readSnapshot = <T>(work: (client: TransactionClient) => Promise<T>): Promise<T> => withTransaction(async client => {
  await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
  await client.query("SET LOCAL statement_timeout='15s'");
  return work(client);
});
