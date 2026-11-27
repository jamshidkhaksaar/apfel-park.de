"""Telegram transport. PostgreSQL owns drafts, research jobs and membership.
Only scoped signed requests go to the local application. Never log raw updates.
The old bot/state remain available for rollback via legacy_bot.py.
"""
from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import io
import json
import logging
import os
import re
import secrets
import sqlite3
import time
from pathlib import Path
from urllib.parse import urlparse

import httpx
from telegram import BotCommand, InlineKeyboardButton, InlineKeyboardMarkup, InputMediaPhoto, Update
from telegram.constants import ChatAction
from telegram.error import TelegramError
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, ContextTypes, MessageHandler, filters
from telegram.request import HTTPXRequest

BOT_TOKEN = os.environ['BOT_TOKEN']
API_URL = os.getenv('APFEL_API_URL', 'http://127.0.0.1:3000').rstrip('/')
KEY_ID = os.getenv('TELEGRAM_PRODUCT_KEY_ID', 'telegram-products')
SECRET = os.environ['TELEGRAM_PRODUCT_HMAC_SECRET']
DB = Path(os.getenv('TELEGRAM_CALLBACK_DB', '/data/product-callbacks.sqlite'))
PATH = '/api/integrations/telegram-products'
parsed = urlparse(API_URL)
if parsed.hostname not in {'127.0.0.1', 'localhost', '::1'} or parsed.scheme != 'http' or len(SECRET) < 32:
    raise RuntimeError('Local application URL and scoped HMAC credential required')
logging.getLogger('httpx').setLevel(logging.WARNING)
logging.getLogger('telegram').setLevel(logging.WARNING)
locks: dict[int, asyncio.Lock] = {}
watchers: dict[int, asyncio.Task] = {}
scan_mode: set[int] = set()
_api_client: httpx.AsyncClient | None = None
_TRANSIENT_HTTP_ERRORS = (httpx.ConnectError, httpx.ReadError, httpx.RemoteProtocolError, httpx.PoolTimeout)


def get_api_client() -> httpx.AsyncClient:
    global _api_client
    if _api_client is None or _api_client.is_closed:
        _api_client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0, connect=10.0),
            trust_env=False,
            limits=httpx.Limits(max_connections=16, max_keepalive_connections=8),
        )
    return _api_client


def connect() -> sqlite3.Connection:
    DB.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    con = sqlite3.connect(DB)
    DB.chmod(0o600)
    con.execute('CREATE TABLE IF NOT EXISTS callbacks (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, data TEXT NOT NULL, expires INTEGER NOT NULL)')
    con.execute('DELETE FROM callbacks WHERE expires < ?', (int(time.time()),))
    return con


def store_callback(user_id: int, payload: dict) -> str:
    token = secrets.token_urlsafe(18)
    with connect() as con:
        con.execute('INSERT INTO callbacks VALUES (?,?,?,?)', (token, user_id, json.dumps(payload), int(time.time()) + 3600))
    return token


def load_callback(user_id: int, token: str) -> dict | None:
    with connect() as con:
        row = con.execute('SELECT data FROM callbacks WHERE token=? AND user_id=? AND expires>?', (token, user_id, int(time.time()))).fetchone()
    return json.loads(row[0]) if row else None


async def invoke(payload: dict, photos: bool = False) -> dict:
    global _api_client
    payload = {key: value for key, value in payload.items() if value is not None}
    path = PATH + ('/photos' if photos else '')
    body = json.dumps(payload, separators=(',', ':'), ensure_ascii=False)
    stamp = str(int(time.time()))
    idem = f"telegram:{payload['telegramId']}:{payload.get('updateId', 'read')}"
    canonical = '\n'.join(['APFEL-PRODUCT-INTAKE-V1', KEY_ID, stamp, 'POST', path, idem, hashlib.sha256(body.encode()).hexdigest()])
    signature = hmac.new(SECRET.encode(), canonical.encode(), hashlib.sha256).hexdigest()
    headers = {
        'Content-Type': 'application/json',
        'x-apfel-intake-key-id': KEY_ID,
        'x-apfel-intake-timestamp': stamp,
        'x-apfel-intake-signature': signature,
        'idempotency-key': idem,
    }
    response = None
    for attempt in range(3):
        try:
            response = await get_api_client().post(API_URL + path, content=body.encode(), headers=headers)
            break
        except _TRANSIENT_HTTP_ERRORS:
            if _api_client and not _api_client.is_closed:
                await _api_client.aclose()
            _api_client = None
            if attempt == 2:
                raise
            await asyncio.sleep(0.25 * (attempt + 1))
    assert response is not None
    result = response.json()
    if response.status_code >= 400:
        raise ValueError(result.get('error', 'request_failed'))
    return result


