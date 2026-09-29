import { mkdir, writeFile } from 'node:fs/promises';
import { buildShippingEmail } from '../src/lib/order-shipping';
import { sendShippingStatusEmail } from '../src/lib/email';
import { withBusinessEmailIdentity } from '../src/lib/business-email-identity';

const main = async (): Promise<void> => {
  const recipient = process.argv.includes('--send-to') ? process.argv[process.argv.indexOf('--send-to') + 1] : null;
  if (recipient && recipient !== 'jamshid.khaksaar@gmail.com') throw new Error('Design previews may only be sent to the owner');
  const content = withBusinessEmailIdentity(buildShippingEmail({ customerName: 'Max Mustermann', orderNumber: 999999, stage: 'shipped', carrier: 'dhl', tracking: '00340434123456789012', preview: true }));
  await mkdir('/root/apfel-shipping-design', { recursive: true, mode: 0o700 });
  await writeFile('/root/apfel-shipping-design/Shipping-Email-Preview.html', content.html, { mode: 0o600 });
  if (recipient) {
    const result = await sendShippingStatusEmail(recipient, content);
    if (!result.success) throw new Error(result.error || 'Preview email failed');
    console.log('Shipping design preview accepted by SMTP for owner. No customer notified.');
  } else console.log('Shipping design preview written. No email sent.');
};
main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
