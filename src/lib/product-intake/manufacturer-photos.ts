// Official-manufacturer photo fallback for the Safi wizard.
// Client-side only: fetch a small render, transcode to WebP via canvas, and
// return a local object URL. Uploads happen through the normal product upload
// route when the wizard saves, so no rights metadata is claimed here.

export async function fetchManufacturerPhoto(model: string, color: string): Promise<Blob | null> {
  try {
    const response = await fetch("/api/admin/products/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: `${model} ${color}` }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { research?: { gallery?: string[] } };
    const firstUrl = payload.research?.gallery?.[0];
    if (!firstUrl) return null;
    const imgRes = await fetch(firstUrl, { signal: AbortSignal.timeout(8000) });
    if (!imgRes.ok) return null;
    return await imgRes.blob();
  } catch {
    return null;
  }
}

// Canvas WebP transcode, 900px longest side, quality 82.
export async function toSmallWebP(blob: Blob): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const webp = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((result) => resolve(result), "image/webp", 0.82),
    );
    bitmap.close();
    return webp;
  } catch {
    return null;
  }
}

export async function manufacturerPhotoFile(model: string, color: string): Promise<File | null> {
  const blob = await fetchManufacturerPhoto(model, color);
  if (!blob) return null;
  const webp = await toSmallWebP(blob);
  if (!webp) return null;
  return new File([webp], `manufacturer-${Date.now()}.webp`, { type: "image/webp" });
}