def identity(update: Update) -> dict:
    if not update.effective_user or not update.effective_chat or update.effective_chat.type != 'private':
        raise ValueError('private_chat_required')
    return {'telegramId': str(update.effective_user.id), 'chatId': str(update.effective_chat.id), 'updateId': update.update_id}


async def show(context: ContextTypes.DEFAULT_TYPE, user_id: int, view: dict, previews: bool = True) -> None:
    if view.get('scanMode'):
        scan_mode.add(user_id)
    else:
        scan_mode.discard(user_id)
    previous = watchers.get(user_id)
    if previous and previous is not asyncio.current_task() and not view.get('workChat'):
        previous.cancel()
        watchers.pop(user_id, None)
    if view.get('gallery'):
        media = []
        for photo in view['gallery'][:6]:
            try:
                image = await invoke({'telegramId': str(user_id), 'chatId': str(user_id), 'action': 'preview',
                                      'sessionId': view['sessionId'], 'assetId': photo['id'], 'edited': photo['edited']}, photos=True)
                media.append(InputMediaPhoto(io.BytesIO(base64.b64decode(image['data'])), caption=photo.get('caption', '')[:200]))
            except (ValueError, httpx.HTTPError):
                pass
        if len(media) > 1:
            await context.bot.send_media_group(chat_id=user_id, media=media)
        elif media:
            await context.bot.send_photo(chat_id=user_id, photo=media[0].media, caption=media[0].caption)
    rows = [[InlineKeyboardButton(b['text'][:60], callback_data=store_callback(user_id, {
        'action': b['action'], 'sessionId': view.get('sessionId'), 'revision': view['revision'],
    })) for b in row] for row in view.get('buttons', [])]
    preview_failed = False
    if previews:
        for photo in view.get('photos', [])[:4]:
            # Older servers omit the flag; preserve compatibility during rollout.
            for edited in ((False, True) if photo.get('edited', True) else (False,)):
                try:
                    image = await invoke({'telegramId': str(user_id), 'chatId': str(user_id), 'action': 'preview',
                                          'sessionId': view['sessionId'], 'assetId': photo['id'], 'edited': edited}, photos=True)
                    await context.bot.send_photo(chat_id=user_id, photo=io.BytesIO(base64.b64decode(image['data'])),
                                                 caption=('✨ Studio · Bearbeitet / Edited' if edited else '📷 Original') + ' · ' + photo['id'][:8])
                except (ValueError, httpx.HTTPError, TelegramError):
                    preview_failed = True
    text = view['text']
    if preview_failed:
        text = ('⚠️ Fotovorschau konnte nicht geladen werden. Mit /resume erneut öffnen und vor der Auswahl beide Bilder prüfen.\n\n' if view.get('locale') == 'de' else '⚠️ A photo preview could not be loaded. Use /resume to reopen it and inspect both images before choosing.\n\n') + text
        # Never offer approval for a comparison that could not be delivered.
        rows = [[button for button in row if not (load_callback(user_id, button.callback_data) or {}).get('action', '').startswith(('assetUse:', 'assetOriginal:'))] for row in rows]
        rows = [row for row in rows if row]
    markup = InlineKeyboardMarkup(rows)
    if view.get('scanPhoto'):
        try:
            await context.bot.send_photo(
                chat_id=user_id,
                photo=io.BytesIO(base64.b64decode(view['scanPhoto'])),
                caption=text[:1000],
                reply_markup=markup,
            )
            return
        except TelegramError:
            pass
    sent = await context.bot.send_message(chat_id=user_id, text=text[:4000], reply_markup=markup)
    if view.get('pending') and user_id not in watchers:
        watchers[user_id] = asyncio.create_task(watch(context, user_id, view, sent.message_id, markup))


