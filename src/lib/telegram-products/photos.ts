import { randomUUID, createHash } from 'node:crypto';
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { query, withTransaction, type TransactionClient } from '@/lib/db';
import { uploadProductImage } from '@/lib/blob';
import { resolveGeminiKey } from '@/lib/ai-provider-credentials';
import { findSensitiveDataIssues } from '@/lib/product-intake/redaction';
import { currentEntry, newPhotoSlot, photoGuide } from './model';
import { readSession, event, digest } from './repository';
import { studioPhotoPrompt } from './studio-prompt';

const privateRoot = (): string =>
  process.env.TELEGRAM_PRODUCT_PRIVATE_DIR ||
  '/srv/apfel-intake/private/telegram';
export const readPrivatePhoto = async (value: string): Promise<Buffer> => {
  const root = await realpath(/*turbopackIgnore: true*/ privateRoot()),
    resolved = await realpath(/*turbopackIgnore: true*/ value);
  if (!resolved.startsWith(`${root}${path.sep}`))
    throw new Error('invalid_asset_path');
  return readFile(/*turbopackIgnore: true*/ resolved);
};
export const writePrivatePhoto = async (
  bytes: Buffer,
  suffix = 'webp',
): Promise<string> => {
  await mkdir(/*turbopackIgnore: true*/ privateRoot(), {
    recursive: true,
    mode: 0o750,
  });
  const file = path.join(
    /*turbopackIgnore: true*/ privateRoot(),
    `${randomUUID()}.${suffix}`,
  );
  await writeFile(/*turbopackIgnore: true*/ file, bytes, {
    mode: 0o600,
    flag: 'wx',
  });
  return file;
};
export const ingestPhoto = async (body: {
  telegramId: string;
  sessionId: string;
  revision: number;
  updateId: number;
  data: string;
}): Promise<void> => {
  if (
    typeof body.data !== 'string' ||
    body.data.length > 12_000_000 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(body.data)
  )
    throw new Error('photo_invalid');
  const bytes = Buffer.from(body.data, 'base64');
  if (!bytes.length || bytes.length > 8 * 1024 * 1024)
    throw new Error('photo_invalid');
  const metadata = await sharp(bytes, {
    limitInputPixels: 25_000_000,
  }).metadata();
  if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? ''))
    throw new Error('photo_invalid');
  // Raw bytes are stored only in private storage. No public image writer runs here.
  await withTransaction(async (client) => {
    const member = (
      await client.query(
        `SELECT id FROM telegram_product_members WHERE telegram_id=$1 AND status='active' FOR UPDATE`,
        [body.telegramId],
      )
    ).rows[0];
    if (!member) throw new Error('membership_required');
    const row = await readSession(client, body.sessionId, true);
    if (row.member_id !== member.id) throw new Error('forbidden');
    const hash = digest(`${body.sessionId}:${body.data}`);
    const previous = (
      await client.query(
        'SELECT request_hash FROM telegram_product_updates WHERE telegram_id=$1 AND update_id=$2',
        [body.telegramId, body.updateId],
      )
    ).rows[0];
    if (previous) {
      if (previous.request_hash !== hash) throw new Error('update_conflict');
      return;
    }
    if (
      !['collecting', 'changes_requested'].includes(row.status) ||
      row.state.stage !== 'photos' ||
      row.revision !== body.revision
    )
      throw new Error('stale_action');
    if(row.state.guided && (await client.query("SELECT 1 FROM telegram_product_assets WHERE session_id=$1 AND entry_id=$2 AND status IN ('queued','ready') LIMIT 1",[row.id,row.state.entryId])).rows.length)throw new Error('photo_wait_for_review');
    const requestedAngle =
      row.state.guided && row.state.photoKind === 'device'
        ? (() => {
            const done = row.state.photoAngles?.[row.state.entryId] ?? [];
            const next = photoGuide(row.document).find(
              (angle) => !done.includes(angle.key),
            );
            // Every requested view is already approved: a new upload would have
            // no angle to retouch (the hero cover is composed at this point).
            if (!next) throw new Error('photo_wait_for_review');
            return next.key;
          })()
        : null;
    if (
      (
        await client.query(
          'SELECT count(*)::int AS n FROM telegram_product_assets WHERE session_id=$1',
          [row.id],
        )
      ).rows[0].n >= 40
    )
      throw new Error('photo_limit');
    if (
      (
        await client.query(
          `SELECT count(*)::int AS n FROM telegram_product_jobs j JOIN telegram_product_sessions s ON s.id=j.session_id WHERE s.member_id=$1 AND j.kind='photo' AND j.created_at>now()-interval '1 day'`,
          [member.id],
        )
      ).rows[0].n >= 100
    )
      throw new Error('too_many_requests');
    const file = await writePrivatePhoto(
      bytes,
      metadata.format === 'jpeg' ? 'jpg' : metadata.format!,
    );
    const asset = (
      await client.query(
        'INSERT INTO telegram_product_assets(session_id,entry_id,kind,private_path,requested_angle) VALUES($1,$2,$3,$4,$5) RETURNING id',
        [row.id, row.state.entryId, row.state.photoKind, file, requestedAngle],
      )
    ).rows[0];
    await client.query(
      `INSERT INTO telegram_product_jobs(session_id,kind,payload) VALUES($1,'photo',$2)`,
      [row.id, JSON.stringify({ assetId: asset.id })],
    );
    await client.query(
      'INSERT INTO telegram_product_updates(telegram_id,update_id,request_hash) VALUES($1,$2,$3)',
      [body.telegramId, body.updateId, hash],
    );
    await client.query(
      'UPDATE telegram_product_sessions SET revision=revision+1,updated_at=now() WHERE id=$1',
      [row.id],
    );
  });
};

