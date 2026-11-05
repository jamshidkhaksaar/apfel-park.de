import { runTelegramProductWorkerPass } from '../src/lib/telegram-products/worker';

let stopping = false;
process.on('SIGTERM', () => {
  stopping = true;
});
process.on('SIGINT', () => {
  stopping = true;
});
const main = async (): Promise<void> => {
  do {
    try {
      await runTelegramProductWorkerPass();
    } catch {
      console.error(
        '[telegram-product-worker] pass failed; see protected service diagnostics',
      );
    }
    if (process.argv.includes('--once')) break;
    if (!stopping) await new Promise((resolve) => setTimeout(resolve, 2000));
  } while (!stopping);
};
void main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