async def watch(context: ContextTypes.DEFAULT_TYPE, user_id: int, initial: dict, message_id: int, markup: InlineKeyboardMarkup) -> None:
    started = time.monotonic()
    frames = ['⏳', '⌛']
    consecutive_errors = 0
    try:
        for tick in range(90):
            await asyncio.sleep(3)
            try:
                async with locks.setdefault(user_id, asyncio.Lock()):
                    view = await invoke({'telegramId': str(user_id), 'chatId': str(user_id), 'sessionId': initial['sessionId'], 'action': 'status'})
                    consecutive_errors = 0
                    if not view.get('pending'):
                        try:
                            await context.bot.edit_message_text(chat_id=user_id, message_id=message_id, text=('⏹ Neuer Stand unten.' if initial.get('locale') == 'de' else '⏹ Latest result below.'), reply_markup=None)
                        except TelegramError:
                            pass
                        await show(context, user_id, view)
                        return
                    try:
                        await context.bot.send_chat_action(chat_id=user_id, action=ChatAction.TYPING)
                        await context.bot.edit_message_text(chat_id=user_id, message_id=message_id,
                            text=f"{frames[tick % 2]} {int(time.monotonic() - started)} s\n\n{view['text']}"[:4000], reply_markup=markup)
                    except TelegramError:
                        # Progress delivery must never cancel the durable backend job.
                        pass
            except httpx.HTTPError:
                consecutive_errors += 1
                if consecutive_errors >= 5:
                    raise
                await asyncio.sleep(2)
        await context.bot.send_message(chat_id=user_id, text='Die Verarbeitung läuft weiter. Mit /resume prüfen. / Processing continues. Use /resume to check.')
    except ValueError:
        pass
    except httpx.HTTPError:
        try:
            await context.bot.send_message(chat_id=user_id, text='Verbindung kurz unterbrochen. Status mit /resume prüfen. / Connection briefly interrupted. Check status with /resume.')
        except TelegramError:
            pass
    finally:
        if watchers.get(user_id) is asyncio.current_task():
            watchers.pop(user_id, None)


async def failure(update: Update, context: ContextTypes.DEFAULT_TYPE, error: Exception) -> None:
    code = str(error) if isinstance(error, ValueError) else 'connection_failed'
    messages = {
        'another_draft_is_open': 'Ein Entwurf ist offen. /resume oder /cancel verwenden. / A draft is open. Use /resume or /cancel first.',
        'membership_required': 'Einladung und Inhaberfreigabe erforderlich. / Access needs an invitation and owner approval.',
        'invalid_invite': 'Einladung ungültig oder abgelaufen. / Invitation invalid or expired.',
        'already_enrolled': 'Bereits registriert. Inhaber kontaktieren. / Already registered. Contact the owner.',
        'submission_locked': 'Entwurf zur Prüfung gesendet. / Draft submitted for review.',
        'stale_action': 'Ansicht veraltet. Bitte /resume. / View changed. Use /resume.',
        'private_or_invalid_input': 'Keine IMEI, Seriennummern oder privaten Angaben senden. / Do not send IMEI, serial numbers or private data.',
        'photo_wait_for_review': 'Bitte zuerst dieses Foto prüfen. Danach folgt die nächste Seite. / Approve this photo first; then send the next side.',
        'select_accessories_or_none': 'Zubehör auswählen oder Kein Zubehör drücken. / Select accessories or tap No accessories.',
        'invalid_battery': 'Batteriekapazität von 1 bis 100 (oder Bereich z. B. 95-100) eingeben. / Enter battery health from 1 to 100 (or range like 95-100).',
        'photo_invalid': 'JPEG, PNG oder WebP bis 8 MB senden. / Send JPEG, PNG or WebP up to 8 MB.',
        'review_pending_photos': 'Fotovorschauen zuerst prüfen. / Review pending photo previews first.',
        'invalid_price': 'Preis z. B. 699,90 eingeben. / Enter a price such as 699.90.',
        'invalid_quantity': 'Ganze Menge ab 0 eingeben. / Enter a whole quantity of zero or more.',
        'invalid_gtin': 'EAN-Prüfziffer ungültig. / Invalid EAN checksum.',
        'configuration_format': 'Je Zeile Merkmal: Wert. / Enter one Attribute: Value per line.',
        'invalid_input': 'Aktion nicht möglich. Mit /new neu starten. / Action not possible. Start again with /new.',
        'session_not_found': 'Entwurf nicht gefunden. Mit /new neu starten. / Draft not found. Start again with /new.',
        'connection_failed': 'Verbindung fehlgeschlagen. Bitte kurz warten und erneut versuchen. / Connection failed. Please wait and retry.',
        'research_rate_limited': 'Gemini ist momentan ausgelastet. Bitte die Frage später erneut senden. / Gemini is rate limited. Please retry your question later.',
        'photo_quality_unavailable': 'KI-Antwort konnte nicht sicher geprüft werden. Es wurde nichts geändert. / The AI reply could not be verified. Nothing was changed.',
        'photo_identity_rejected': 'Bearbeitung verändert das Gerät oder enthält Artefakte. Bitte Original prüfen oder erneut verarbeiten. / Editing changed the device or introduced artifacts. Review the original or reprocess.',
        'photo_source_missing': 'Originalfotos fehlen. Bitte erneut hochladen. / Original photos are unavailable. Please upload them again.',
    }
    await context.bot.send_message(chat_id=update.effective_user.id, text=messages.get(code, 'Eingabe nicht übernommen. /resume und erneut versuchen. / Input was not applied. Use /resume and retry.'))


