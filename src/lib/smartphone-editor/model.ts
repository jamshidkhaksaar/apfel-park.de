import type { ProductPayload } from '@/lib/product-write-payload';
import {
  evaluateProductChannelReadiness,
  type ChannelKey,
  type ProductChannelFacts,
} from '@/lib/product-channel-readiness';
import { validateAdminProductCondition } from '@/lib/admin-product-validation';

export const channels: ChannelKey[] = ['store', 'google', 'ebay', 'amazon'];
export type PhotoSlot = { id: string; url: string };
export type PhoneEntry = {
  id: string;
  sourceProductId?: string;
  variantIndex?: number;
  color: string;
  storage: string;
  condition: 'new' | 'open_box' | 'used';
  price: number;
  stock: number;
  sku: string;
  batteryHealth: number | null;
  conditionNote: string;
  defects: string;
  accessories: string;
  hasRealProductPhotos: boolean;
  photos: PhotoSlot[];
  coverId: string;
  details: ProductPayload;
  channels: ChannelKey[];
};
export type PhoneDocument = {
  pendingShared?: ProductPayload;
  pendingSpecsText?: string;
  step: number;
  shared: ProductPayload;
  entries: PhoneEntry[];
};
export type ChannelStatus =
  | 'incomplete'
  | 'complete'
  | 'connection_required'
  | 'pending'
  | 'published'
  | 'failed';
export type PublishResult = {
  entryId: string;
  productId: string;
  channels: Partial<Record<ChannelKey, ChannelStatus>>;
};
export type PhoneDraft = {
  id: string;
  revision: number;
  document: PhoneDocument;
  results: PublishResult[];
};
export const newPhoneEntry = (source?: PhoneEntry): PhoneEntry => {
  const id = crypto.randomUUID();
  const photos = Array.from({ length: 4 }, () => ({
    id: crypto.randomUUID(),
    url: '',
  }));
  return {
    id,
    color: source?.color ?? '',
    storage: source?.storage ?? '',
    condition: source?.condition ?? 'new',
    price: source?.price ?? 0,
    stock: 1,
    sku: `AP-${id}`,
    batteryHealth: null,
    conditionNote: '',
    defects: '',
    accessories: '',
    hasRealProductPhotos: false,
    photos,
    coverId: photos[0].id,
    details: {},
    channels: [...channels],
  };
};
export const newPhoneDocument = (): PhoneDocument => ({
  step: 0,
  shared: {
    category: 'smartphones',
    brand: '',
    model: '',
    title: '',
    description: '',
  },
  entries: [newPhoneEntry()],
});
export const entryImages = (entry: PhoneEntry): string[] =>
  [...entry.photos]
    .sort(
      (a, b) => Number(b.id === entry.coverId) - Number(a.id === entry.coverId),
    )
    .map((p) => p.url)
    .filter(Boolean);
export const entryPayload = (
  document: PhoneDocument,
  entry: PhoneEntry,
): ProductPayload => ({
  ...document.shared,
  ...entry.details,
  category: 'smartphones',
  condition: entry.condition,
  price: entry.price,
  stock: entry.stock,
  sku: entry.sku,
  batteryHealth: entry.batteryHealth,
  conditionNote: [entry.conditionNote, entry.defects, entry.accessories]
    .filter(Boolean)
    .join('\n'),
  hasRealProductPhotos: entry.hasRealProductPhotos,
  images: entryImages(entry),
  variants: [
    {
      ...entry.details,
      color: entry.color,
      storage: entry.storage,
      price: entry.price,
      stock: entry.stock,
      sku: entry.sku,
      images: entryImages(entry),
      isDefault: true,
    },
  ],
});
export const entryReadiness = (document: PhoneDocument, entry: PhoneEntry) =>
  evaluateProductChannelReadiness(
    entryPayload(document, entry) as ProductChannelFacts,
  );
