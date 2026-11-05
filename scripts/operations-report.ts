import { query } from '../src/lib/db';
import { sendOperationsReportEmail } from '../src/lib/email';
import { buildShopReportEmail } from '../src/lib/operations/report-email';
import {
  dueReportKinds,
  previousReportPeriod,
  reportKindLabel,
  reportPeriod,
  type ReportKind,
} from '../src/lib/operations/report-periods';
import {
  claimReportRun,
  finishReportRun,
  readShopSalesSummary,
  resolveReportRecipients,
} from '../src/lib/operations/shop-report';

const kinds: ReportKind[] = ['daily', 'weekly', 'monthly'];
const args = new Map(
  process.argv.slice(2).map((argument) => {
    const [key, ...rest] = argument.replace(/^--/, '').split('=');
    return [key, rest.join('=')] as const;
  }),
);

const periodArgument = args.get('period') ?? 'auto';
if (periodArgument !== 'auto' && !kinds.includes(periodArgument as ReportKind)) {
  console.error(`[operations-report] invalid --period=${periodArgument}`);
  process.exit(1);
}

const dateArgument = args.get('date');
if (dateArgument && !/^\d{4}-\d{2}-\d{2}$/.test(dateArgument)) {
  console.error('[operations-report] invalid --date, expected YYYY-MM-DD');
  process.exit(1);
}
const now = dateArgument ? new Date(`${dateArgument}T12:00:00Z`) : new Date();
const dryRun = args.get('dry-run') === 'true' || args.get('dry-run') === '';

const branchLabel = async (): Promise<string> => {
  const result = await query("SELECT name FROM ops_branches WHERE active=true AND code<>'transit' ORDER BY code");
  const names = result.rows.map((row) => String(row.name));
  return names.length === 1 ? names[0] : `${names.length} Filialen`;
};

const run = async (): Promise<number> => {
  const selected = periodArgument === 'auto' ? dueReportKinds(now) : [periodArgument as ReportKind];
  const recipients = dryRun ? [] : await resolveReportRecipients();
  if (!dryRun && recipients.length === 0) {
    console.error('[operations-report] no valid report recipients configured');
    return 1;
  }
  const name = await branchLabel();
  let failures = 0;

  for (const kind of selected) {
    const period = reportPeriod(kind, now);
    const previousPeriod = previousReportPeriod(period);
    try {
      const [summary, previous] = [
        await readShopSalesSummary(undefined, null, period.from, period.to),
        await readShopSalesSummary(undefined, null, previousPeriod.from, previousPeriod.to),
      ];
      const email = buildShopReportEmail({ period, summary, previous, branchName: name });

      if (dryRun) {
        console.log(`[operations-report] ${reportKindLabel(kind)} ${period.from}..${period.to}`);
        console.log(email.text);
        continue;
      }

      const claim = await claimReportRun(kind, period.from, period.to, recipients);
      if (!claim) {
        console.log(`[operations-report] ${kind} ${period.from}..${period.to} already sent or in progress`);
        continue;
      }

      const result = await sendOperationsReportEmail({ to: recipients, ...email });
      if (!result.success) {
        await finishReportRun(claim, 'failed', result.error);
        console.error(`[operations-report] ${kind} send failed: ${result.error}`);
        failures += 1;
        continue;
      }

      await finishReportRun(claim, 'sent');
      console.log(
        JSON.stringify({
          report: kind,
          from: period.from,
          to: period.to,
          sales: summary.sales,
          units: summary.units,
          grossCents: summary.grossCents,
          netCents: summary.netCents,
          vatCents: summary.vatCents,
          recipients: recipients.length,
        }),
      );
    } catch (error) {
      failures += 1;
      console.error(
        `[operations-report] ${kind} ${period.from}..${period.to} failed:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  return failures ? 1 : 0;
};

run()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error('[operations-report] fatal:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