async def command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    payload = identity(update)
    user_id = update.effective_user.id
    async with locks.setdefault(user_id, asyncio.Lock()):
        try:
            name = update.message.text.split()[0].split('@')[0]
            if name in {'/chat', '/ask'}:
                text = ' '.join(context.args).strip()
                if not text:
                    await context.bot.send_message(chat_id=user_id, text='/chat Frage zum Produkt oder zur Fotokorrektur / question about this product or a photo correction')
                    return
                view = await invoke({**payload, 'action': 'status'})
                await show(context, user_id, await invoke({**payload, 'action': 'chat', 'text': text, 'sessionId': view.get('sessionId')}), previews=False)
                return
            if name in {'/scan', '/sold'}:
                arg = ' '.join(context.args).strip()
                if arg:
                    await show(context, user_id, await invoke({**payload, 'action': 'scan_lookup', 'text': arg}))
                else:
                    await show(context, user_id, await invoke({**payload, 'action': 'scan_menu'}))
                return
            scan_mode.discard(user_id)
            payload['action'] = {'/menu': 'menu', '/new': 'new', '/update': 'new_update', '/drafts': 'list', '/cancel': 'cancel'}.get(name, 'resume')
            if name == '/start' and context.args:
                payload.update(action='enroll', token=context.args[0], name=update.effective_user.full_name,
                               locale='en' if update.effective_user.language_code == 'en' else 'de')
            elif name == '/language':
                if context.args and context.args[0] in {'de', 'en'}:
                    payload['action'] = 'language:' + context.args[0]
                else:
                    await context.bot.send_message(chat_id=user_id, text='/language de · /language en')
                    return
            elif name == '/cancel':
                view = await invoke({**payload, 'action': 'status'})
                payload.update(sessionId=view.get('sessionId'), revision=view['revision'])
            await show(context, user_id, await invoke(payload))
        except (ValueError, httpx.HTTPError) as error:
            await failure(update, context, error)


async def callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.callback_query.answer()
    payload = identity(update)
    user_id = update.effective_user.id
    async with locks.setdefault(user_id, asyncio.Lock()):
        try:
            action = load_callback(user_id, update.callback_query.data)
            if not action:
                raise ValueError('stale_action')
            await show(context, user_id, await invoke({**payload, **action}))
        except (ValueError, httpx.HTTPError) as error:
            await failure(update, context, error)


async def message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    payload = identity(update)
    user_id = update.effective_user.id
    async with locks.setdefault(user_id, asyncio.Lock()):
        try:
            media = update.message.photo[-1] if update.message.photo else update.message.document
            if user_id in scan_mode:
                if media:
                    if not media.file_size or media.file_size > 8 * 1024 * 1024:
                        raise ValueError('photo_invalid')
                    data = await (await context.bot.get_file(media.file_id)).download_as_bytearray()
                    view = await invoke({**payload, 'action': 'scan_photo', 'data': base64.b64encode(data).decode()}, photos=True)
                else:
                    view = await invoke({**payload, 'action': 'scan_lookup', 'text': update.message.text or ''})
                await show(context, user_id, view)
                return
            view = await invoke({**payload, 'action': 'status'})
            payload.update(sessionId=view.get('sessionId'), revision=view['revision'])
            if media:
                if not media.file_size or media.file_size > 8 * 1024 * 1024:
                    raise ValueError('photo_invalid')
                data = await (await context.bot.get_file(media.file_id)).download_as_bytearray()
                view = await invoke({**payload, 'action': 'upload', 'data': base64.b64encode(data).decode()}, photos=True)
            else:
                text = update.message.text or ''
                conversational = view.get('workflowStage') in {'photos', 'review', 'researching', 'edit_menu'} or bool(re.match(r'^(?:please\b|can you\b|could you\b|why\b|how\b|help\b|fix\b|correct\b|redo\b|remember\b|learn\b|bitte\b|kannst\b|warum\b|wie\b|hilfe\b|korrigier|verbesser|merke\b)', text.strip(), re.I))
                view = await invoke({**payload, 'action': 'chat' if conversational else 'text', 'text': text})
            await show(context, user_id, view)
        except (ValueError, httpx.HTTPError) as error:
            await failure(update, context, error)


