import { del, put } from "@vercel/blob";

const getBlobToken = (): string => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }
  return token;
};

const sanitizeFileName = (fileName: string): string => {
  const normalized = fileName.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
  return normalized.replace(/-+/g, "-");
};

export const uploadProductImage = async (file: File): Promise<string> => {
  const safeFileName = sanitizeFileName(file.name || "product-image");
  const pathName = `products/${Date.now()}-${safeFileName}`;

  const blob = await put(pathName, file, {
    access: "public",
    token: getBlobToken(),
  });

  return blob.url;
};

export const deleteBlobByUrl = async (url: string): Promise<void> => {
  await del(url, { token: getBlobToken() });
};