export const prepareTelegramPhoto = async (
  bytes: Buffer,
  kind: string,
): Promise<{ bytes: Buffer; hints: Record<string, unknown> }> => {
  let token = process.env.APFEL_INTAKE_VISION_TOKEN?.trim();
  if (!token) {
    const config = await readFile('/etc/apfel-intake-vision.env', 'utf8');
    token = config
      .match(/^APFEL_INTAKE_VISION_TOKEN=(.*)$/m)?.[1]
      ?.trim()
      .replace(/^(['"])(.*)\1$/, '$2');
  }
  if (!token || token.length < 32) throw new Error('photo_privacy_unavailable');
  const runId = `telegram-${randomUUID()}`,
    form = new FormData(),
    publishKind = kind === 'device' || kind === 'box' || kind === 'cover';
  form.set('run_id', runId);
  form.set('asset_type', publishKind && kind !== 'box' ? 'condition_photo' : kind === 'box' ? 'packaging' : kind);
  form.set(
    'image',
    new File([new Uint8Array(bytes)], 'photo.jpg', { type: 'image/jpeg' }),
  );
  const response = await fetch('http://127.0.0.1:8730/extract', {
    method: 'POST',
    headers: { 'X-Vision-Token': token },
    body: form,
    redirect: 'error',
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error('photo_privacy_failed');
  const result = (await response.json()) as Record<string, unknown>;
  const candidate = publishKind ? result.publishPath : result.redactedPath;
  const expectedHash = publishKind
    ? result.publishSha256
    : result.redactedSha256;
  if (
    result.privacyScanPassed !== true ||
    typeof candidate !== 'string' ||
    typeof expectedHash !== 'string'
  )
    throw new Error('photo_privacy_failed');
  const resolved = await realpath(candidate);
  if (
    !resolved.startsWith(`/srv/n8n/media/intake/${runId}/`) ||
    path.extname(resolved) !== '.webp'
  )
    throw new Error('photo_privacy_failed');
  const safe = await readFile(resolved);
  if (
    safe.length > 8 * 1024 * 1024 ||
    createHash('sha256').update(safe).digest('hex') !== expectedHash
  )
    throw new Error('photo_privacy_failed');
  if (
    (await sharp(safe, { limitInputPixels: 25_000_000 }).metadata()).format !==
    'webp'
  )
    throw new Error('photo_privacy_failed');
  const hints = Object.fromEntries(
    ['hardwareModel', 'modelName', 'manufacturerPartNumber', 'gtinCandidates']
      .filter((k) => result[k] !== undefined)
      .map((k) => [k, result[k]]),
  );
  if (findSensitiveDataIssues(hints).length)
    throw new Error('photo_privacy_failed');
  return { bytes: safe, hints };
};

export const studioPhoto = async (bytes: Buffer): Promise<Buffer> => {
  const key = await resolveGeminiKey();
  const model =
    (
      await query(
        'SELECT image_model FROM ai_provider_configuration WHERE id=true',
      )
    ).rows[0]?.image_model ?? 'gemini-nano-banana-2.1';
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/interactions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      redirect: 'error',
      signal: AbortSignal.timeout(90000),
      body: JSON.stringify({
        model,
        input: [
          {
            type: 'text',
            text: studioPhotoPrompt,
          },
          {
            type: 'image',
            mime_type: 'image/webp',
            data: bytes.toString('base64'),
          },
        ],
        response_format: {
          type: 'image',
          aspect_ratio: '1:1',
          image_size: '2K',
        },
        store: false,
      }),
    },
  );
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? 'research_rate_limited'
        : response.status === 402
          ? 'photo_credits_depleted'
          : response.status === 401 || response.status === 403
            ? 'photo_provider_access_denied'
            : response.status === 404
              ? 'photo_model_unavailable'
              : 'photo_provider_failed',
    );
  const result = (await response.json()) as {
    status?: string;
    steps?: Array<{ type?: string; content?: Array<{ type?: string; data?: string }> }>;
    output_image?: { data?: string };
    outputs?: Array<{ type?: string; data?: string }>;
  };
  if (result.status && result.status !== 'completed')
    throw new Error('photo_provider_incomplete');
  // Raw REST responses contain model_output steps. output_image is an SDK
  // convenience property; thought/signature blocks must never become previews.
  const data =
    result.steps?.filter(step => step.type === 'model_output')
      .flatMap(step => step.content ?? [])
      .find(content => content.type === 'image')?.data ??
    result.output_image?.data ??
    result.outputs?.find((o) => o.type === 'image')?.data;
  if (typeof data !== 'string' || !data.length || data.length > 20_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data))
    throw new Error('photo_invalid_response');
  return sharp(Buffer.from(data, 'base64'), { limitInputPixels: 25_000_000 })
    .rotate()
    .resize({ width: 1400, height: 1400, fit: 'inside' })
    .webp({ quality: 90 })
    .toBuffer();
};

// ---------------------------------------------------------------------------
// Product studio v6 (n8n): one photo per call, retouched live while the seller
// uploads, plus a hero cover composed from the retouched back + front.
// Gated by TELEGRAM_PRODUCTS_STUDIO_N8N_ENABLED so a deploy never reroutes the
// live flow before the n8n workflow and its webhook key are assigned.
// ---------------------------------------------------------------------------

export const n8nStudioEnabled = (): boolean =>
  process.env.TELEGRAM_PRODUCTS_STUDIO_N8N_ENABLED === 'true';

export const coverEligibleCategory = (category: string | undefined): boolean =>
  category === 'smartphones' || category === 'tablets';

const n8nStudioBase = (): string =>
  (
    process.env.TELEGRAM_PRODUCTS_N8N_STUDIO_URL?.trim() ||
    'http://127.0.0.1:5678'
  ).replace(/\/+$/, '');

const n8nWebhookKey = async (): Promise<string> => {
  let key = process.env.TELEGRAM_PRODUCTS_N8N_WEBHOOK_KEY?.trim();
  if (!key) {
    try {
      const config = await readFile('/etc/apfel-intake-n8n.env', 'utf8');
      key = config
        .match(/^TELEGRAM_PRODUCTS_N8N_WEBHOOK_KEY=(.*)$/m)?.[1]
        ?.trim()
        .replace(/^(['"])(.*)\1$/, '$2');
    } catch {
      key = undefined;
    }
  }
  if (!key || key.length < 16) throw new Error('photo_provider_access_denied');
  return key;
};

const postN8n = async (
  url: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const key = await n8nWebhookKey();
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Retouch-Key': key },
      redirect: 'error',
      signal: AbortSignal.timeout(120_000),
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('photo_provider_failed');
  }
  if (!response.ok)
    throw new Error(
      response.status === 401 || response.status === 403
        ? 'photo_provider_access_denied'
        : 'photo_provider_failed',
    );
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    throw new Error('photo_invalid_response');
  }
};

const studioImageBytes = (value: unknown): Buffer => {
  const raw = typeof value === 'string' ? value.replace(/\s+/g, '') : '';
  if (
    !raw.length ||
    raw.length > 20_000_000 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(raw)
  )
    throw new Error('photo_invalid_response');
  const bytes = Buffer.from(raw, 'base64');
  if (!bytes.length || bytes.length > 20_000_000)
    throw new Error('photo_invalid_response');
  return bytes;
};

const studioProblems = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .filter((problem): problem is string => typeof problem === 'string')
        .map((problem) => problem.slice(0, 200))
        .slice(0, 6)
    : [];

export type StudioRetouchResult =
  | { status: 'edited'; bytes: Buffer; mimeType: string; view?: string }
  | { status: 'retake'; problems: string[]; view?: string }
  | { status: 'skipped'; reason: string };

export const n8nRetouchPhoto = async (input: {
  category: string;
  requestedAngle: string | null;
  bytes: Buffer;
  sessionId: string;
  entryId: string;
}): Promise<StudioRetouchResult> => {
  const result = await postN8n(
    `${n8nStudioBase()}/webhook/product-studio-v6-photo`,
    {
      category: input.category,
      requested_angle: input.requestedAngle ?? 'extra',
      mime_type: 'image/webp',
      base64_image: input.bytes.toString('base64'),
      // By-design close-up slots are retouched even though the classifier reads
      // them as "extra"; a badly shot photo still bounces to retake.
      force_edit:
        input.requestedAngle === 'details' || input.requestedAngle === 'connector',
      session_id: input.sessionId,
      entry_id: input.entryId,
    },
  );
  const view = typeof result.view === 'string' ? result.view : undefined;
  if (result.status === 'edited')
    return {
      status: 'edited',
      bytes: studioImageBytes(result.base64_image),
      mimeType:
        typeof result.mime_type === 'string' && result.mime_type
          ? result.mime_type
          : 'image/png',
      view,
    };
  if (result.status === 'retake')
    return { status: 'retake', problems: studioProblems(result.problems), view };
  if (result.status === 'skipped')
    return {
      status: 'skipped',
      reason:
        typeof result.reason === 'string' && result.reason
          ? result.reason.slice(0, 120)
          : 'extra_view',
    };
  throw new Error('photo_provider_failed');
};

export type StudioCoverResult =
  | { status: 'edited'; bytes: Buffer; mimeType: string }
  | { status: 'skipped'; reason: string };

export const n8nCover = async (input: {
  category: string;
  backBytes: Buffer;
  frontBytes: Buffer;
  sessionId: string;
  entryId: string;
}): Promise<StudioCoverResult> => {
  const result = await postN8n(
    `${n8nStudioBase()}/webhook/product-studio-v6-cover`,
    {
      category: input.category,
      mime_back: 'image/webp',
      base64_back: input.backBytes.toString('base64'),
      mime_front: 'image/webp',
      base64_front: input.frontBytes.toString('base64'),
      session_id: input.sessionId,
      entry_id: input.entryId,
    },
  );
  if (result.status === 'edited')
    return {
      status: 'edited',
      bytes: studioImageBytes(result.base64_image),
      mimeType:
        typeof result.mime_type === 'string' && result.mime_type
          ? result.mime_type
          : 'image/png',
    };
  if (result.status === 'skipped')
    return {
      status: 'skipped',
      reason:
        typeof result.reason === 'string' && result.reason
          ? result.reason.slice(0, 120)
          : 'cover_unsupported',
    };
  throw new Error('photo_provider_failed');
};

// The final draft image is a lossless WebP: no quality step is lost between
// the retouch and the published draft. Only a pathological source falls back
// to a near-lossless encode so the upload limits stay satisfiable.
export const encodeDraftWebp = async (bytes: Buffer): Promise<Buffer> => {
  const lossless = await sharp(bytes, { limitInputPixels: 25_000_000 })
    .rotate()
    .webp({ lossless: true, effort: 4 })
    .toBuffer();
  if (lossless.length <= 8 * 1024 * 1024) return lossless;
  return sharp(bytes, { limitInputPixels: 25_000_000 })
    .rotate()
    .webp({ quality: 95 })
    .toBuffer();
};

export const acceptPhoto = async (
  client: TransactionClient,
  sessionId: string,
  assetId: string,
  edited: boolean,
  actor: string,
): Promise<void> => {
  const row = await readSession(client, sessionId, true);
  const asset = (
    await client.query(
      `SELECT * FROM telegram_product_assets WHERE id=$1 AND session_id=$2 FOR UPDATE`,
      [assetId, sessionId],
    )
  ).rows[0];
  if (
    !asset ||
    !['ready', 'retake'].includes(asset.status) ||
    !['device', 'box'].includes(asset.kind)
  )
    throw new Error('asset_not_ready');
  const selected = edited ? asset.edited_path : asset.safe_path;
  if (!selected) throw new Error('photo_edit_unavailable');
  const bytes = await readPrivatePhoto(selected);
  const safe = await encodeDraftWebp(bytes);
  const image = await uploadProductImage(
    new File([new Uint8Array(safe)], `${randomUUID()}.webp`, {
      type: 'image/webp',
    }),
  );
  const entry = row.document.entries.find((e) => e.id === asset.entry_id);
  if (!entry) throw new Error('entry_not_found');
  const slot = newPhotoSlot(image.url),
    empty = entry.photos.find((p) => !p.url);
  if (empty) {
    empty.url = slot.url;
    slot.id = empty.id;
  } else entry.photos.push(slot);
  // Only an actual device photo can satisfy device-photo confirmation.
  if (asset.kind === 'device') entry.hasRealProductPhotos = true;
  if(row.state.guided){
    if(asset.kind==='device'){
      const guide=photoGuide(row.document),angles=row.state.photoAngles??{},done=angles[entry.id]??[];
      const stored=asset.requested_angle && guide.some(item=>item.key===asset.requested_angle)
        ? asset.requested_angle as string
        : guide.find(item=>!done.includes(item.key))?.key;
      if(stored && !done.includes(stored))angles[entry.id]=[...done,stored];
      row.state.photoAngles=angles;
      if((angles[entry.id]?.length??0)>=guide.length){
        if(coverEligibleCategory(row.document.shared.category) && n8nStudioEnabled()){
          // The hero cover is composed from the approved back + front retouches
          // (n8n PROMPT B). The photos stage stays open as "pending" until the
          // cover job finishes and moves the draft to review.
          await client.query(
            `INSERT INTO telegram_product_jobs(session_id,kind,payload) VALUES($1,'photo',$2)`,
            [row.id,JSON.stringify({cover:true,entryId:entry.id})],
          );
        }else{
          row.state.stage='review';row.document.step=6;row.state.editing=false;row.state.singleField=false;
        }
      }
    }
    row.state.photoKind='device';
    await client.query('UPDATE telegram_product_sessions SET state=$2 WHERE id=$1',[row.id,JSON.stringify(row.state)]);
  }
  await client.query(
    'UPDATE smartphone_editor_drafts SET document=$2,revision=revision+1,updated_at=now(),updated_by=$3 WHERE id=$1',
    [row.draft_id, JSON.stringify(row.document), actor],
  );
  await client.query(
    'UPDATE telegram_product_assets SET status=$2,public_url=$3 WHERE id=$1',
    [assetId, edited ? 'approved' : 'original', image.url],
  );
  await event(client, sessionId, actor, 'photo_accepted', {
    assetId,
    edited,
    kind: asset.kind,
  });
};

export const readAssetPreview = async (
  sessionId: string,
  assetId: string,
  edited: boolean,
): Promise<Buffer> => {
  const asset = (
    await query(
      `SELECT * FROM telegram_product_assets WHERE id=$1 AND session_id=$2`,
      [assetId, sessionId],
    )
  ).rows[0];
  const file = edited ? asset?.edited_path : asset?.safe_path;
  if (!file) throw new Error('asset_not_ready');
  return readPrivatePhoto(file);
};

export const applyPhotoHints = (
  document: PhoneDocumentForHints,
  hints: Record<string, unknown>,
): void => {
  const entry = currentEntry(document.document, document.state);
  const candidates = Array.isArray(hints.gtinCandidates)
    ? hints.gtinCandidates
    : [];
  const gtins = [
    ...new Set(
      candidates
        .filter(
          (c) =>
            c &&
            c.autoAccept === true &&
            c.checksumValid === true &&
            c.extractionMethod === 'barcode',
        )
        .map((c) => String(c.value)),
    ),
  ];
  // Suggestions are displayed, never silently used as identifiers.
  if (gtins.length)
    document.state.warnings.push(
      `GTIN suggestion (confirm manually): ${gtins.join(', ')}`,
    );
  if (typeof hints.manufacturerPartNumber === 'string')
    document.state.warnings.push(
      `MPN suggestion (confirm manually): ${hints.manufacturerPartNumber}`,
    );
  void entry;
};
type PhoneDocumentForHints = {
  document: import('@/lib/smartphone-editor/model').PhoneDocument;
  state: import('./model').Conversation;
};
