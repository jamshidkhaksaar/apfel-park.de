/**
 * Copy of /trade-in, shared by the page and its markdown twin.
 */

import type { Locale } from '@/lib/i18n';

export const tradeInCopy = (locale: Locale) => locale === 'de'
  ? {
      title: 'Altes Gerät verkaufen',
      intro: 'Sende uns die wichtigsten Daten und echte Fotos. Ein Mitarbeiter prüft die Anfrage und erstellt ein unverbindliches Angebot. Der endgültige Preis wird erst nach Geräteprüfung bestätigt.',
      detailsTitle: 'Angaben zu deinem Gerät',
    }
  : {
      title: 'Sell your old device',
      intro: 'Send the key details and real photos. A staff member reviews the request and prepares a non-binding quote. The final price is confirmed only after device inspection.',
      detailsTitle: 'Your device details',
    };
