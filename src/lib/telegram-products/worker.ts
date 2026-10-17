import { randomUUID, createHash } from 'node:crypto';
import { query, withTransaction, type TransactionClient } from '@/lib/db';
import { researchProductFromOfficialPages } from '@/lib/product-research-service';
import { applyEditorResearch } from '@/lib/smartphone-editor/research';
import type { ProductResearchResult } from '@/lib/product-research-core';
import {
  applyPhotoHints,
  prepareTelegramPhoto,
  readPrivatePhoto,
  studioPhoto,
  writePrivatePhoto,
} from './photos';
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
          if (entry.condition !== 'new' && entry.experience && !entry.telegramAccessoriesConfirmed)
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
        editingError: string | null = null;
      if (['device', 'box'].includes(asset.kind)) {
        try {
          const edited = await studioPhoto(prepared.bytes);
          const checked = await prepareTelegramPhoto(edited, asset.kind);
          editedPath = await writePrivatePhoto(checked.bytes);
        } catch (error) {
          editingError = safeError(error);
        }
      }
      await withTransaction(async (client) => {
        if (!(await activeJob(client, job))) throw new Error('job_cancelled');
        const row = await readSession(client, job.session_id, true);
        if (!['collecting', 'changes_requested'].includes(row.status))
          throw new Error('job_cancelled');
        await client.query(
          'UPDATE telegram_product_assets SET safe_path=$2,edited_path=$3,sha256=$4,status=$5 WHERE id=$1',
          [
            asset.id,
            safePath,
            editedPath,
            createHash('sha256').update(prepared.bytes).digest('hex'),
            ['device', 'box'].includes(asset.kind) ? 'ready' : 'original',
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
      if (job.kind === 'photo')
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
