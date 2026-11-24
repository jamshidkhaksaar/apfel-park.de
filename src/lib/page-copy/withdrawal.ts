/**
 * Copy of /withdrawal, shared by the page and its markdown twin.
 */

import type { Locale } from '@/lib/i18n';

export const withdrawalCopy = (locale: Locale) => locale === 'de'
  ? {
      title: 'Vertrag widerrufen',
      subtitle: '14 Tage Widerrufsrecht bei Online-Käufen - einfach, ohne Begründung.',
    }
  : {
      title: 'Withdraw from contract',
      subtitle: '14-day withdrawal right for online purchases - simple, no reason needed.',
    };
