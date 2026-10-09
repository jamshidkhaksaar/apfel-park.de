import type { PhoneDocument, PhoneEntry, PhotoSlot } from './model';
import { photoMembershipChanged } from '@/lib/product-photo-confirmation';

const colorKey = (entry: PhoneEntry) => entry.color.trim().normalize('NFKC').toLocaleLowerCase();
export const sharesColorPhotos = (entry: PhoneEntry) => entry.condition === 'new' && !entry.individualPhotos;

export const setEntryPhotos = (doc: PhoneDocument, id: string, photos: PhotoSlot[], coverId: string): PhoneDocument => {
  const source = doc.entries.find(entry => entry.id === id)!;
  const evidenceChanged = source.condition !== 'new' && photoMembershipChanged(source.photos.map(p => p.url), photos.map(p => p.url));
  return {
    ...doc,
    entries: doc.entries.map(entry => {
      if (entry.id === id) return { ...entry, photos, coverId, ...(evidenceChanged ? { hasRealProductPhotos: false } : {}) };
      if (evidenceChanged && source.sourceProductId && source.variantIndex !== undefined && entry.sourceProductId === source.sourceProductId) return { ...entry, hasRealProductPhotos: false };
      if (!sharesColorPhotos(source) || !sharesColorPhotos(entry) || colorKey(entry) !== colorKey(source)) return entry;
      const copied = photos.map((photo, index) => ({ id: entry.photos[index]?.id ?? crypto.randomUUID(), url: photo.url }));
      return { ...entry, photos: copied, coverId: copied[photos.findIndex(photo => photo.id === coverId)]?.id ?? copied[0].id };
    }),
  };
};

/** Joining a color group reuses its gallery; a new color never inherits old-color photos. */
export const changeEntryColor = (doc: PhoneDocument, id: string, color: string): PhoneDocument => {
  const entry = doc.entries.find(item => item.id === id)!;
  if (!sharesColorPhotos(entry)) return { ...doc, entries: doc.entries.map(item => item.id === id ? { ...item, color } : item) };
  const donor = doc.entries.find(item => item.id !== id && sharesColorPhotos(item) && colorKey(item) === colorKey({ ...entry, color }));
  const photos = (donor?.photos ?? entry.photos).map(photo => ({ id: crypto.randomUUID(), url: donor ? photo.url : '' }));
  return { ...doc, entries: doc.entries.map(item => item.id === id ? { ...item, color, photos, coverId: photos[donor?.photos.findIndex(p => p.id === donor.coverId) ?? 0]?.id ?? photos[0].id } : item) };
};
