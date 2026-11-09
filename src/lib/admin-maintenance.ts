/**
 * Temporary maintenance switches.
 *
 * The till stays under construction; the inventory menu is available again so
 * stock can be managed. In-shop sales remain blocked at the API so no stock
 * movement, ledger row or notification can be created from a stale open tab.
 * Flip a flag to false to bring that part back.
 */
export const TILL_UNDER_CONSTRUCTION = true;
export const INVENTORY_UNDER_CONSTRUCTION = false;
export const SHOP_SALES_DISABLED = true;

export const maintenanceLabel = (lang: 'de' | 'en'): string =>
  lang === 'de' ? 'Im Aufbau' : 'Under construction';

export const maintenanceNotice = (lang: 'de' | 'en') =>
  lang === 'de'
    ? {
        eyebrow: 'Hinweis',
        title: 'Kasse im Aufbau',
        body: 'Die Kassenfunktion ist vorübergehend deaktiviert. Es werden keine Verkäufe oder Kassenbelege erfasst.',
      }
    : {
        eyebrow: 'Notice',
        title: 'Till under construction',
        body: 'The till is temporarily disabled. No sales or receipts are being recorded.',
      };
