import { randomUUID, createHash } from 'node:crypto';
import { query, withTransaction, type TransactionClient } from '@/lib/db';
import { uploadProductImage } from '@/lib/blob';
import { researchProductFromOfficialPages } from '@/lib/product-research-service';
import { applyEditorResearch } from '@/lib/smartphone-editor/research';
import type { ProductResearchResult } from '@/lib/product-research-core';
import {
  applyPhotoHints,
  encodeDraftWebp,
  composePhotoCover,
  n8nRetouchPhoto,
  n8nStudioEnabled,
  prepareTelegramPhoto,
  readPrivatePhoto,
  studioPhoto,
  writePrivatePhoto,
  verifyPhotoIdentity,
} from './photos';
import { newPhotoSlot, photoGuide } from './model';
import { photoIdentityContext } from './photo-policy';
import {
  digest,
  event,
  readSession,
  telegramProductsEnabled,
} from './repository';

type Job = {
  id: string;
  session_id: string;
  kind: 'research' | 'photo';
  payload: {
    query?: string;
    condition?: string;
    category?: string;
    assetId?: string;
    cover?: boolean;
    entryId?: string;
    feedback?: string;
  };
  lease: string;
  attempts: number;
};
const safeError = (error: unknown): string => {
  const code = error instanceof Error ? error.message : '';
  return /^(research_[a-z_]+|photo_[a-z_]+|gemini_[a-z_]+|official_sources_unavailable|job_cancelled)$/.test(
    code,
  )
    ? code
    : 'processing_failed';
};
const activeJob = async (
  client: TransactionClient,
  job: Job,
): Promise<boolean> => {
  const member = (
    await client.query(
      `SELECT m.status FROM telegram_product_members m JOIN telegram_product_sessions s ON s.member_id=m.id WHERE s.id=$1 FOR UPDATE OF m`,
      [job.session_id],
    )
  ).rows[0];
  const lease =
    (
      await client.query(
        `SELECT 1 FROM telegram_product_jobs WHERE id=$1 AND lease=$2 AND status='processing' AND lease_until>now() FOR UPDATE`,
        [job.id, job.lease],
      )
    ).rows.length > 0;
  return lease && member?.status === 'active';
};
// Hero cover (product studio v6, smartphones + tablets only): compose the final
// draft cover from the retouched back + front, publish it as a lossless WebP
// draft image, and mark it as the entry cover.
const processHeroCover = async (job: Job): Promise<void> => {
  const entryId = job.payload.entryId ?? '';
  if (!entryId) throw new Error('job_cancelled');
  const session = (
    await query(
      'SELECT s.id,d.document FROM telegram_product_sessions s JOIN smartphone_editor_drafts d ON d.id=s.draft_id WHERE s.id=$1',
      [job.session_id],
    )
  ).rows[0];
  if (!session) throw new Error('job_cancelled');
  const category = session.document?.shared?.category as string | undefined;
  const sources = (
    await query(
      `SELECT requested_angle,CASE WHEN status='approved' THEN edited_path ELSE safe_path END AS path FROM telegram_product_assets WHERE session_id=$1 AND entry_id=$2 AND requested_angle IN ('back','front') AND status IN ('approved','original') AND photo_policy_version=1 ORDER BY created_at DESC`,
      [job.session_id, entryId],
    )
  ).rows as Array<{ requested_angle: string; path: string | null }>;
  const back = sources.find((asset) => asset.requested_angle === 'back'),
    front = sources.find((asset) => asset.requested_angle === 'front');
  let failure: string | null = null,
    made: { file: string; url: string; sha256: string } | null = null;
  if (!back?.path || !front?.path) failure = 'cover_source_missing';
  else {
    try {
      if (category === 'smartphones' || category === 'tablets') {
        const coverBytes = await composePhotoCover(await readPrivatePhoto(back.path), await readPrivatePhoto(front.path));
        const checked = await prepareTelegramPhoto(coverBytes, 'cover');
        const lossless = await encodeDraftWebp(checked.bytes);
        const file = await writePrivatePhoto(lossless);
        const image = await uploadProductImage(
          new File([new Uint8Array(lossless)], `${randomUUID()}.webp`, {
            type: 'image/webp',
          }),
        );
        made = {
          file,
          url: image.url,
          sha256: createHash('sha256').update(checked.bytes).digest('hex'),
        };
      } else failure = 'cover_unsupported';
    } catch (error) {
      failure = safeError(error);
    }
  }
  await withTransaction(async (client) => {
    if (!(await activeJob(client, job))) throw new Error('job_cancelled');
    const row = await readSession(client, job.session_id, true);
    if (!['collecting', 'changes_requested'].includes(row.status))
      throw new Error('job_cancelled');
    const entry = row.document.entries.find((item) => item.id === entryId);
    // If the seller restarted the photos in the meantime, the cover is stale:
    // keep it out of the draft and leave the photos stage untouched.
    const anglesDone =
      (row.state.photoAngles?.[entryId]?.length ?? 0) >=
      photoGuide(row.document).length;
    if (made && entry && anglesDone) {
      const slot = newPhotoSlot(made.url);
      entry.photos.push(slot);
      entry.coverId = slot.id;
      await client.query(
        `INSERT INTO telegram_product_assets(session_id,entry_id,kind,private_path,safe_path,sha256,status,public_url,source_type,photo_policy_version) VALUES($1,$2,'cover',$3,$3,$4,'approved',$5,'composed_photos',1)`,
        [job.session_id, entryId, made.file, made.sha256, made.url],
      );
    }
    if (anglesDone) {
      row.state.stage = 'review';
      row.document.step = 6;
      row.state.editing = false;
      row.state.singleField = false;
      row.state.photoKind = 'device';
      await client.query(
        'UPDATE smartphone_editor_drafts SET document=$2,revision=revision+1,updated_at=now() WHERE id=$1',
        [row.draft_id, JSON.stringify(row.document)],
      );
      await client.query(
        'UPDATE telegram_product_sessions SET state=$2,revision=revision+1,updated_at=now() WHERE id=$1',
        [row.id, JSON.stringify(row.state)],
      );
    }
    await event(
      client,
      row.id,
      'worker',
      made && anglesDone ? 'cover_created' : 'cover_failed',
      made && anglesDone ? { entryId, url: made.url } : { entryId, failure },
    );
  });
};

