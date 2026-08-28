"use client";

import { BarcodeFormat, BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { addPhone, createSeller, removePhone, savePhone, savePhoneStatus, saveSeller } from "@/app/admin/batch-buy/actions";
import type { AdminDictionary, AdminLocale } from "@/lib/admin-i18n";
import {
  batchPhoneStatuses,
  normalizeImei,
  type BatchPhone,
  type BatchPhoneStatus,
  type BatchSeller,
} from "@/lib/batch-buy-shared";
import type { RepairCatalog } from "@/lib/repair-catalog";

type Props = {
  locale: AdminLocale;
  pageText: AdminDictionary["batchBuyPage"];
  sellers: BatchSeller[];
  phones: BatchPhone[];
  catalog: RepairCatalog;
  selectedSellerId: string | null;
  saved: string | null;
  error: string | null;
};

type ModelOption = {
  label: string;
  brandId: string;
  familyId: string;
  modelId: string;
  searchText: string;
};

type ScannerControls = {
  stop: () => void;
};

type CameraRange = {
  min: number;
  max: number;
  step?: number;
};

type AdjustableTrackCapabilities = MediaTrackCapabilities & {
  brightness?: CameraRange;
  contrast?: CameraRange;
  exposureCompensation?: CameraRange;
  exposureMode?: string[];
  focusMode?: string[];
  torch?: boolean;
  whiteBalanceMode?: string[];
};

type AdjustableTrackConstraintSet = MediaTrackConstraintSet & {
  brightness?: number;
  contrast?: number;
  exposureCompensation?: number;
  exposureMode?: string;
  focusMode?: string;
  torch?: boolean;
  whiteBalanceMode?: string;
};

type FrameVariant = {
  cropScale: number;
  filter: string;
  mirrored: boolean;
  rotateDegrees?: number;
  threshold: boolean;
};

const inputClassName =
  "w-full rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40";

const labelClassName = "text-[11px] font-semibold uppercase tracking-[0.16em] text-muted";

const panelClassName = "glass-panel rounded-2xl border border-border/60 bg-surface/30";

const pageSizes = [20, 50, 100] as const;

const formatDate = (value: string | null, locale: AdminLocale): string => {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
};

const today = (): string => new Date().toISOString().slice(0, 10);

const getStatusClassName = (status: BatchPhoneStatus): string => {
  if (status === "sold") return "border-green-500/30 bg-green-500/10 text-green-300";
  if (status === "listed") return "border-gold/30 bg-gold/10 text-gold";
  if (status === "returned" || status === "scrapped") return "border-red-500/30 bg-red-500/10 text-red-300";
  return "border-border bg-surface-strong text-muted";
};

const statusLabel = (status: BatchPhoneStatus, text: AdminDictionary["batchBuyPage"]): string =>
  text.status[status] ?? status;

const getSellerInitials = (name: string): string => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "BB";
};

const rearCameraLabelPattern = /back|rear|environment|ruck|hinten|posteri|tras|arriere/i;

const selectPreferredCameraId = (devices: MediaDeviceInfo[]): string | undefined => {
  const usableDevices = devices.filter((device) => device.deviceId && device.deviceId !== "default" && device.deviceId !== "communications");
  const rearDevice = usableDevices.find((device) => rearCameraLabelPattern.test(device.label));

  if (rearDevice) return rearDevice.deviceId;
  if (usableDevices.length > 1) return usableDevices[usableDevices.length - 1]?.deviceId;
  return usableDevices[0]?.deviceId;
};

const scannerFrameVariants: FrameVariant[] = [
  { cropScale: 1, filter: "none", mirrored: false, threshold: false },
  { cropScale: 1, filter: "none", mirrored: true, threshold: false },
  { cropScale: 0.78, filter: "brightness(0.68) contrast(2.35) grayscale(1)", mirrored: false, threshold: false },
  { cropScale: 0.78, filter: "brightness(0.68) contrast(2.35) grayscale(1)", mirrored: true, threshold: false },
  { cropScale: 0.72, filter: "grayscale(1) contrast(2)", mirrored: false, threshold: true },
  { cropScale: 0.72, filter: "grayscale(1) contrast(2)", mirrored: true, threshold: true },
  { cropScale: 0.82, filter: "invert(1) grayscale(1) contrast(2.2)", mirrored: false, threshold: false },
  { cropScale: 0.82, filter: "invert(1) grayscale(1) contrast(2.2)", mirrored: true, threshold: false },
];

const captureFrameVariants: FrameVariant[] = [
  ...scannerFrameVariants,
  { cropScale: 0.92, filter: "brightness(0.58) contrast(2.8) grayscale(1)", mirrored: false, threshold: false },
  { cropScale: 0.92, filter: "brightness(0.58) contrast(2.8) grayscale(1)", mirrored: true, threshold: false },
  { cropScale: 0.86, filter: "brightness(0.52) contrast(3) grayscale(1)", mirrored: false, rotateDegrees: -3, threshold: false },
  { cropScale: 0.86, filter: "brightness(0.52) contrast(3) grayscale(1)", mirrored: false, rotateDegrees: 3, threshold: false },
  { cropScale: 0.86, filter: "brightness(0.52) contrast(3) grayscale(1)", mirrored: true, rotateDegrees: -3, threshold: false },
  { cropScale: 0.86, filter: "brightness(0.52) contrast(3) grayscale(1)", mirrored: true, rotateDegrees: 3, threshold: false },
  { cropScale: 0.68, filter: "grayscale(1) contrast(2.7)", mirrored: false, rotateDegrees: -4, threshold: true },
  { cropScale: 0.68, filter: "grayscale(1) contrast(2.7)", mirrored: false, rotateDegrees: 4, threshold: true },
  { cropScale: 0.68, filter: "grayscale(1) contrast(2.7)", mirrored: true, rotateDegrees: -4, threshold: true },
  { cropScale: 0.68, filter: "grayscale(1) contrast(2.7)", mirrored: true, rotateDegrees: 4, threshold: true },
  { cropScale: 0.6, filter: "brightness(0.72) contrast(3.2) grayscale(1)", mirrored: false, threshold: true },
  { cropScale: 0.6, filter: "brightness(0.72) contrast(3.2) grayscale(1)", mirrored: true, threshold: true },
];

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const scannerReaderOptions = {
  delayBetweenScanAttempts: 120,
  delayBetweenScanSuccess: 400,
  tryPlayVideoTimeout: 5000,
};

