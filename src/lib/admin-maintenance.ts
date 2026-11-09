/**
 * Temporary stop for the till and inventory workspace.
 *
 * While this is true the two menu entries are shown as "under construction",
 * their pages render a notice instead of the workspace, and the in-shop sale
 * endpoint refuses every request, so a stale open tab cannot record stock,
 * ledger rows or anything else. Flip it to false to bring the workspace back.
 */
export const TILL_INVENTORY_UNDER_CONSTRUCTION = true;

export const maintenanceLabel = (lang: 'de' | 'en'): string =>
  lang === 'de' ? 'Im Aufbau' : 'Under construction';

export const maintenanceNotice = (lang: 'de' | 'en') =>
  lang === 'de'
    ? {
        eyebrow: 'Hinweis',
        title: 'Bereich im Aufbau',
        body: 'Kasse & Lager sowie die Lagerverwaltung sind vorübergehend deaktiviert. Es werden derzeit keine Verkäufe, Lagerbewegungen oder Berichte erfasst.',
      }
    : {
        eyebrow: 'Notice',
        title: 'Under construction',
        body: 'Till & Inventory and stock management are temporarily disabled. No sales, stock movements or reports are being recorded right now.',
      };
