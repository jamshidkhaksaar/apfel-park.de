import type { Locale } from './i18n';
import type { StoreCatalogCollection } from './products';

export type CatalogAnalyticsList = { id: string; name: string };

const collectionNames = {
  'samsung-phones': { de: 'Samsung Handys', en: 'Samsung phones' },
  'used-iphones': { de: 'Gebrauchte iPhones', en: 'Used iPhones' },
  'phones-without-contract': { de: 'Handys ohne Vertrag', en: 'Phones without a contract' },
};

/** Only the measured three-page release opts in; other catalog defaults stay intact. */
export const getCollectionAnalyticsList = (
  collection: StoreCatalogCollection,
  locale: Locale,
): CatalogAnalyticsList | undefined => {
  if (!(collection in collectionNames)) return undefined;
  return { id: collection, name: collectionNames[collection as keyof typeof collectionNames][locale] };
};

export const catalogListFields = (name: string, id = 'store-catalog') => ({
  item_list_id: id,
  item_list_name: name,
});