const createScannerHints = (): Map<DecodeHintType, unknown> => {
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.TRY_HARDER, true);
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93,
    BarcodeFormat.ITF,
    BarcodeFormat.CODABAR,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.QR_CODE,
    BarcodeFormat.DATA_MATRIX,
    BarcodeFormat.PDF_417,
  ]);

  return hints;
};

const rangeValue = (range: CameraRange, ratio: number): number => {
  const rawValue = range.min + (range.max - range.min) * ratio;
  const steppedValue =
    typeof range.step === "number" && range.step > 0
      ? Math.round(rawValue / range.step) * range.step
      : rawValue;

  return Number(clamp(steppedValue, range.min, range.max).toFixed(4));
};

const cameraVideoConstraints = (deviceId?: string): MediaTrackConstraints => ({
  ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: "environment" } }),
  aspectRatio: { ideal: 16 / 9 },
  frameRate: { ideal: 30 },
  height: { ideal: 1080 },
  width: { ideal: 1920 },
});

const getCameraStream = async (preferredCameraId?: string): Promise<MediaStream> => {
  const attempts: MediaStreamConstraints[] = [
    ...(preferredCameraId ? [{ video: cameraVideoConstraints(preferredCameraId), audio: false }] : []),
    { video: cameraVideoConstraints(), audio: false },
    { video: { facingMode: { ideal: "environment" } }, audio: false },
    { video: true, audio: false },
  ];
  let lastError: unknown;

  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

const applyCameraConstraint = async (track: MediaStreamTrack, constraint: AdjustableTrackConstraintSet): Promise<void> => {
  try {
    await track.applyConstraints({ advanced: [constraint] } as MediaTrackConstraints);
  } catch {
    // Some browsers expose a capability but reject the matching constraint.
  }
};

const tuneCameraForPhoneScreen = async (stream: MediaStream): Promise<void> => {
  const track = stream.getVideoTracks()[0];
  if (!track?.getCapabilities || !track.applyConstraints) return;

  const capabilities = track.getCapabilities() as AdjustableTrackCapabilities;
  const constraints: AdjustableTrackConstraintSet[] = [];

  if (capabilities.focusMode?.includes("continuous")) constraints.push({ focusMode: "continuous" });
  if (capabilities.exposureMode?.includes("continuous")) constraints.push({ exposureMode: "continuous" });
  if (capabilities.whiteBalanceMode?.includes("continuous")) constraints.push({ whiteBalanceMode: "continuous" });
  if (capabilities.exposureCompensation) constraints.push({ exposureCompensation: rangeValue(capabilities.exposureCompensation, 0.28) });
  if (capabilities.brightness) constraints.push({ brightness: rangeValue(capabilities.brightness, 0.42) });
  if (capabilities.contrast) constraints.push({ contrast: rangeValue(capabilities.contrast, 0.78) });
  if (capabilities.torch) constraints.push({ torch: false });

  for (const constraint of constraints) {
    await applyCameraConstraint(track, constraint);
  }
};

const attachStreamToVideo = async (video: HTMLVideoElement, stream: MediaStream): Promise<void> => {
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play();
};

const applyThreshold = (context: CanvasRenderingContext2D, width: number, height: number): void => {
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  let luminanceTotal = 0;
  const pixelCount = data.length / 4;

  for (let index = 0; index < data.length; index += 4) {
    luminanceTotal += data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722;
  }

  const threshold = clamp((luminanceTotal / pixelCount) * 0.92, 80, 210);

  for (let index = 0; index < data.length; index += 4) {
    const luminance = data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722;
    const value = luminance > threshold ? 255 : 0;
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
    data[index + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
};

const drawImageVariant = (
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  variant: FrameVariant,
  targetMaxWidth = 1400,
): void => {
  const cropWidth = Math.round(sourceWidth * variant.cropScale);
  const cropHeight = Math.round(sourceHeight * variant.cropScale);
  const sourceX = Math.round((sourceWidth - cropWidth) / 2);
  const sourceY = Math.round((sourceHeight - cropHeight) / 2);
  const targetWidth = Math.min(targetMaxWidth, cropWidth);
  const targetHeight = Math.round((cropHeight / cropWidth) * targetWidth);

  if (canvas.width !== targetWidth) canvas.width = targetWidth;
  if (canvas.height !== targetHeight) canvas.height = targetHeight;

  context.save();
  context.filter = variant.filter;
  context.clearRect(0, 0, targetWidth, targetHeight);
  context.translate(targetWidth / 2, targetHeight / 2);

  if (variant.mirrored) {
    context.scale(-1, 1);
  }

  if (variant.rotateDegrees) {
    context.rotate((variant.rotateDegrees * Math.PI) / 180);
  }

  context.drawImage(source, sourceX, sourceY, cropWidth, cropHeight, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
  context.restore();
  context.filter = "none";

  if (variant.threshold) {
    applyThreshold(context, targetWidth, targetHeight);
  }
};

const drawFrameVariant = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  variant: FrameVariant,
): void => {
  drawImageVariant(video, video.videoWidth, video.videoHeight, canvas, context, variant);
};

const decodeCanvasImei = (reader: BrowserMultiFormatReader, canvas: HTMLCanvasElement): string | null => {
  try {
    const result = reader.decodeFromCanvas(canvas);
    return normalizeImei(result.getText()) || null;
  } catch {
    return null;
  }
};

const scanSourceForImei = (
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  variants: FrameVariant[],
  targetMaxWidth: number,
): string | null => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) return null;

  const readers = variants.map(() => new BrowserMultiFormatReader(createScannerHints(), scannerReaderOptions));

  try {
    for (let index = 0; index < variants.length; index += 1) {
      drawImageVariant(source, sourceWidth, sourceHeight, canvas, context, variants[index], targetMaxWidth);

      const imei = decodeCanvasImei(readers[index], canvas);
      if (imei) return imei;
    }

    return null;
  } finally {
    // Keep captures in memory only and release the canvas immediately after decoding.
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
  }
};

const waitForFreshVideoFrame = (video: HTMLVideoElement): Promise<void> =>
  new Promise((resolve) => {
    const frameVideo = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (callback: () => void) => number;
    };

    if (typeof frameVideo.requestVideoFrameCallback === "function") {
      frameVideo.requestVideoFrameCallback(() => resolve());
      return;
    }

    window.requestAnimationFrame(() => resolve());
  });

