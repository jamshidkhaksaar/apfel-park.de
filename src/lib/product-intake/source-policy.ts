import type { ProposalSource } from './types';

const defaultManufacturerDomains = [
  'apple.com',
  'asus.com',
  'google.com',
  'honor.com',
  'huawei.com',
  'lenovo.com',
  'mi.com',
  'motorola.com',
  'motorola.de',
  'nokia.com',
  'oneplus.com',
  'oppo.com',
  'realme.com',
  'samsung.com',
  'samsungmobilepress.com',
  'sony.com',
  'sony.de',
];

const configuredDomains = (): string[] => (process.env.PRODUCT_INTAKE_ALLOWED_SOURCE_DOMAINS ?? '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const hostMatches = (host: string, domain: string): boolean => host === domain || host.endsWith(`.${domain}`);

export const isApprovedProposalSource = (source: ProposalSource): boolean => {
  let host: string;
  try {
    host = new URL(source.url).hostname.toLowerCase();
  } catch {
    return false;
  }
  const configured = configuredDomains();
  if (source.kind === 'shop_record') return hostMatches(host, 'apfel-park.de');
  if (source.kind === 'regulator') return hostMatches(host, 'eprel.ec.europa.eu');
  if (source.kind === 'gs1') return hostMatches(host, 'gs1.org');
  if (source.kind === 'licensed_portal') return configured.some((domain) => hostMatches(host, domain));
  return [...defaultManufacturerDomains, ...configured].some((domain) => hostMatches(host, domain));
};