export const entryProblems = (
  document: PhoneDocument,
  entry: PhoneEntry,
  locale: 'de' | 'en' = 'en',
): { step: number; field: string; message: string }[] => {
  const de = locale === 'de';
  const problems: { step: number; field: string; message: string }[] = [];
  const add = (step: number, field: string, en: string, german: string) =>
    problems.push({ step, field, message: de ? german : en });
  if (
    !document.shared.brand?.trim() ||
    !document.shared.model?.trim() ||
    !document.shared.title?.trim()
  )
    add(
      0,
      'model',
      'Add brand, model and title.',
      'Marke, Modell und Titel ergänzen.',
    );
  if (!entry.color.trim() || !entry.storage.trim())
    add(1, 'color', 'Add color and storage.', 'Farbe und Speicher ergänzen.');
  if (!(Number.isFinite(entry.price) && entry.price > 0))
    add(
      2,
      'price',
      'Set a price greater than zero.',
      'Preis größer als null eintragen.',
    );
  if (
    !Number.isInteger(entry.stock) ||
    entry.stock < 0 ||
    (!entry.sourceProductId &&
      entry.condition !== 'new' &&
      entry.stock !== 1) ||
    (entry.condition !== 'new' &&
      entry.stock > 1 &&
      (entry.details.condition === 'new' ||
        Number(entry.details.stock ?? 1) <= 1))
  )
    add(
      2,
      'stock',
      'Check stock; each non-new device starts at one.',
      'Bestand prüfen; jedes nicht neue Gerät startet mit eins.',
    );
  if (!entry.sku.trim())
    add(2, 'sku', 'Add a unique SKU.', 'Eindeutige SKU ergänzen.');
  if (
    entry.photos.length !== 4 ||
    entry.photos.some((p) => !p.url) ||
    new Set(entryImages(entry)).size !== 4
  )
    add(
      3,
      'photos',
      'Upload four distinct photos.',
      'Vier unterschiedliche Fotos hochladen.',
    );
  const conditionError = validateAdminProductCondition({
    ...document.shared,
    title: document.shared.title ?? '',
    brand: document.shared.brand ?? '',
    model: document.shared.model ?? '',
    condition: entry.condition,
    conditionNote: entry.conditionNote,
    hasRealProductPhotos: entry.hasRealProductPhotos,
    imageCount: entryImages(entry).length,
    batteryHealth:
      entry.batteryHealth == null ? '' : String(entry.batteryHealth),
    locale,
  });
  if (conditionError)
    problems.push({ step: 2, field: 'conditionNote', message: conditionError });
  if (!document.shared.description?.trim())
    add(
      4,
      'description',
      'Add a product description.',
      'Produktbeschreibung ergänzen.',
    );
  return problems;
};
export const copyNewPhonePhotos = (
  from: PhoneEntry,
  to: PhoneEntry,
): PhoneEntry => {
  if (
    from.condition !== 'new' ||
    to.condition !== 'new' ||
    from.color.trim().toLowerCase() !== to.color.trim().toLowerCase()
  )
    throw new Error('photo_copy_not_allowed');
  return {
    ...to,
    photos: to.photos.map((p, i) => ({ ...p, url: from.photos[i].url })),
    coverId:
      to.photos[from.photos.findIndex((p) => p.id === from.coverId)]?.id ??
      to.photos[0].id,
  };
};
export const validateDocument = (value: unknown): PhoneDocument => {
  if (
    !value ||
    typeof value !== 'object' ||
    JSON.stringify(value).length > 500_000
  )
    throw new Error('invalid_document');
  const doc = value as PhoneDocument;
  if (
    !Number.isInteger(doc.step) ||
    doc.step < 0 ||
    doc.step > 6 ||
    !doc.shared ||
    typeof doc.shared !== 'object' ||
    !Array.isArray(doc.entries) ||
    !doc.entries.length ||
    doc.entries.length > 100
  )
    throw new Error('invalid_document');
  const ids = new Set<string>();
  for (const e of doc.entries) {
    if (
      !e ||
      typeof e.id !== 'string' ||
      !/^[0-9a-f-]{36}$/i.test(e.id) ||
      ids.has(e.id)
    )
      throw new Error('invalid_entry');
    ids.add(e.id);
    if (
      typeof e.hasRealProductPhotos !== 'boolean' ||
      !Number.isFinite(e.price) ||
      !Number.isFinite(e.stock) ||
      (e.batteryHealth !== null && !Number.isFinite(e.batteryHealth)) ||
      !['new', 'used', 'open_box'].includes(e.condition) ||
      ![
        'color',
        'storage',
        'sku',
        'conditionNote',
        'defects',
        'accessories',
        'coverId',
      ].every((k) => typeof e[k as keyof PhoneEntry] === 'string') ||
      typeof e.details !== 'object' ||
      !e.details
    )
      throw new Error('invalid_entry');
    if (
      !Array.isArray(e.channels) ||
      e.channels.some((c) => !channels.includes(c)) ||
      !Array.isArray(e.photos) ||
      e.photos.length !== 4 ||
      new Set(e.photos.map((p) => p.id)).size !== 4 ||
      e.photos.some(
        (p) =>
          typeof p.id !== 'string' ||
          typeof p.url !== 'string' ||
          p.url.length > 1000,
      ) ||
      !e.photos.some((p) => p.id === e.coverId)
    )
      throw new Error('invalid_photos');
  }
  return doc;
};