export const runTelegramProductWorkerPass = async (): Promise<void> => {
  if (!telegramProductsEnabled()) return;
  const exhausted = (
    await query(
      `UPDATE telegram_product_jobs SET status='failed',error_code='processing_interrupted',lease=null,lease_until=null WHERE status='processing' AND lease_until<now() AND attempts>=3 RETURNING session_id,kind,payload`,
    )
  ).rows;
  for (const interrupted of exhausted)
    await withTransaction(async (client) => {
      const row = await readSession(client, interrupted.session_id, true);
      if (
        interrupted.kind === 'research' &&
        row.state.stage === 'researching'
      ) {
        row.state.researchError = 'processing_interrupted';
        await client.query(
          'UPDATE telegram_product_sessions SET state=$2,revision=revision+1 WHERE id=$1',
          [row.id, JSON.stringify(row.state)],
        );
      }
      if (interrupted.kind === 'photo')
        await client.query(
          "UPDATE telegram_product_assets SET status='failed' WHERE id=$1 AND status='queued'",
          [interrupted.payload.assetId],
        );
    });
  const lease = randomUUID();
  const job = (
    await query(
      `WITH ready AS (SELECT j.id FROM telegram_product_jobs j JOIN telegram_product_sessions s ON s.id=j.session_id JOIN telegram_product_members m ON m.id=s.member_id WHERE (j.status='queued' OR (j.status='processing' AND j.lease_until<now())) AND j.run_after<=now() AND j.attempts<3 AND m.status='active' AND s.status IN ('collecting','changes_requested') ORDER BY j.created_at FOR UPDATE OF j SKIP LOCKED LIMIT 1) UPDATE telegram_product_jobs j SET status='processing',lease=$1,lease_until=now()+interval '4 minutes',attempts=attempts+1,updated_at=now() FROM ready WHERE j.id=ready.id RETURNING j.*`,
      [lease],
    )
  ).rows[0] as Job | undefined;
  if (!job) return;
  try {
    if (job.kind === 'research') {
      const cacheKey = digest(
        `de-DE-offer-v2|${job.payload.query}|${job.payload.condition}|${job.payload.category}|${process.env.GEMINI_RESEARCH_MODEL ?? ''}`,
      );
      const cached = (
        await query(
          'SELECT result FROM telegram_product_research_cache WHERE cache_key=$1 AND expires_at>now()',
          [cacheKey],
        )
      ).rows[0];
      let result: ProductResearchResult = cached?.result;
      if (!result) {
        result = await researchProductFromOfficialPages({
          query: job.payload.query!,
          condition: job.payload.condition,
          category: job.payload.category,
        });
        await query(
          `INSERT INTO telegram_product_research_cache(cache_key,result,expires_at) VALUES($1,$2,now()+interval '1 day') ON CONFLICT(cache_key) DO UPDATE SET result=excluded.result,expires_at=excluded.expires_at`,
          [cacheKey, JSON.stringify(result)],
        );
      }
      await withTransaction(async (client) => {
        if (!(await activeJob(client, job))) throw new Error('job_cancelled');
        const row = await readSession(client, job.session_id, true);
        if (
          !['collecting', 'changes_requested'].includes(row.status) ||
          row.state.stage !== 'researching' ||
          `${row.document.shared.brand} ${row.document.shared.model}` !==
            job.payload.query
        )
          throw new Error('job_cancelled');
        const doc = applyEditorResearch(row.document, result);
        // Initial model research is editable; no live product is changed.
        doc.shared = {
          ...doc.shared,
          ...doc.pendingShared,
          category: row.document.shared.category,
        };
        delete doc.pendingShared;
        for (const entry of doc.entries)
          if (entry.condition !== 'new' && entry.experience && !entry.telegramAccessoriesConfirmed && !entry.experience.packageContents.some(item=>item.isGift || item.presetId))
            entry.experience.packageContents = [];
        row.state.sources = result.researchSources ?? [];
        row.state.warnings = result.researchWarnings ?? [];
        row.state.stage = row.state.guided && row.state.editing ? 'review' : 'versions';
        delete row.state.researchError;
        doc.step = row.state.stage==='review'?6:1;
        if(row.state.stage==='review')row.state.editing=false;
        await client.query(
          'UPDATE smartphone_editor_drafts SET document=$2,revision=revision+1,updated_at=now() WHERE id=$1',
          [row.draft_id, JSON.stringify(doc)],
        );
        await client.query(
          'UPDATE telegram_product_sessions SET state=$2,revision=revision+1,updated_at=now() WHERE id=$1',
          [row.id, JSON.stringify(row.state)],
        );
        await event(client, row.id, 'worker', 'research_completed', {
          sources: row.state.sources,
        });
      });
    } else if (job.payload.cover) {
      await processHeroCover(job);
    } else {
      const asset = (
        await query(
          'SELECT * FROM telegram_product_assets WHERE id=$1 AND session_id=$2',
          [job.payload.assetId, job.session_id],
        )
      ).rows[0];
      if (!asset) throw new Error('photo_invalid');
      const prepared = await prepareTelegramPhoto(
        await readPrivatePhoto(asset.private_path),
        asset.kind,
      );
      const safePath = await writePrivatePhoto(prepared.bytes);
      let editedPath: string | null = null,
        editingError: string | null = null,
        assetStatus: 'ready' | 'retake' = 'ready',
        retakeReason: string | null = null,
        skippedReason: string | null = null;
      let qualityVerdict: import('./photo-policy').PhotoVerdict | null = null;
      const document = (await query('SELECT d.document FROM telegram_product_sessions s JOIN smartphone_editor_drafts d ON d.id=s.draft_id WHERE s.id=$1', [job.session_id])).rows[0]?.document;
      const productEntry = document?.entries?.find((item: { id: string }) => item.id === asset.entry_id);
      const photoContext = { brand: document?.shared?.brand, model: document?.shared?.model, color: productEntry?.color, condition: productEntry?.condition, feedback: job.payload.feedback };
      if (['device', 'box'].includes(asset.kind)) {
        if (asset.kind === 'device' && n8nStudioEnabled()) {
          try {
          // Product studio v6: the angle stored at upload time decides how the
          // upload is retouched (or rejected) by the n8n workflow.
          const result = await n8nRetouchPhoto({
            category: document?.shared?.category ?? '',
            requestedAngle: asset.requested_angle ?? null,
            bytes: prepared.bytes,
            sessionId: job.session_id,
            entryId: asset.entry_id,
            context: photoContext,
          });
          if (result.status === 'edited') {
            const checked = await prepareTelegramPhoto(result.bytes, asset.kind);
            qualityVerdict = await verifyPhotoIdentity(prepared.bytes, checked.bytes, photoContext);
            editedPath = await writePrivatePhoto(checked.bytes);
          } else if (result.status === 'retake') {
            assetStatus = 'retake';
            retakeReason = (
              result.problems.join(' · ') || 'photo_retake'
            ).slice(0, 300);
          } else {
            // Extras and other out-of-scope views are kept untouched.
            skippedReason = result.reason;
          }
          } catch (error) {
            // Reject the candidate, not the preserved privacy-checked source.
            editingError = safeError(error);
          }
        } else {
          try {
            const edited = await studioPhoto(prepared.bytes, photoContext);
            const checked = await prepareTelegramPhoto(edited, asset.kind);
            qualityVerdict = await verifyPhotoIdentity(prepared.bytes, checked.bytes, photoContext);
            editedPath = await writePrivatePhoto(checked.bytes);
          } catch (error) {
            editingError = safeError(error);
          }
        }
      }
      await withTransaction(async (client) => {
        if (!(await activeJob(client, job))) throw new Error('job_cancelled');
        const row = await readSession(client, job.session_id, true);
        if (!['collecting', 'changes_requested'].includes(row.status))
          throw new Error('job_cancelled');
        const freshEntry = row.document.entries.find(item => item.id === asset.entry_id);
        const freshContext = photoIdentityContext({ brand: row.document.shared.brand, model: row.document.shared.model, color: freshEntry?.color, condition: freshEntry?.condition });
        if (JSON.stringify(freshContext) !== JSON.stringify(photoIdentityContext(photoContext))) throw new Error('job_cancelled');
        await client.query(
          'UPDATE telegram_product_assets SET safe_path=$2,edited_path=$3,sha256=$4,status=$5,photo_policy_version=1,quality_verdict=$6::jsonb WHERE id=$1',
          [
            asset.id,
            safePath,
            editedPath,
            createHash('sha256').update(prepared.bytes).digest('hex'),
            ['device', 'box'].includes(asset.kind) ? assetStatus : 'original',
            JSON.stringify(qualityVerdict ? { ...qualityVerdict, identityContext: photoIdentityContext(photoContext) } : null),
          ],
        );
        applyPhotoHints(row, prepared.hints);
        if (editingError)
          row.state.warnings.push(
            `Photo editing: ${editingError}. Original available.`,
          );
        await client.query(
          'UPDATE telegram_product_sessions SET state=$2,revision=revision+1,updated_at=now() WHERE id=$1',
          [row.id, JSON.stringify(row.state)],
        );
        await event(client, row.id, 'worker', 'photo_prepared', {
          assetId: asset.id,
          editingError,
          requestedAngle: asset.requested_angle ?? null,
          retakeReason,
          skippedReason,
        });
      });
    }
    await query(
      `UPDATE telegram_product_jobs SET status='done',lease=null,lease_until=null,updated_at=now() WHERE id=$1 AND lease=$2`,
      [job.id, job.lease],
    );
  } catch (error) {
    const code = safeError(error);
    await withTransaction(async (client) => {
      if (!(await activeJob(client, job))) {
        await client.query(
          "UPDATE telegram_product_jobs SET status='cancelled',lease=null,lease_until=null WHERE id=$1 AND lease=$2",
          [job.id, job.lease],
        );
        return;
      }
      const row = await readSession(client, job.session_id, true);
      if (job.kind === 'research' && row.state.stage === 'researching') {
        row.state.researchError = code;
        await client.query(
          'UPDATE telegram_product_sessions SET state=$2,revision=revision+1,updated_at=now() WHERE id=$1',
          [row.id, JSON.stringify(row.state)],
        );
      }
      if (job.kind === 'photo' && job.payload.assetId)
        await client.query(
          `UPDATE telegram_product_assets SET status='failed' WHERE id=$1 AND status='queued'`,
          [job.payload.assetId],
        );
      await client.query(
        `UPDATE telegram_product_jobs SET status=$3,error_code=$4,lease=null,lease_until=null,updated_at=now() WHERE id=$1 AND lease=$2`,
        [
          job.id,
          job.lease,
          code === 'job_cancelled' ? 'cancelled' : 'failed',
          code,
        ],
      );
      await event(client, row.id, 'worker', 'processing_failed', {
        jobId: job.id,
        code,
      });
    });
  }
};
