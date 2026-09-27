import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { invoiceDesignSample } from '../src/lib/order-invoice';
import { renderOrderInvoicePdf } from '../src/lib/order-invoice-pdf';
import { buildCustomerInvoiceEmail } from '../src/lib/order-invoice-template';
import { sendCustomerInvoiceEmail } from '../src/lib/email';

const main = async () => {
  const args = process.argv.slice(2);
  const directory = path.resolve(args[args.indexOf('--output') + 1] && args.includes('--output') ? args[args.indexOf('--output') + 1] : '/tmp/apfel-invoice-design');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const invoice = invoiceDesignSample('de');
  const pdf = await renderOrderInvoicePdf(invoice);
  const email = buildCustomerInvoiceEmail(invoice);
  await writeFile(path.join(directory, 'Apfel-Park-Invoice-Design-Preview.pdf'), pdf, { mode: 0o600 });
  await writeFile(path.join(directory, 'Apfel-Park-Invoice-Email-Preview.html'), email.html, { mode: 0o600 });
  if (args.includes('--send-to')) {
    const to = args[args.indexOf('--send-to') + 1];
    if (to !== 'jamshid.khaksaar@gmail.com') throw new Error('The design review recipient must be the address authorized by the owner');
    const sent = await sendCustomerInvoiceEmail({ to, ...email, pdf, filename: 'Apfel-Park-Invoice-Design-Preview.pdf' });
    if (!sent.success) throw new Error(sent.error || 'Preview email failed');
    console.log('Design preview email accepted by SMTP for jamshid.khaksaar@gmail.com. No customer invoice issued.');
  }
  console.log(`Preview files: ${directory}`);
};
main().catch(error => { console.error(error instanceof Error ? error.message : 'Preview failed'); process.exitCode = 1; });
