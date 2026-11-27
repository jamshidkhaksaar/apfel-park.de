import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { decodeBarcodeFromBuffer } from '@/lib/product-scan-sale';
import {
  authorizeTelegramTransport,
  readBoundedBody,
  telegramError,
} from '@/lib/telegram-products/http';
import { tr } from '@/lib/telegram-products/model';
import { ingestPhoto, prepareTelegramPhoto, readAssetPreview } from '@/lib/telegram-products/photos';
import {
  handleBotAction,
  validateBotRequest,
  verifyTelegramMemberAction,
} from '@/lib/telegram-products/repository';

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const raw = await readBoundedBody(request, 12_100_000);
    authorizeTelegramTransport(request, raw);
    const payload = JSON.parse(raw),
      body = validateBotRequest(payload);
    if (body.action === 'scan_photo') {
      if (
        typeof payload.data !== 'string' ||
        payload.data.length > 12_000_000 ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(payload.data)
      ) {
        throw new Error('photo_invalid');
      }
      const bytes = Buffer.from(payload.data, 'base64');
      if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw new Error('photo_invalid');
      const meta = await sharp(bytes, { limitInputPixels: 25_000_000 }).metadata();
      if (!['jpeg', 'png', 'webp'].includes(meta.format ?? '')) throw new Error('photo_invalid');

      const { locale } = await verifyTelegramMemberAction(body, true);
      let decoded = await decodeBarcodeFromBuffer(bytes);
      if (!decoded) {
        try {
          const prepared = await prepareTelegramPhoto(bytes, 'barcode_label');
          const candidates = Array.isArray(prepared.hints.gtinCandidates)
            ? (prepared.hints.gtinCandidates as Array<{ value?: unknown; checksumValid?: unknown }>)
            : [];
          const hit = candidates.find((c) => c?.checksumValid === true && typeof c.value === 'string')
            ?? candidates.find((c) => typeof c?.value === 'string');
          if (hit && typeof hit.value === 'string') decoded = hit.value;
        } catch {
          // Vision fallback is best-effort for barcode scanning.
        }
      }
      if (!decoded) {
        return NextResponse.json(
          {
            scanMode: true,
            revision: 1,
            text: tr(
              locale,
              '❌ Kein Barcode auf dem Foto erkannt. Bitte näher fotografieren oder SKU/EAN eintippen.',
              '❌ Could not read a barcode from the photo. Send a sharper close-up or type the SKU/EAN.',
            ),
            buttons: [[{ text: tr(locale, '🏠 Hauptmenü', '🏠 Main menu'), action: 'menu' }]],
          },
          { headers: { 'Cache-Control': 'private, no-store' } },
        );
      }
      return NextResponse.json(
        await handleBotAction({
          telegramId: body.telegramId,
          chatId: body.chatId,
          action: 'scan_lookup',
          text: decoded,
        }),
        { headers: { 'Cache-Control': 'private, no-store' } },
      );
    }

    if (!body.sessionId) throw new Error('invalid_input');
    // The status lookup independently checks membership and session ownership.
    await handleBotAction({ ...body, action: 'status' });
    if (body.action === 'preview') {
      if (!/^[a-f0-9-]{36}$/i.test(payload.assetId ?? ''))
        throw new Error('invalid_input');
      const image = await readAssetPreview(
        body.sessionId,
        payload.assetId,
        payload.edited === true,
      );
      return NextResponse.json(
        { data: image.toString('base64') },
        { headers: { 'Cache-Control': 'private, no-store' } },
      );
    }
    if (
      body.action !== 'upload' ||
      body.revision === undefined ||
      body.updateId === undefined
    )
      throw new Error('invalid_input');
    await ingestPhoto({
      ...body,
      sessionId: body.sessionId,
      revision: body.revision,
      updateId: body.updateId,
      data: payload.data,
    });
    return NextResponse.json(
      await handleBotAction({ ...body, action: 'status' }),
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return telegramError(error);
  }
};