const capturePhotoBitmap = async (stream: MediaStream): Promise<ImageBitmap | null> => {
  const track = stream.getVideoTracks()[0];
  if (!track || typeof ImageCapture === "undefined" || typeof createImageBitmap === "undefined") return null;

  try {
    const capture = new ImageCapture(track);
    const photoBlob = await capture.takePhoto();
    return await createImageBitmap(photoBlob);
  } catch {
    return null;
  }
};

const messageText = (saved: string | null, error: string | null, text: AdminDictionary["batchBuyPage"]): string | null => {
  if (error === "auth") return text.messages.authError;
  if (error === "seller") return text.messages.sellerError;
  if (error === "phone") return text.messages.phoneError;
  if (error === "imei") return text.messages.imeiDuplicate;
  if (error === "status") return text.messages.statusError;
  if (saved === "seller") return text.messages.sellerSaved;
  if (saved === "phone") return text.messages.phoneSaved;
  if (saved === "status") return text.messages.statusSaved;
  if (saved === "phone-update") return text.messages.phoneUpdated;
  if (saved === "phone-delete") return text.messages.phoneDeleted;
  return null;
};

export default function AdminBatchBuyWorkspace({
  locale,
  pageText,
  sellers,
  phones,
  catalog,
  selectedSellerId,
  saved,
  error,
}: Props) {
  const [sellerSearch, setSellerSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [phoneStatusFilter, setPhoneStatusFilter] = useState<"all" | BatchPhoneStatus>("all");
  const [phonePageSize, setPhonePageSize] = useState<(typeof pageSizes)[number]>(20);
  const [phonePage, setPhonePage] = useState(1);
  const [activeSellerId, setActiveSellerId] = useState<string | null>(selectedSellerId ?? sellers[0]?.id ?? null);
  const [modelInput, setModelInput] = useState("");
  const [imeiInput, setImeiInput] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [sellerDetailsOpen, setSellerDetailsOpen] = useState(false);
  const [sellersPanelOpen, setSellersPanelOpen] = useState(true);
  const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null);

  const selectedSeller =
    sellers.find((seller) => seller.id === activeSellerId) ?? sellers[0] ?? null;

  const modelOptions = useMemo<ModelOption[]>(() => {
    return catalog.brands.flatMap((brand) =>
      brand.families.flatMap((family) =>
        family.models.map((model) => ({
          label: `${brand.name} ${model.name}`,
          brandId: brand.id,
          familyId: family.id,
          modelId: model.id,
          searchText: `${brand.name} ${family.name} ${model.name}`.toLowerCase(),
        })),
      ),
    );
  }, [catalog]);

  const selectedModel = useMemo(() => {
    const normalized = modelInput.trim().toLowerCase();
    if (!normalized) return null;
    return modelOptions.find((option) => option.label.toLowerCase() === normalized) ?? null;
  }, [modelInput, modelOptions]);

  const filteredSellers = useMemo(() => {
    const needle = sellerSearch.trim().toLowerCase();
    if (!needle) return sellers;
    return sellers.filter((seller) =>
      [seller.fullName, seller.phone ?? "", seller.email ?? "", seller.notes ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [sellerSearch, sellers]);

  const selectedSellerPhones = useMemo(() => {
    if (!selectedSeller) return [];
    return phones.filter((phone) => phone.sellerId === selectedSeller.id);
  }, [phones, selectedSeller]);

  const recentSellerPhones = useMemo(() => {
    return [...selectedSellerPhones]
      .sort((left, right) => {
        const purchaseDiff = new Date(right.purchaseDate).getTime() - new Date(left.purchaseDate).getTime();
        if (purchaseDiff !== 0) return purchaseDiff;
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      })
      .slice(0, 3);
  }, [selectedSellerPhones]);

  const selectedSellerLastPurchase = recentSellerPhones[0]?.purchaseDate ?? selectedSeller?.lastPurchaseAt ?? null;

  const filteredPhones = useMemo(() => {
    const needle = phoneSearch.trim().toLowerCase();
    return phones.filter((phone) => {
      const matchesStatus = phoneStatusFilter === "all" || phone.status === phoneStatusFilter;
      const matchesSearch =
        !needle ||
        [phone.phoneModel, phone.imei, phone.sellerName, phone.notes ?? "", phone.status]
          .join(" ")
          .toLowerCase()
          .includes(needle);

      return matchesStatus && matchesSearch;
    });
  }, [phoneSearch, phoneStatusFilter, phones]);

  const phonePageCount = Math.max(1, Math.ceil(filteredPhones.length / phonePageSize));
  const activePhonePage = Math.min(phonePage, phonePageCount);
  const visiblePhones = useMemo(() => {
    const start = (activePhonePage - 1) * phonePageSize;
    return filteredPhones.slice(start, start + phonePageSize);
  }, [activePhonePage, filteredPhones, phonePageSize]);

  const message = messageText(saved, error, pageText);
  const isErrorMessage = Boolean(error);
  const normalizedImei = normalizeImei(imeiInput);
  const imeiWarning =
    normalizedImei && (normalizedImei.length < 14 || normalizedImei.length > 17)
      ? pageText.form.imeiWarning
      : null;

  const selectSeller = (sellerId: string): void => {
    setActiveSellerId(sellerId);
    setSellerDetailsOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{pageText.eyebrow}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{pageText.heading}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">{pageText.intro}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:min-w-72">
          <div className="rounded-xl border border-border/60 bg-background/50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{pageText.stats.sellers}</p>
            <p className="text-xl font-bold text-foreground">{sellers.length}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{pageText.stats.phones}</p>
            <p className="text-xl font-bold text-gold">{phones.length}</p>
          </div>
        </div>
      </div>

      {message ? (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            isErrorMessage
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-green-500/30 bg-green-500/10 text-green-300"
          }`}
        >
          {message}
        </div>
      ) : null}

      {sellers.length > 0 ? (
        <section className={`${panelClassName} p-3 xl:hidden`}>
          <div className="flex items-end gap-2">
            <label className="min-w-0 flex-1 space-y-2">
              <span className={labelClassName}>{pageText.detail.chooseSeller}</span>
              <select
                value={selectedSeller?.id ?? ""}
                onChange={(event) => selectSeller(event.target.value)}
                className={inputClassName}
              >
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.fullName} - {seller.phoneCount} {pageText.detail.phones}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setSellersPanelOpen((value) => !value)}
              aria-expanded={sellersPanelOpen}
              className="shrink-0 rounded-xl border border-border/70 px-3 py-2 text-xs font-semibold text-muted transition hover:border-gold/40 hover:text-gold"
            >
              {sellersPanelOpen ? pageText.sellers.hidePanel : pageText.sellers.showPanel}
            </button>
          </div>
        </section>
      ) : null}

      <div className={`gap-4 ${sellersPanelOpen ? 'grid xl:grid-cols-[320px_minmax(0,1fr)]' : 'block'}`}>
        {sellersPanelOpen ? <aside className={`${panelClassName} flex min-h-[64vh] flex-col p-4 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)]`}>
          <div className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{pageText.sellers.title}</h2>
                <p className="mt-0.5 text-xs text-muted">{pageText.sellers.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setSellersPanelOpen(false)}
                className="hidden shrink-0 rounded-lg border border-border/70 px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:border-gold/40 hover:text-gold xl:inline-flex"
              >
                {pageText.sellers.hidePanel}
              </button>
            </div>
            <input
              type="search"
              value={sellerSearch}
              onChange={(event) => setSellerSearch(event.target.value)}
              placeholder={pageText.sellers.searchPlaceholder}
              className={`${inputClassName} mt-3`}
            />
          </div>

          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto py-3 pr-1">
            {filteredSellers.length > 0 ? (
              filteredSellers.map((seller) => {
                const active = selectedSeller?.id === seller.id;
                return (
                  <button
                    key={seller.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectSeller(seller.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      active
                        ? "border-gold/50 bg-gold/10 text-foreground"
                        : "border-border/60 bg-background/35 text-muted hover:border-gold/25 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-foreground">{seller.fullName}</p>
                        <p className="mt-1 break-words text-xs">{seller.phone || seller.email || pageText.sellers.noContact}</p>
                      </div>
                      <span className="rounded-full border border-border/60 bg-background/50 px-2 py-0.5 text-[10px] font-semibold text-muted">
                        {seller.phoneCount}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted/70">
                      {seller.lastPurchaseAt
                        ? `${pageText.sellers.lastPurchase}: ${formatDate(seller.lastPurchaseAt, locale)}`
                        : pageText.sellers.noPurchases}
                    </p>
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 p-5 text-sm text-muted">
                {pageText.sellers.empty}
              </div>
            )}
          </div>

          <form action={createSeller} className="border-t border-border/50 pt-4">
            <h3 className="text-sm font-semibold text-foreground">{pageText.sellers.newSeller}</h3>
            <div className="mt-3 space-y-2">
              <input name="fullName" required placeholder={pageText.form.fullName} className={inputClassName} />
              <input name="phone" placeholder={pageText.form.phone} className={inputClassName} />
              <input name="email" type="email" placeholder={pageText.form.email} className={inputClassName} />
              <textarea name="notes" placeholder={pageText.form.sellerNotes} className={`${inputClassName} min-h-20`} />
              <button type="submit" className="btn-primary w-full justify-center">
                <span>{pageText.sellers.create}</span>
              </button>
            </div>
          </form>
        </aside> : null}

        <main className="min-w-0 space-y-4">
          {!sellersPanelOpen ? (
            <button
              type="button"
              onClick={() => setSellersPanelOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-surface/30 px-3 py-2 text-xs font-semibold text-muted transition hover:border-gold/40 hover:text-gold"
            >
              {pageText.sellers.showPanel}
            </button>
          ) : null}
          {selectedSeller ? (
            <>
              <section className={`${panelClassName} overflow-hidden`}>
                <div className="border-b border-border/60 bg-gradient-to-r from-gold/10 via-surface/25 to-transparent p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/15 text-sm font-bold text-gold">
                        {getSellerInitials(selectedSeller.fullName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{pageText.detail.selectedSeller}</p>
                          <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold">
                            {selectedSellerPhones.length} {pageText.detail.phones}
                          </span>
                          <span className="rounded-full border border-border/60 bg-background/55 px-2 py-0.5 text-[10px] font-semibold text-muted">
                            {selectedSellerLastPurchase ? formatDate(selectedSellerLastPurchase, locale) : pageText.sellers.noPurchases}
                          </span>
                        </div>
                        <h2 className="mt-1 truncate text-xl font-semibold text-foreground">{selectedSeller.fullName}</h2>
                        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                          {selectedSeller.phone ? (
                            <a href={`tel:${selectedSeller.phone}`} className="rounded-full border border-border/60 bg-background/55 px-2.5 py-1 text-muted transition hover:border-gold/40 hover:text-gold">
                              {selectedSeller.phone}
                            </a>
                          ) : null}
                          {selectedSeller.email ? (
                            <a href={`mailto:${selectedSeller.email}`} className="rounded-full border border-border/60 bg-background/55 px-2.5 py-1 text-muted transition hover:border-gold/40 hover:text-gold">
                              {selectedSeller.email}
                            </a>
                          ) : null}
                          {!selectedSeller.phone && !selectedSeller.email ? (
                            <span className="rounded-full border border-border/60 bg-background/55 px-2.5 py-1 text-muted">
                              {pageText.sellers.noContact}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 lg:flex lg:shrink-0">
                      <a href="#batch-phone-register" className="rounded-full bg-gold px-3 py-2 text-center text-xs font-semibold text-black transition hover:bg-gold-soft">
                        <span>{pageText.detail.registerPhone}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => setScannerOpen(true)}
                        className="flex items-center justify-center gap-1.5 rounded-full border border-gold/35 px-3 py-2 text-xs font-semibold text-gold transition hover:border-gold/60 hover:bg-gold/10"
                      >
                        <ScanIcon />
                        <span>{pageText.detail.scanImei}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSellerDetailsOpen((value) => !value)}
                        className="rounded-full border border-border/70 px-3 py-2 text-xs font-semibold text-muted transition hover:border-gold/40 hover:text-gold"
                      >
                        {sellerDetailsOpen ? pageText.detail.hideEdit : pageText.detail.editSeller}
                      </button>
                    </div>
                  </div>
                </div>

                {sellerDetailsOpen ? (
                  <form key={selectedSeller.id} action={saveSeller} className="grid gap-3 p-4 md:grid-cols-2">
                    <input type="hidden" name="sellerId" value={selectedSeller.id} />
                    <label className="space-y-1.5">
                      <span className={labelClassName}>{pageText.form.fullName}</span>
                      <input name="fullName" required defaultValue={selectedSeller.fullName} className={inputClassName} />
                    </label>
                    <label className="space-y-1.5">
                      <span className={labelClassName}>{pageText.form.phone}</span>
                      <input name="phone" defaultValue={selectedSeller.phone ?? ""} className={inputClassName} />
                    </label>
                    <label className="space-y-1.5">
                      <span className={labelClassName}>{pageText.form.email}</span>
                      <input name="email" type="email" defaultValue={selectedSeller.email ?? ""} className={inputClassName} />
                    </label>
                    <label className="space-y-1.5 md:col-span-2">
                      <span className={labelClassName}>{pageText.form.sellerNotes}</span>
                      <textarea name="notes" defaultValue={selectedSeller.notes ?? ""} className={`${inputClassName} min-h-20`} />
                    </label>
                    <div className="md:col-span-2">
                      <button type="submit" className="btn-secondary">
                        <span>{pageText.detail.saveSeller}</span>
                      </button>
                    </div>
                  </form>
                ) : null}
              </section>

              <section id="batch-phone-register" className={`${panelClassName} scroll-mt-6 p-4`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{pageText.phones.registerTitle}</h3>
                    <p className="mt-0.5 text-xs text-muted">{pageText.phones.registerSubtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScannerOpen(true)}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-black transition hover:bg-gold-soft"
                  >
                    <ScanIcon />
                    <span>{pageText.scanner.open}</span>
                  </button>
                </div>

                <form action={addPhone} className="mt-4 grid gap-2 lg:grid-cols-6">
                  <input type="hidden" name="sellerId" value={selectedSeller.id} />
                  <input type="hidden" name="catalogBrandId" value={selectedModel?.brandId ?? ""} />
                  <input type="hidden" name="catalogFamilyId" value={selectedModel?.familyId ?? ""} />
                  <input type="hidden" name="catalogModelId" value={selectedModel?.modelId ?? ""} />
                  <label className="space-y-1.5 lg:col-span-2">
                    <span className={labelClassName}>{pageText.form.phoneModel}</span>
                    <input
                      name="phoneModel"
                      required
                      list="batch-phone-models"
                      value={modelInput}
                      onChange={(event) => setModelInput(event.target.value)}
                      placeholder={pageText.form.phoneModelPlaceholder}
                      className={inputClassName}
                    />
                    <datalist id="batch-phone-models">
                      {modelOptions.map((option) => (
                        <option key={`${option.brandId}-${option.familyId}-${option.modelId}`} value={option.label} />
                      ))}
                    </datalist>
                  </label>
                  <label className="space-y-1.5 lg:col-span-2">
                    <span className={labelClassName}>{pageText.form.imei}</span>
                    <input
                      name="imei"
                      required
                      inputMode="numeric"
                      value={imeiInput}
                      onChange={(event) => setImeiInput(event.target.value)}
                      placeholder={pageText.form.imeiPlaceholder}
                      className={inputClassName}
                    />
                    {imeiWarning ? <span className="text-[11px] text-amber-300">{imeiWarning}</span> : null}
                  </label>
                  <label className="space-y-1.5">
                    <span className={labelClassName}>{pageText.form.purchaseDate}</span>
                    <input name="purchaseDate" type="date" required defaultValue={today()} className={inputClassName} />
                  </label>
                  <label className="space-y-1.5">
                    <span className={labelClassName}>{pageText.form.status}</span>
                    <select name="status" defaultValue="bought" className={inputClassName}>
                      {batchPhoneStatuses.map((status) => (
                        <option key={status} value={status}>{statusLabel(status, pageText)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 lg:col-span-5">
                    <span className={labelClassName}>{pageText.form.phoneNotes}</span>
                    <input name="notes" placeholder={pageText.form.phoneNotesPlaceholder} className={inputClassName} />
                  </label>
                  <div className="flex items-end">
                    <button type="submit" className="btn-primary w-full justify-center">
                      <span>{pageText.phones.savePhone}</span>
                    </button>
                  </div>
                </form>
              </section>

              <section className={`${panelClassName} overflow-hidden`}>
                <div className="flex flex-col gap-3 border-b border-border/60 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{pageText.phones.historyTitle}</h3>
                    <p className="mt-0.5 text-xs text-muted">{pageText.phones.historySubtitle}</p>
                  </div>
                  <input
                    type="search"
                    value={phoneSearch}
                    onChange={(event) => {
                      setPhoneSearch(event.target.value);
                      setPhonePage(1);
                    }}
                    placeholder={pageText.phones.searchPlaceholder}
                    className={`${inputClassName} md:max-w-sm`}
                  />
                  <select
                    value={phoneStatusFilter}
                    onChange={(event) => {
                      const value = event.target.value;
                      setPhoneStatusFilter(value === "all" ? "all" : value as BatchPhoneStatus);
                      setPhonePage(1);
                    }}
                    aria-label={pageText.phones.statusFilter}
                    className={`${inputClassName} md:w-40`}
                  >
                    <option value="all">{pageText.phones.allStatuses}</option>
                    {batchPhoneStatuses.map((status) => (
                      <option key={status} value={status}>{statusLabel(status, pageText)}</option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border/60 text-sm">
                    <thead className="bg-background/40 text-left text-[11px] uppercase tracking-[0.16em] text-muted">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold">{pageText.table.model}</th>
                        <th className="px-4 py-2.5 font-semibold">{pageText.table.imei}</th>
                        <th className="px-4 py-2.5 font-semibold">{pageText.table.bought}</th>
                        <th className="px-4 py-2.5 font-semibold">{pageText.table.status}</th>
                        <th className="px-4 py-2.5 font-semibold">{pageText.table.notes}</th>
                        <th className="px-4 py-2.5 font-semibold">{pageText.table.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {visiblePhones.length > 0 ? (
                        visiblePhones.map((phone) => (
                          <Fragment key={phone.id}>
                            <tr className="align-top">
                              <td className="px-4 py-3">
                                <p className="font-semibold text-foreground">{phone.phoneModel}</p>
                                <p className="mt-1 text-xs text-muted">{phone.sellerName}</p>
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-muted">{phone.imei}</td>
                              <td className="px-4 py-3 text-muted">{formatDate(phone.purchaseDate, locale)}</td>
                              <td className="px-4 py-3">
                                <form action={savePhoneStatus} className="flex items-center gap-2">
                                  <input type="hidden" name="phoneId" value={phone.id} />
                                  <input type="hidden" name="sellerId" value={phone.sellerId} />
                                  <select
                                    name="status"
                                    defaultValue={phone.status}
                                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClassName(phone.status)}`}
                                  >
                                    {batchPhoneStatuses.map((status) => (
                                      <option key={status} value={status}>{statusLabel(status, pageText)}</option>
                                    ))}
                                  </select>
                                  <button type="submit" className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted transition hover:border-gold/40 hover:text-gold">
                                    {pageText.table.update}
                                  </button>
                                </form>
                              </td>
                              <td className="max-w-xs px-4 py-3 text-muted">{phone.notes || "-"}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingPhoneId((id) => (id === phone.id ? null : phone.id))}
                                    className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted transition hover:border-gold/40 hover:text-gold"
                                  >
                                    {editingPhoneId === phone.id ? pageText.table.cancel : pageText.table.edit}
                                  </button>
                                  <form
                                    action={removePhone}
                                    onSubmit={(event) => {
                                      if (!window.confirm(pageText.table.deleteConfirm)) event.preventDefault();
                                    }}
                                  >
                                    <input type="hidden" name="phoneId" value={phone.id} />
                                    <input type="hidden" name="sellerId" value={phone.sellerId} />
                                    <button type="submit" className="rounded-full border border-red-500/35 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/10">
                                      {pageText.table.delete}
                                    </button>
                                  </form>
                                </div>
                              </td>
                            </tr>
                            {editingPhoneId === phone.id ? (
                              <tr className="bg-gold/5">
                                <td colSpan={6} className="px-4 py-4">
                                  <form action={savePhone} className="grid gap-2 lg:grid-cols-6">
                                    <input type="hidden" name="phoneId" value={phone.id} />
                                    <input type="hidden" name="sellerId" value={phone.sellerId} />
                                    <label className="space-y-1 lg:col-span-2">
                                      <span className={labelClassName}>{pageText.form.phoneModel}</span>
                                      <input name="phoneModel" required defaultValue={phone.phoneModel} className={inputClassName} />
                                    </label>
                                    <label className="space-y-1 lg:col-span-2">
                                      <span className={labelClassName}>{pageText.form.imei}</span>
                                      <input name="imei" required inputMode="numeric" defaultValue={phone.imei} className={inputClassName} />
                                    </label>
                                    <label className="space-y-1">
                                      <span className={labelClassName}>{pageText.form.purchaseDate}</span>
                                      <input name="purchaseDate" type="date" required defaultValue={phone.purchaseDate} className={inputClassName} />
                                    </label>
                                    <label className="space-y-1">
                                      <span className={labelClassName}>{pageText.form.status}</span>
                                      <select name="status" defaultValue={phone.status} className={inputClassName}>
                                        {batchPhoneStatuses.map((status) => (
                                          <option key={status} value={status}>{statusLabel(status, pageText)}</option>
                                        ))}
                                      </select>
                                    </label>
                                    <label className="space-y-1 lg:col-span-5">
                                      <span className={labelClassName}>{pageText.form.phoneNotes}</span>
                                      <input name="notes" defaultValue={phone.notes ?? ""} className={inputClassName} />
                                    </label>
                                    <div className="flex items-end">
                                      <button type="submit" className="btn-primary w-full justify-center">
                                        <span>{pageText.table.save}</span>
                                      </button>
                                    </div>
                                  </form>
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-5 py-10 text-center text-muted">
                            {pageText.phones.empty}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {filteredPhones.length > 0 ? (
                  <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
                    <p>
                      {pageText.phones.showing} {(activePhonePage - 1) * phonePageSize + 1}-{Math.min(activePhonePage * phonePageSize, filteredPhones.length)} {pageText.phones.of} {filteredPhones.length}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2">
                        <span>{pageText.phones.rowsPerPage}</span>
                        <select
                          value={phonePageSize}
                          onChange={(event) => {
                            setPhonePageSize(Number(event.target.value) as (typeof pageSizes)[number]);
                            setPhonePage(1);
                          }}
                          className="rounded-lg border border-border/70 bg-background/70 px-2 py-1 text-xs text-foreground focus:border-gold/60 focus:outline-none"
                        >
                          {pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
                        </select>
                      </label>
                      <button
                        type="button"
                        disabled={activePhonePage === 1}
                        onClick={() => setPhonePage(activePhonePage - 1)}
                        className="rounded-lg border border-border/60 px-2.5 py-1 text-xs transition hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {pageText.phones.previous}
                      </button>
                      <span className="tabular-nums">{activePhonePage} / {phonePageCount}</span>
                      <button
                        type="button"
                        disabled={activePhonePage === phonePageCount}
                        onClick={() => setPhonePage(activePhonePage + 1)}
                        className="rounded-lg border border-border/60 px-2.5 py-1 text-xs transition hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {pageText.phones.next}
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>
            </>
          ) : (
            <section className={`${panelClassName} p-10 text-center`}>
              <h2 className="text-xl font-semibold text-foreground">{pageText.empty.title}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">{pageText.empty.description}</p>
            </section>
          )}
        </main>
      </div>

      {scannerOpen ? (
        <ImeiScannerModal
          text={pageText.scanner}
          onClose={() => setScannerOpen(false)}
          onDetected={(value) => {
            setImeiInput(value);
            setScannerOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function ImeiScannerModal({
  text,
  onClose,
  onDetected,
}: {
  text: AdminDictionary["batchBuyPage"]["scanner"];
  onClose: () => void;
  onDetected: (imei: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const captureBusyRef = useRef(false);
  const [manualValue, setManualValue] = useState("");
  const [flipPreview, setFlipPreview] = useState(false);
  const [state, setState] = useState<"starting" | "scanning" | "unsupported" | "denied" | "found">("starting");
  const [captureState, setCaptureState] = useState<"idle" | "capturing" | "failed">("idle");
  const [isPending, startTransition] = useTransition();

  const acceptDetectedValue = useCallback((value: string): boolean => {
    const imei = normalizeImei(value);
    if (!imei) return false;
    setState("found");
    setCaptureState("idle");
    onDetected(imei);
    return true;
  }, [onDetected]);

  const handleCaptureScan = useCallback(async () => {
    const video = videoRef.current;

    if (captureBusyRef.current || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
      setCaptureState("failed");
      return;
    }

    captureBusyRef.current = true;
    setCaptureState("capturing");

    let photoBitmap: ImageBitmap | null = null;

    try {
      const stream = activeStreamRef.current;

      if (stream) {
        await tuneCameraForPhoneScreen(stream);
        await new Promise((resolve) => window.setTimeout(resolve, 180));
      }

      await waitForFreshVideoFrame(video);
      await waitForFreshVideoFrame(video);

      if (stream) {
        photoBitmap = await capturePhotoBitmap(stream);
      }

      const detectedImei =
        photoBitmap
          ? scanSourceForImei(photoBitmap, photoBitmap.width, photoBitmap.height, captureFrameVariants, 2600)
          : null;
      const fallbackImei =
        detectedImei ?? scanSourceForImei(video, video.videoWidth, video.videoHeight, captureFrameVariants, 2200);

      if (fallbackImei && acceptDetectedValue(fallbackImei)) return;

      setCaptureState("failed");
    } finally {
      photoBitmap?.close();
      captureBusyRef.current = false;
    }
  }, [acceptDetectedValue]);

  useEffect(() => {
    let cancelled = false;
    let scanTimer: number | null = null;
    let activeStream: MediaStream | null = null;
    let decoding = false;

    const stop = () => {
      if (scanTimer !== null) {
        window.clearInterval(scanTimer);
        scanTimer = null;
      }
      controlsRef.current?.stop();
      controlsRef.current = null;
      activeStream?.getTracks().forEach((track) => track.stop());
      activeStream = null;
      activeStreamRef.current = null;
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState("unsupported");
        return;
      }

      try {
        const hints = createScannerHints();

        const processedReaders = scannerFrameVariants.map(
          () =>
            new BrowserMultiFormatReader(hints, scannerReaderOptions),
        );

        const callback = (result: { getText: () => string } | undefined) => {
          if (cancelled || !result) return;
          if (acceptDetectedValue(result.getText())) stop();
        };

        let preferredCameraId: string | undefined;

        try {
          preferredCameraId = selectPreferredCameraId(await BrowserMultiFormatReader.listVideoInputDevices());
        } catch {
          preferredCameraId = undefined;
        }

        const videoElement = videoRef.current;
        if (!videoElement) throw new Error("Scanner video element is not available.");

        activeStream = await getCameraStream(preferredCameraId);
        activeStreamRef.current = activeStream;
        const controls: ScannerControls = {
          stop: () => activeStream?.getTracks().forEach((track) => track.stop()),
        };

        if (cancelled) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        await tuneCameraForPhoneScreen(activeStream);
        await attachStreamToVideo(videoElement, activeStream);
        setState("scanning");

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (context) {
          scanTimer = window.setInterval(() => {
            const video = videoRef.current;
            if (cancelled || decoding || captureBusyRef.current || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

            const width = video.videoWidth;
            const height = video.videoHeight;
            if (!width || !height) return;

            decoding = true;

            try {
              for (let index = 0; index < scannerFrameVariants.length; index += 1) {
                drawFrameVariant(video, canvas, context, scannerFrameVariants[index]);

                try {
                  callback(processedReaders[index].decodeFromCanvas(canvas));
                  break;
                } catch {
                  // This processed frame did not contain a readable barcode.
                }
              }
            } finally {
              decoding = false;
            }
          }, 140);
        }
      } catch {
        stop();
        if (!cancelled) setState("denied");
      }
    };

    start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [acceptDetectedValue]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-border/70 bg-background p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-foreground">{text.title}</h3>
            <p className="mt-1 text-sm text-muted">{text.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted transition hover:border-gold/40 hover:text-gold"
            aria-label={text.close}
          >
            <span aria-hidden="true">x</span>
          </button>
        </div>

        <div className="relative mt-5 overflow-hidden rounded-2xl border border-gold/20 bg-black">
          <video
            ref={videoRef}
            className="aspect-video w-full object-cover transition-transform"
            muted
            playsInline
            style={{ transform: flipPreview ? "scaleX(-1)" : undefined }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[12%] top-1/2 h-24 -translate-y-1/2 rounded-2xl border border-gold/70 shadow-[0_0_0_999px_rgba(0,0,0,0.28)]"
          />
          <button
            type="button"
            onClick={() => setFlipPreview((value) => !value)}
            className="absolute bottom-3 right-3 rounded-full border border-border bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur transition hover:border-gold/60 hover:text-gold"
          >
            {text.flipPreview}
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-border/60 bg-surface/40 p-4 text-sm text-muted">
          {captureState === "capturing" ? text.captureScanning : null}
          {captureState === "failed" ? text.captureFailed : null}
          {captureState === "idle" && state === "starting" ? text.starting : null}
          {captureState === "idle" && state === "scanning" ? text.scanning : null}
          {captureState === "idle" && state === "unsupported" ? text.unsupported : null}
          {captureState === "idle" && state === "denied" ? text.denied : null}
          {captureState === "idle" && state === "found" ? text.found : null}
        </div>

        <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">{text.captureHint}</p>
            <button
              type="button"
              disabled={state !== "scanning" || captureState === "capturing"}
              onClick={handleCaptureScan}
              className="btn-primary justify-center whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{captureState === "capturing" ? text.captureScanning : text.captureScan}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={manualValue}
            onChange={(event) => setManualValue(event.target.value)}
            inputMode="numeric"
            placeholder={text.manualPlaceholder}
            className={inputClassName}
          />
          <button
            type="button"
            disabled={isPending || !normalizeImei(manualValue)}
            onClick={() => {
              const imei = normalizeImei(manualValue);
              if (!imei) return;
              startTransition(() => onDetected(imei));
            }}
            className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>{text.useManual}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ScanIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5V5.25a1.5 1.5 0 011.5-1.5H7.5m8.999 0h2.251a1.5 1.5 0 011.5 1.5V7.5M20.25 16.5v2.25a1.5 1.5 0 01-1.5 1.5H16.5m-9 0H5.25a1.5 1.5 0 01-1.5-1.5V16.5M4.5 12h15" />
    </svg>
  );
}