# A bare "failed" line makes an incident undiagnosable, so the cause is logged
# too. Known secrets are scrubbed verbatim and anything token-, HMAC- or
# signature-shaped is scrubbed by shape: httpx error strings embed the request
# URL, and a Telegram URL carries the bot token in its path.
_CREDENTIALS = tuple(credential for credential in (BOT_TOKEN, SECRET) if len(credential) >= 8)
_CREDENTIAL_PATTERNS = (
    re.compile(r'\d{6,}:[A-Za-z0-9_-]{30,}'),  # bot token, bare or inside a URL
    re.compile(r'\b[0-9a-fA-F]{32,}\b'),  # HMAC secrets and request signatures
    re.compile(r'(?i)\b(?:bearer|authorization)\s+\S+'),
)


def redact(error: BaseException, limit: int = 300) -> str:
    text = f'{type(error).__name__}: {error}'
    for credential in _CREDENTIALS:
        text = text.replace(credential, '[redacted]')
    for pattern in _CREDENTIAL_PATTERNS:
        text = pattern.sub('[redacted]', text)
    text = ' '.join(text.split())
    return text if len(text) <= limit else text[:limit] + '…'


def update_kind(update: object) -> str:
    if isinstance(update, Update):
        for name in ('callback_query', 'message', 'edited_message', 'inline_query'):
            if getattr(update, name, None):
                return name
    return 'unknown'


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    reason = redact(context.error) if context.error else 'no exception recorded'
    logging.error('Telegram product transport failed; update contents and credentials suppressed (%s) reason=%s',
                  update_kind(update), reason)


async def post_init(app: Application) -> None:
    try:
        await app.bot.set_my_commands([
            BotCommand('menu', 'Main menu / Hauptmenü'),
            BotCommand('scan', 'Scan barcode & mark sold (-1)'),
            BotCommand('new', 'Add new product'),
            BotCommand('update', 'Update stock or price'),
            BotCommand('drafts', 'My product drafts'),
            BotCommand('resume', 'Resume open draft'),
            BotCommand('language', 'Switch language (de/en)'),
            BotCommand('chat', 'Ask product assistant'),
            BotCommand('cancel', 'Cancel open draft'),
        ])
    except TelegramError:
        pass


async def post_shutdown(_app: Application) -> None:
    if _api_client and not _api_client.is_closed:
        await _api_client.aclose()


def main() -> None:
    request = HTTPXRequest(
        connection_pool_size=8,
        connect_timeout=10.0,
        read_timeout=20.0,
        write_timeout=20.0,
        pool_timeout=5.0,
    )
    get_updates_request = HTTPXRequest(
        connection_pool_size=2,
        connect_timeout=10.0,
        read_timeout=35.0,
        pool_timeout=5.0,
    )
    app = (
        Application.builder()
        .token(BOT_TOKEN)
        .request(request)
        .get_updates_request(get_updates_request)
        .post_init(post_init)
        .post_shutdown(post_shutdown)
        .build()
    )
    app.add_handler(CommandHandler(['start', 'menu', 'scan', 'sold', 'new', 'update', 'resume', 'drafts', 'language', 'cancel', 'chat', 'ask'], command, filters=filters.ChatType.PRIVATE))
    app.add_handler(CallbackQueryHandler(callback))
    app.add_handler(MessageHandler(filters.ChatType.PRIVATE & (filters.PHOTO | filters.Document.IMAGE | (filters.TEXT & ~filters.COMMAND)), message))
    app.add_error_handler(error_handler)
    app.run_polling(allowed_updates=['message', 'callback_query'], drop_pending_updates=False, timeout=25, bootstrap_retries=-1)


if __name__ == '__main__':
    main()
