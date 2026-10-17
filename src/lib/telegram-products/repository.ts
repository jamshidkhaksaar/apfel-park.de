import { createHash, randomBytes } from 'node:crypto';
import { query, withTransaction, type TransactionClient } from '@/lib/db';
import {
  validateDocument,
  type PhoneDocument,
} from '@/lib/smartphone-editor/model';
import {
  telegramBlockers,
  newConversation,
  photoGuide,
  renderConversation,
  transition,
  tr,
  type BotView,
  type Conversation,
  type Locale,
} from './model';
import { acceptPhoto } from './photos';
import { createPhoneDraftInTransaction } from '@/lib/smartphone-editor/repository';
import { normalizeTelegramOfferDocument } from './offer-content';
import { readOfferPresets } from '@/lib/product-offer-presets-repository';

export const telegramProductsEnabled = (): boolean =>
  process.env.TELEGRAM_PRODUCTS_ENABLED === 'true';
export const digest = (value: string): string =>
  createHash('sha256').update(value).digest('hex');
export type SessionRow = {
  id: string;
  member_id: string;
  draft_id: string;
  revision: number;
  state: Conversation;
  status: string;
  review_note: string | null;
  document: PhoneDocument;
  draft_revision: number;
};
export const event = async (
  client: Pick<TransactionClient, 'query'>,
  session: string | null,
  actor: string,
  type: string,
  details: Record<string, unknown> = {},
): Promise<void> => {
  await client.query(
    'INSERT INTO telegram_product_events(session_id,actor,event_type,details) VALUES($1,$2,$3,$4::jsonb)',
    [session, actor, type, JSON.stringify(details)],
  );
};
export const createInvite = async (
  label: string,
  actor: string,
): Promise<string> => {
  const token = randomBytes(24).toString('base64url');
  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO telegram_product_invites(token_hash,label,created_by,expires_at) VALUES($1,$2,$3,now()+interval '24 hours')`,
      [digest(token), label.slice(0, 80), actor],
    );
    await event(client, null, actor, 'invite_created');
  });
  return token;
};
export const enroll = async (
  telegramId: string,
  token: string,
  name: string,
  locale: Locale,
): Promise<void> => {
  if (!/^[A-Za-z0-9_-]{32}$/.test(token)) throw new Error('invalid_invite');
  await withTransaction(async (client) => {
    const invite = (
      await client.query(
        'SELECT * FROM telegram_product_invites WHERE token_hash=$1 AND expires_at>now() FOR UPDATE',
        [digest(token)],
      )
    ).rows[0];
    if (!invite || invite.claimed_by) throw new Error('invalid_invite');
    const member = (
      await client.query(
        `INSERT INTO telegram_product_members(telegram_id,display_name,locale) VALUES($1,$2,$3) ON CONFLICT(telegram_id) DO NOTHING RETURNING id`,
        [telegramId, name.slice(0, 120), locale],
      )
    ).rows[0];
    if (!member) throw new Error('already_enrolled');
    await client.query(
      'UPDATE telegram_product_invites SET claimed_by=$2 WHERE token_hash=$1',
      [digest(token), member.id],
    );
    await event(
      client,
      null,
      `telegram:${telegramId}`,
      'enrollment_requested',
      { memberId: member.id },
    );
  });
};
export const readSession = async (
  client: Pick<TransactionClient, 'query'>,
  id: string,
  lock = false,
): Promise<SessionRow> => {
  const row = (
    await client.query(
      `SELECT s.*,d.document,d.revision AS draft_revision FROM telegram_product_sessions s JOIN smartphone_editor_drafts d ON d.id=s.draft_id WHERE s.id=$1 AND d.deleted_at IS NULL ${lock ? 'FOR UPDATE OF s,d' : ''}`,
      [id],
    )
  ).rows[0];
  if (!row) throw new Error('session_not_found');
  if (row.document.entries.some((entry: {telegramOfferContentVersion?:number})=>entry.telegramOfferContentVersion!==1))
    row.document=normalizeTelegramOfferDocument(row.document,await readOfferPresets(client));
  if (
    !row.document.entries.some(
      (entry: { id: string }) => entry.id === row.state.entryId,
    )
  )
    row.state.entryId = row.document.entries[0]?.id;
  if(row.state.guided===undefined && !row.state.updateOnly){
    row.state.guided=true;
    row.state.conditionChosen=!['category','brand','model','condition'].includes(row.state.stage);
    if(row.state.stage==='price' && !row.document.entries.find((entry: {id:string;stock:number})=>entry.id===row.state.entryId)?.stock)row.state.stage='stock';
  }
  return row as SessionRow;
};
export const viewSession = async (
  client: Pick<TransactionClient, 'query'>,
  row: SessionRow,
): Promise<BotView> => {
  const view = renderConversation(
    row.state,
    row.document,
    row.revision,
    row.status,
  );
  view.sessionId = row.id;
  if (row.review_note) view.text = `${row.review_note}\n\n${view.text}`;
  if (row.state.stage === 'photos') {
    const assets = (
      await client.query(
        `SELECT a.id,a.status,a.kind,a.entry_id,a.requested_angle,a.edited_path IS NOT NULL AS edited,e.details->>'editingError' AS editing_error,e.details->>'retakeReason' AS retake_reason,e.details->>'skippedReason' AS skipped_reason FROM telegram_product_assets a LEFT JOIN LATERAL (SELECT details FROM telegram_product_events ev WHERE ev.session_id=a.session_id AND ev.event_type='photo_prepared' AND ev.details->>'assetId'=a.id::text ORDER BY ev.created_at DESC LIMIT 1) e ON true WHERE a.session_id=$1 AND a.entry_id=$2 AND a.status IN ('ready','failed','retake') ORDER BY a.created_at DESC LIMIT 12`,
        [row.id, row.state.entryId],
      )
    ).rows;
    // The guided flow shows exactly the photo awaiting a decision: retakes and
    // failed attempts replace each other instead of piling up in the chat.
    const photoAssets = row.state.guided
      ? assets.slice(0, 1)
      : [...assets].reverse();
    for (const asset of photoAssets) {
      if (asset.status === 'failed')
        view.buttons.unshift([
          {
            text: tr(
              row.state.locale,
              'Foto erneut prüfen',
              'Retry photo processing',
            ),
            action: `assetRetry:${asset.id}`,
          },
        ]);
      else if (asset.status === 'retake') {
        view.photos ??= [];
        view.photos.push({ id: asset.id, label: asset.kind, edited: false });
        view.buttons.unshift([
          {
            text: tr(
              row.state.locale,
              'Foto dennoch verwenden',
              'Use this photo anyway',
            ),
            action: `assetOriginal:${asset.id}`,
          },
        ]);
      } else if (asset.kind === 'device' || asset.kind === 'box') {
        view.photos ??= [];
        view.photos.push({ id: asset.id, label: asset.kind, edited: asset.edited });
        view.buttons.unshift(
          ...(asset.edited
            ? [
                [
                  {
                    text: tr(
                      row.state.locale,
                      'Bearbeitetes Foto verwenden',
                      'Use edited photo',
                    ),
                    action: `assetUse:${asset.id}`,
                  },
                ],
              ]
            : []),
          [
            {
              text: tr(row.state.locale, 'Original behalten', 'Keep original'),
              action: `assetOriginal:${asset.id}`,
            },
          ],
          [
            {
              text: tr(
                row.state.locale,
                'Bearbeitung wiederholen',
                'Retry editing',
              ),
              action: `assetRetry:${asset.id}`,
            },
          ],
        );
      }
    }
    if (row.state.guided) {
      const newest = photoAssets[0];
      if (newest?.status === 'retake') {
        const reason = newest.retake_reason ? ` ${newest.retake_reason}` : '';
        view.text = tr(
          row.state.locale,
          `⚠️ Diese Aufnahme wurde nicht akzeptiert:${reason} Bitte diese Seite erneut fotografieren.`,
          `⚠️ This photo was not accepted:${reason} Please take this side again.`,
        );
        view.buttons = view.buttons.filter((buttons) =>
          buttons.some(
            (button) =>
              button.action.startsWith('asset') || button.action === 'save',
          ),
        );
      } else if (newest?.status === 'ready') {
        view.text = tr(
          row.state.locale,
          '🔎 Foto prüfen: Original oder bearbeitete Vorschau wählen. Danach folgt automatisch die nächste Ansicht.',
          '🔎 Review the photo: choose the original or edited preview. The next view follows automatically.',
        );
        view.buttons = view.buttons.filter((buttons) =>
          buttons.some(
            (button) =>
              button.action.startsWith('asset') || button.action === 'save',
          ),
        );
      }
    }
    const unedited = photoAssets.find(
      (asset) =>
        asset.status === 'ready' &&
        ['device', 'box'].includes(asset.kind) &&
        !asset.edited,
    );
    if (unedited) {
      if (unedited.skipped_reason) {
        view.text = tr(
          row.state.locale,
          'ℹ️ Diese Aufnahme wurde unverändert gespeichert (Ansicht außerhalb des Studio-Rahmens). Original behalten oder neue Aufnahme senden.',
          'ℹ️ This photo was stored unchanged (a view outside the studio scope). Keep the original or send a new photo.',
        );
      } else {
        const reason =
          unedited.editing_error === 'research_rate_limited'
            ? tr(
                row.state.locale,
                'Das KI-Limit wurde erreicht.',
                'The AI rate limit was reached.',
              )
            : unedited.editing_error === 'photo_credits_depleted'
              ? tr(
                  row.state.locale,
                  'Das KI-Guthaben ist aufgebraucht.',
                  'The AI provider credits are depleted.',
                )
              : [
                    'photo_provider_access_denied',
                    'gemini_key_missing',
                    'photo_model_unavailable',
                  ].includes(unedited.editing_error)
                ? tr(
                    row.state.locale,
                    'Bitte den KI-Schlüssel und das Bildmodell in den Admin-Einstellungen prüfen.',
                    'Please check the AI key and image model in admin settings.',
                  )
                : tr(
                    row.state.locale,
                    'Es wurde kein bearbeitetes Foto erstellt.',
                    'No edited photo was created.',
                  );
        view.text =
          tr(
            row.state.locale,
            '⚠️ Studio-Bearbeitung fehlgeschlagen. ',
            '⚠️ Studio editing failed. ',
          ) +
          reason +
          '\n\n' +
          tr(
            row.state.locale,
            'Du siehst nur das Original. Bearbeitung wiederholen oder Original ausdrücklich behalten.',
            'You are seeing only the original. Retry editing or explicitly keep the original.',
          );
      }
    }
    view.pending =
      (
        await client.query(
          `SELECT 1 FROM telegram_product_jobs WHERE session_id=$1 AND status IN ('queued','processing') LIMIT 1`,
          [row.id],
        )
      ).rows.length > 0;
    if(row.state.guided && view.pending){
      const done=row.state.photoAngles?.[row.state.entryId]??[];
      const coverPending=photoGuide(row.document).every(angle=>done.includes(angle.key));
      view.text=coverPending
        ? tr(row.state.locale,'✨ Titelbild wird erstellt. Bitte warten…','✨ Creating the cover image. Please wait…')
        : tr(row.state.locale,'⏳ Foto wird geprüft und für die Vorschau vorbereitet. Bitte warten…','⏳ Checking the photo and preparing its preview. Please wait…');
      view.buttons=[[{text:tr(row.state.locale,'💾 Speichern & beenden','💾 Save & exit'),action:'save'}]];
    }
  }
  if(row.state.stage==='review' && row.state.guided){
    const urls=row.document.entries.flatMap(entry=>entry.photos.map(photo=>photo.url)).filter(Boolean);
    const assets=(await client.query("SELECT id,status,kind FROM telegram_product_assets WHERE session_id=$1 AND kind IN ('device','cover') AND status IN ('approved','original') AND public_url=ANY($2::text[]) ORDER BY created_at LIMIT 6",[row.id,urls])).rows;
    view.gallery=assets.map(asset=>({id:asset.id,edited:asset.status==='approved'&&asset.kind==='device',caption:row.document.shared.title??''}));
  }
  if (row.state.stage === 'model') {
    const models = (
      await client.query(
        `SELECT DISTINCT model FROM products WHERE brand ILIKE $1 AND category=$2 AND model IS NOT NULL AND import_metadata->>'catalogDeletedAt' IS NULL ORDER BY model LIMIT 12`,
        [row.document.shared.brand ?? '', row.document.shared.category],
      )
    ).rows;
    view.buttons.unshift(
      ...models.map((m) => [{ text: m.model, action: `choose:${m.model}` }]),
    );
  }
  if (
    row.state.stage === 'versions' && (!row.state.guided || row.state.existingMode) &&
    row.document.entries.length === 1 &&
    !row.document.entries[0].price &&
    !row.document.entries[0].photos.some((p) => p.url)
  ) {
    const matches = (
      await client.query(
        `SELECT id,title,condition,price FROM products WHERE lower(brand)=lower($1) AND lower(model)=lower($2) AND category=$3 AND condition=$4 AND import_metadata->>'catalogDeletedAt' IS NULL ORDER BY title LIMIT 12`,
        [
          row.document.shared.brand,
          row.document.shared.model,
          row.document.shared.category,
          row.state.condition,
        ],
      )
    ).rows;
    view.buttons.unshift(
      ...matches.map((m) => [
        {
          text: tr(
            row.state.locale,
            `Bestand aktualisieren: ${m.title}`,
            `Update existing offer: ${m.title}`,
          ),
          action: `existing:${m.id}`,
        },
      ]),
    );
  }
  return view;
};
export type BotRequest = {
  telegramId: string;
  chatId: string;
  updateId?: number;
  sessionId?: string;
  revision?: number;
  action: string;
  text?: string;
  name?: string;
  locale?: Locale;
  token?: string;
};
export const validateBotRequest = (input: unknown): BotRequest => {
  const b = input as BotRequest;
  if (
    !b ||
    typeof b !== 'object' ||
    !/^[1-9]\d{0,15}$/.test(b.telegramId) ||
    b.chatId !== b.telegramId ||
    typeof b.action !== 'string' ||
    b.action.length > 100 ||
    (b.text !== undefined &&
      (typeof b.text !== 'string' || b.text.length > 2000)) ||
    (b.sessionId !== undefined && !/^[a-f0-9-]{36}$/i.test(b.sessionId)) ||
    (b.revision !== undefined &&
      (!Number.isSafeInteger(b.revision) || b.revision < 1)) ||
    (b.updateId !== undefined &&
      (!Number.isSafeInteger(b.updateId) || b.updateId < 0))
  )
    throw new Error('invalid_input');
  return b;
};
export const handleBotAction = async (body: BotRequest): Promise<BotView> => {
  if (body.action === 'enroll') {
    await enroll(
      body.telegramId,
      body.token ?? '',
      body.name ?? '',
      body.locale === 'en' ? 'en' : 'de',
    );
    return {
      text: tr(
        body.locale ?? 'de',
        'Anfrage gespeichert. Der Inhaber muss deinen Zugang freigeben.',
        'Request saved. The owner must approve your access.',
      ),
      buttons: [],
      revision: 1,
    };
  }
  return withTransaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [
      `telegram:${body.telegramId}`,
    ]);
    const member = (
      await client.query(
        'SELECT * FROM telegram_product_members WHERE telegram_id=$1 FOR UPDATE',
        [body.telegramId],
      )
    ).rows[0];
    if (!member || member.status !== 'active')
      throw new Error('membership_required');
    await client.query(
      'UPDATE telegram_product_members SET last_seen_at=now() WHERE id=$1',
      [member.id],
    );
    const locale: Locale = member.locale;
    const mutations = !['status', 'resume', 'list'].includes(body.action);
    let replay = false;
    if (mutations) {
      if (body.updateId === undefined) throw new Error('update_id_required');
      const prior = (
        await client.query(
          'SELECT request_hash FROM telegram_product_updates WHERE telegram_id=$1 AND update_id=$2',
          [body.telegramId, body.updateId],
        )
      ).rows[0];
      const hash = digest(JSON.stringify(body));
      if (prior) {
        if (prior.request_hash !== hash) throw new Error('update_conflict');
        replay = true;
      } else {
        const count = (
          await client.query(
            `SELECT count(*)::int AS n FROM telegram_product_updates WHERE telegram_id=$1 AND created_at>now()-interval '1 minute'`,
            [body.telegramId],
          )
        ).rows[0].n;
        if (count >= 60) throw new Error('too_many_requests');
        await client.query(
          'INSERT INTO telegram_product_updates(telegram_id,update_id,request_hash) VALUES($1,$2,$3)',
          [body.telegramId, body.updateId, hash],
        );
      }
    }
    if (body.action === 'list') {
      const rows = (
        await client.query(
          `SELECT s.id,s.status,d.document->'shared'->>'title' AS title FROM telegram_product_sessions s JOIN smartphone_editor_drafts d ON d.id=s.draft_id WHERE s.member_id=$1 AND d.deleted_at IS NULL ORDER BY s.updated_at DESC LIMIT 20`,
          [member.id],
        )
      ).rows;
      return {
        text: tr(locale, 'Meine Entwürfe', 'My drafts'),
        revision: 1,
        buttons: [
          ...rows.map((r) => [
            {
              text: `${r.title || '…'} · ${r.status}`,
              action: `session:${r.id}`,
            },
          ]),
          [{ text: tr(locale, 'Neues Produkt', 'New product'), action: 'new' }],
        ],
      };
    }
    if (body.action.startsWith('language:')) {
      if (!['de', 'en'].includes(body.action.slice(9)))
        throw new Error('invalid_action');
      await client.query(
        'UPDATE telegram_product_members SET locale=$2 WHERE id=$1',
        [member.id, body.action.slice(9)],
      );
      return {
        text: body.action.endsWith('de')
          ? 'Deutsch gespeichert.'
          : 'English saved.',
        revision: 1,
        buttons: [[{ text: 'Start', action: 'new' }]],
      };
    }
    const requested = body.action.startsWith('session:')
      ? body.action.slice(8)
      : body.sessionId;
    let id = requested;
    if (!id)
      id = (
        await client.query(
          `SELECT id FROM telegram_product_sessions WHERE member_id=$1 ORDER BY (status IN ('collecting','changes_requested')) DESC,updated_at DESC LIMIT 1`,
          [member.id],
        )
      ).rows[0]?.id;
    if (['new','new_update'].includes(body.action) && !replay) {
      const open = (
        await client.query(
          `SELECT id,state FROM telegram_product_sessions WHERE member_id=$1 AND status IN ('collecting','changes_requested')`,
          [member.id],
        )
      ).rows[0];
      if (open) {
        if(body.action==='new_update' && !open.state?.existingMode)throw new Error('another_draft_is_open');
        id = open.id;
      }
      else {
        const initial = newConversation(locale);
        if(body.action==='new_update')initial.state.existingMode=true;
        const draft = (
          await client.query(
            'INSERT INTO smartphone_editor_drafts(document,created_by,updated_by) VALUES($1,$2,$2) RETURNING id',
            [JSON.stringify(initial.document), `telegram:${body.telegramId}`],
          )
        ).rows[0];
        const session = (
          await client.query(
            'INSERT INTO telegram_product_sessions(member_id,draft_id,state) VALUES($1,$2,$3) RETURNING id',
            [member.id, draft.id, JSON.stringify(initial.state)],
          )
        ).rows[0];
        initial.document.telegramSessionId = session.id;
        await client.query(
          'UPDATE smartphone_editor_drafts SET document=$2 WHERE id=$1',
          [draft.id, JSON.stringify(initial.document)],
        );
        id = session.id;
        await event(
          client,
          id!,
          `telegram:${body.telegramId}`,
          'session_created',
        );
      }
    }
    if (!id)
      return {
        text: tr(
          locale,
          'Willkommen bei Apfel Park.',
          'Welcome to Apfel Park.',
        ),
        revision: 1,
        buttons: [
          [
            {
              text: tr(locale, 'Produkt hinzufügen', 'Add product'),
              action: 'new',
            },
          ],
          [
            { text: 'Deutsch', action: 'language:de' },
            { text: 'English', action: 'language:en' },
          ],
        ],
      };
    const row = await readSession(client, id, true);
    if (row.member_id !== member.id) throw new Error('forbidden');
    row.state.locale = locale;
    if (
      replay ||
      ['new', 'new_update', 'status', 'resume'].includes(body.action) ||
      body.action.startsWith('session:')
    )
      return viewSession(client, row);
    if (body.action.startsWith('language:')) return viewSession(client, row);
    if (!['collecting', 'changes_requested'].includes(row.status))
      throw new Error('submission_locked');
    if (body.revision !== row.revision) throw new Error('stale_action');
    if (body.action === 'save')
      return {
        text: tr(
          locale,
          'Gespeichert. Mit /resume fortsetzen.',
          'Saved. Continue with /resume.',
        ),
        revision: row.revision,
        sessionId: row.id,
        buttons: [
          [{ text: tr(locale, 'Fortsetzen', 'Resume'), action: 'resume' }],
          [{ text: tr(locale, 'Meine Entwürfe', 'My drafts'), action: 'list' }],
        ],
      };
    if (body.action.startsWith('existing:')) {
      if(row.state.guided && !row.state.existingMode)throw new Error('invalid_action');
      if (
        row.state.stage !== 'versions' ||
        row.document.entries.length !== 1 ||
        row.document.entries[0].price ||
        row.document.entries[0].photos.some((p) => p.url)
      )
        throw new Error('invalid_action');
      const productId = body.action.slice(9);
      if (!/^[a-f0-9-]{36}$/i.test(productId)) throw new Error('invalid_input');
      const product = (
        await client.query(
          `SELECT id FROM products WHERE id=$1 AND lower(brand)=lower($2) AND lower(model)=lower($3) AND category=$4 AND condition=$5`,
          [
            productId,
            row.document.shared.brand,
            row.document.shared.model,
            row.document.shared.category,
            row.state.condition,
          ],
        )
      ).rows[0];
      if (!product) throw new Error('offer_not_found');
      const draft = await createPhoneDraftInTransaction(
        client,
        `telegram:${body.telegramId}`,
        productId,
        true,
      );
      if (draft.document.entries.length !== 1)
        throw new Error('legacy_offer_requires_admin');
      draft.document.telegramSessionId = row.id;
      draft.document.telegramUpdateOnly = true;
      row.state.entryId = draft.document.entries[0].id;
      row.state.updateOnly = true;
      row.state.stage = 'price';
      await client.query(
        'UPDATE smartphone_editor_drafts SET document=$2 WHERE id=$1',
        [draft.id, JSON.stringify(draft.document)],
      );
      await client.query(
        'UPDATE smartphone_editor_drafts SET deleted_at=now() WHERE id=$1',
        [row.draft_id],
      );
      await client.query(
        'UPDATE telegram_product_sessions SET draft_id=$2,state=$3,revision=revision+1,updated_at=now() WHERE id=$1',
        [id, draft.id, JSON.stringify(row.state)],
      );
      await event(
        client,
        id,
        `telegram:${body.telegramId}`,
        'existing_offer_selected',
        { productId },
      );
      return viewSession(client, await readSession(client, id));
    }
    if (body.action.startsWith('asset')) {
      if (row.state.stage !== 'photos') throw new Error('invalid_action');
      const [action, assetId] = body.action.split(':');
      if (!/^[a-f0-9-]{36}$/i.test(assetId ?? ''))
        throw new Error('invalid_action');
      if (action === 'assetRetry') {
        if (
          (
            await client.query(
              `SELECT count(*)::int AS n FROM telegram_product_jobs j JOIN telegram_product_sessions s ON s.id=j.session_id WHERE s.member_id=$1 AND j.kind='photo' AND j.created_at>now()-interval '1 day'`,
              [member.id],
            )
          ).rows[0].n >= 100
        )
          throw new Error('too_many_requests');
        const asset = (
          await client.query(
            `UPDATE telegram_product_assets SET status='queued' WHERE id=$1 AND session_id=$2 AND status IN ('ready','failed') RETURNING id`,
            [assetId, id],
          )
        ).rows[0];
        if (!asset) throw new Error('asset_not_ready');
        await client.query(
          `INSERT INTO telegram_product_jobs(session_id,kind,payload) VALUES($1,'photo',$2)`,
          [id, JSON.stringify({ assetId })],
        );
      } else if (action === 'assetUse' || action === 'assetOriginal')
        await acceptPhoto(
          client,
          id,
          assetId,
          action === 'assetUse',
          `telegram:${body.telegramId}`,
        );
      else throw new Error('invalid_action');
      await client.query(
        'UPDATE telegram_product_sessions SET revision=revision+1,updated_at=now() WHERE id=$1',
        [id],
      );
      return viewSession(client, await readSession(client, id));
    }
    if (
      (
        await client.query(
          `SELECT count(*)::int AS n FROM telegram_product_assets WHERE session_id=$1 AND status IN ('queued','ready')`,
          [id],
        )
      ).rows[0].n > 0 &&
      body.action === 'submit'
    )
      throw new Error('review_pending_photos');
    const result = transition(row.state, row.document, body,
      row.state.stage==='accessories' || row.state.stage==='accessory_custom' ? await readOfferPresets(client) : undefined);
    validateDocument(result.document);
    await client.query(
      `UPDATE smartphone_editor_drafts SET document=$2,revision=revision+1,updated_by=$3,updated_at=now() WHERE id=$1`,
      [
        row.draft_id,
        JSON.stringify(result.document),
        `telegram:${body.telegramId}`,
      ],
    );
    const status = result.submit
      ? 'submitted'
      : result.cancel
        ? 'cancelled'
        : row.status;
    await client.query(
      `UPDATE telegram_product_sessions SET state=$2,revision=revision+1,status=$3,updated_at=now(),submitted_at=CASE WHEN $3='submitted' THEN now() ELSE submitted_at END,submitted_revision=CASE WHEN $3='submitted' THEN $4 ELSE submitted_revision END WHERE id=$1`,
      [id, JSON.stringify(result.state), status, row.draft_revision + 1],
    );
    if (result.research) {
      const recent = (
        await client.query(
          `SELECT count(*)::int AS n FROM telegram_product_jobs j JOIN telegram_product_sessions s ON s.id=j.session_id WHERE s.member_id=$1 AND j.kind='research' AND j.created_at>now()-interval '1 hour'`,
          [member.id],
        )
      ).rows[0].n;
      if (recent >= 20) throw new Error('too_many_requests');
      const busy = (
        await client.query(
          `SELECT 1 FROM telegram_product_jobs WHERE session_id=$1 AND kind='research' AND status IN ('queued','processing') LIMIT 1`,
          [id],
        )
      ).rows.length;
      if (busy) throw new Error('research_in_progress');
      await client.query(
        `INSERT INTO telegram_product_jobs(session_id,kind,payload) VALUES($1,'research',$2)`,
        [
          id,
          JSON.stringify({
            query: `${result.document.shared.brand} ${result.document.shared.model}`,
            condition: result.state.condition,
            category: result.document.shared.category,
          }),
        ],
      );
    }
    if (result.submit || result.cancel)
      await event(
        client,
        id,
        `telegram:${body.telegramId}`,
        result.submit ? 'submitted' : 'cancelled',
        { revision: row.draft_revision + 1 },
      );
    if (result.cancel)
      await client.query(
        `UPDATE telegram_product_jobs SET status='cancelled',lease=null,lease_until=null WHERE session_id=$1 AND status IN ('queued','processing')`,
        [id],
      );
    return viewSession(client, await readSession(client, id));
  });
};

export const listTelegramSubmissions = async (history = false) => {
  if (!telegramProductsEnabled()) return [];
  const rows = (
    await query(
      `SELECT s.id,s.draft_id,s.status,s.review_note,s.updated_at,s.state,d.deleted_at IS NOT NULL AS archived,m.display_name,m.telegram_id::text,d.revision,d.document,d.results,coalesce((SELECT jsonb_agg(jsonb_build_object('id',a.id,'kind',a.kind,'edited',a.edited_path IS NOT NULL)) FROM telegram_product_assets a WHERE a.session_id=s.id AND a.safe_path IS NOT NULL),'[]'::jsonb) AS assets,coalesce((SELECT jsonb_agg(e) FROM (SELECT event_type,actor,created_at FROM telegram_product_events WHERE session_id=s.id ORDER BY created_at DESC LIMIT 20) e),'[]'::jsonb) AS events FROM telegram_product_sessions s JOIN telegram_product_members m ON m.id=s.member_id JOIN smartphone_editor_drafts d ON d.id=s.draft_id WHERE ${history ? "s.status IN ('published','rejected','cancelled')" : "d.deleted_at IS NULL AND s.status IN ('submitted','changes_requested')"} ORDER BY s.updated_at DESC LIMIT 100`,
    )
  ).rows;
  return rows.map((row) => ({
    ...row,
    blockers: telegramBlockers(row.document, row.state.locale),
  }));
};
