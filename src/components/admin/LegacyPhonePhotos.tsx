'use client';
import PhonePhotoSlots from './PhonePhotoSlots';
/** Legacy arrays retain their original product/variant ownership and are never split. */
export default function LegacyPhonePhotos({
  images,
  onChange,
  locale,
  onBusy,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  locale: 'de' | 'en';
  onBusy: (busy: boolean) => void;
}) {
  const slots = Array.from({ length: 4 }, (_, i) => ({
    id: String(i),
    url: images[i] ?? '',
  }));
  return (
    <PhonePhotoSlots
      locale={locale}
      slots={slots}
      coverId="0"
      onBusy={onBusy}
      onChange={(next, cover) => {
        const ordered = [...next].sort(
          (a, b) => Number(b.id === cover) - Number(a.id === cover),
        );
        onChange(ordered.map((p) => p.url));
      }}
    />
  );
}
