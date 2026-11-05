from __future__ import annotations

import hashlib
import hmac
import json
import math
import os
import re
import sqlite3
import time
import uuid
from pathlib import Path

import httpx
from telegram import KeyboardButton, ReplyKeyboardMarkup, Update
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

BOT_TOKEN = os.environ["BOT_TOKEN"]
OWNER_ID = int(os.environ["OWNER_CHAT_ID"])
ALLOWED = {int(value) for value in os.getenv("ALLOWED_USER_IDS", str(OWNER_ID)).split(",") if value.strip()}
N8N_URL = os.getenv("N8N_INTAKE_URL", "http://host.docker.internal:5678/webhook/apfel-intake-v2")
N8N_KEY_ID = os.getenv("N8N_INTAKE_KEY_ID", "safi-bot")
N8N_SECRET = os.environ["N8N_INTAKE_HMAC_SECRET"]
VISION_URL = os.getenv("VISION_URL", "http://host.docker.internal:8730")
VISION_TOKEN = os.environ["VISION_TOKEN"]
DB = Path("/data/intake.sqlite")
UPLOAD_ROOT = Path("/srv/apfel-intake/submissions")
SENSITIVE_PAYLOAD = re.compile(r'"(?:imei|eid|serial(?:[_-]?number)?|serien(?:[_ -]?(?:nummer|nr))?)"\s*:|(?:imei|eid|serial|serien\s*(?:nummer|nr))\s*[:=#-]?\s*[a-z0-9 -]{6,}|(^|\D)\d{15}(\D|$)|(^|\D)\d{32}(\D|$)', re.I)

NEW = "➕ Neu / جدید"
UPDATE = "🔄 Aktualisieren / تجدید"
SEALED = "📦 Versiegelt / بسته"
OPEN_BOX = "📭 Open-Box / باز"
USED = "♻️ Gebraucht / استفاده‌شده"
SET_TOTAL = "= Gesamtbestand / موجودی کل"
ADD_STOCK = "+ Lieferung / افزودن"
ONE_UNIT = "1 Stück / ۱ عدد"
CONFIRM_IDENTICAL = "✅ Identisch bestätigt / یکسان است"
BARCODE = "🏷 Barcode"
ABOUT = "ℹ️ About"
BATTERY = "🔋 Battery"
PHOTOS = "📸 Gerät / دستگاه"
PACKAGING = "📦 Verpackung / بسته‌بندی"
FRONT = "Vorne / جلو"
BACK = "Hinten / پشت"
SCREEN = "Display / صفحه"
FRAME = "Rahmen / قاب"
SUBMIT = "✅ Senden / ارسال"
CANCEL = "❌ Abbrechen / لغو"


def connect() -> sqlite3.Connection:
    DB.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB)
    con.execute("pragma secure_delete=on")
    con.execute("create table if not exists sessions (user_id integer primary key, data text not null, updated_at integer not null)")
    return con


def load(user_id: int) -> dict:
    with connect() as con:
        row = con.execute("select data,updated_at from sessions where user_id=?", (user_id,)).fetchone()
        if row and int(row[1]) < int(time.time()) - 24 * 3600:
            con.execute("delete from sessions where user_id=?", (user_id,))
            row = None
    if not row:
        return {}
    if SENSITIVE_PAYLOAD.search(row[0]):
        clear(user_id)
        return {}
    return json.loads(row[0])


def save(user_id: int, data: dict) -> None:
    encoded = canonical_json(data)
    if SENSITIVE_PAYLOAD.search(encoded):
        raise ValueError("refusing to persist sensitive device identifiers")
    with connect() as con:
        con.execute(
            "insert into sessions(user_id,data,updated_at) values(?,?,?) on conflict(user_id) do update set data=excluded.data,updated_at=excluded.updated_at",
            (user_id, encoded, int(time.time())),
        )


def clear(user_id: int) -> None:
    with connect() as con:
        con.execute("delete from sessions where user_id=?", (user_id,))


def keyboard(rows: list[list[str]]) -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup([[KeyboardButton(value) for value in row] for row in rows], resize_keyboard=True)


def clean_number(text: str, integer: bool = False) -> float | int | None:
    translated = text.translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789"))
    try:
        value = float(translated.replace(",", ".").replace("€", "").strip())
        if not math.isfinite(value):
            return None
        return int(value) if integer and value.is_integer() else value if not integer else None
    except ValueError:
        return None


def valid_gtin(value: str) -> bool:
    digits = re.sub(r"\D", "", value)
    if len(digits) not in {8, 12, 13, 14}:
        return False
    total = sum(int(digit) * (3 if offset % 2 else 1) for offset, digit in enumerate(reversed(digits[:-1]), start=1))
    return (10 - total % 10) % 10 == int(digits[-1])


def hmac_headers(body: str, path: str) -> dict[str, str]:
    timestamp = str(int(time.time()))
    idem = f"safi:{hashlib.sha256(body.encode()).hexdigest()[:32]}"
    canonical = "\n".join([
        "APFEL-PRODUCT-INTAKE-V1", N8N_KEY_ID, timestamp, "POST", path, idem,
        hashlib.sha256(body.encode()).hexdigest(),
    ])
    signature = hmac.new(N8N_SECRET.encode(), canonical.encode(), hashlib.sha256).hexdigest()
    return {
        "Content-Type": "application/json",
        "X-Apfel-Intake-Key-Id": N8N_KEY_ID,
        "X-Apfel-Intake-Timestamp": timestamp,
        "X-Apfel-Intake-Signature": signature,
        "Idempotency-Key": idem,
    }


def canonical_json(value: object) -> str:
    def normalize(entry: object) -> object:
        if isinstance(entry, float) and entry.is_integer():
            return int(entry)
        if isinstance(entry, dict):
            return {key: normalize(item) for key, item in entry.items()}
        if isinstance(entry, list):
            return [normalize(item) for item in entry]
        return entry
    return json.dumps(normalize(value), ensure_ascii=False, separators=(",", ":"))


def menu() -> ReplyKeyboardMarkup:
    return keyboard([[NEW, UPDATE], [CANCEL]])


def asset_menu() -> ReplyKeyboardMarkup:
    return keyboard([[BARCODE, ABOUT], [BATTERY, PHOTOS], [PACKAGING], [SUBMIT, CANCEL]])


async def continue_after_quantity(update: Update, state: dict) -> None:
    if state.get("condition") in {"open_box", "used"}:
        state["stage"] = "condition_note"
        save(update.effective_user.id, state)
        await update.message.reply_text(
            "Kosmetischen Zustand genau beschreiben (Kratzer, Dellen, Display):\n"
            "وضعیت ظاهری را دقیق بنویسید:"
        )
        return
    state["stage"] = "gtin"
    save(update.effective_user.id, state)
    await update.message.reply_text("GTIN/EAN eingeben oder '-' wenn nur Barcodefoto folgt:")


async def start(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not user or user.id not in ALLOWED:
        return
    clear(user.id)
    await update.message.reply_text(
        "Apfel Park Produkt-Intake\nورود محصول اپل پارک\n\nNeu hinzufügen oder Bestand/Preis aktualisieren?",
        reply_markup=menu(),
    )


async def text_handler(update: Update, _: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not user or user.id not in ALLOWED or not update.message:
        return
    text = update.message.text.strip()
    if SENSITIVE_PAYLOAD.search(canonical_json({"text": text})):
        clear(user.id)
        await update.message.reply_text(
            "IMEI, Seriennummer oder EID wurde erkannt und nicht gespeichert. Bitte Intake neu starten und sensible Felder entfernen.",
            reply_markup=menu(),
        )
        return
    state = load(user.id)
    if text == CANCEL:
        clear(user.id)
        await update.message.reply_text("Abgebrochen / لغو شد", reply_markup=menu())
        return
    if text in {NEW, UPDATE}:
        state = {
            "runId": f"APF-{uuid.uuid4().hex[:8].upper()}",
            "intent": "add" if text == NEW else "update",
            "stage": "condition",
            "assets": [],
        }
        save(user.id, state)
        await update.message.reply_text(
            "Zuerst Zustand wählen / اول حالت دستگاه را انتخاب کنید:",
            reply_markup=keyboard([[SEALED], [OPEN_BOX], [USED], [CANCEL]]),
        )
        return
    if not state:
        await start(update, _)
        return
    stage = state.get("stage")
    if stage == "condition" and text in {SEALED, OPEN_BOX, USED}:
        state["condition"] = {SEALED: "sealed", OPEN_BOX: "open_box", USED: "used"}[text]
        state["stage"] = "model"
        save(user.id, state)
        await update.message.reply_text("Marke + Modell + Speicher + Farbe?\nبرند، مدل، حافظه و رنگ؟")
    elif stage == "model":
        state["modelInput"] = text[:240]
        state["stage"] = "price"
        save(user.id, state)
        await update.message.reply_text("Verkaufspreis in EUR?\nقیمت فروش به یورو؟")
    elif stage == "price":
        price = clean_number(text)
        if price is None or price <= 0:
            await update.message.reply_text("Bitte gültigen Preis senden / قیمت معتبر")
            return
        state["price"] = price
        if state["intent"] == "update":
            state["stage"] = "quantity_mode"
            save(user.id, state)
            await update.message.reply_text("Menge setzen oder Lieferung hinzufügen?", reply_markup=keyboard([[SET_TOTAL], [ADD_STOCK], [CANCEL]]))
        else:
            state["quantityMode"] = "set"
            state["stage"] = "quantity"
            save(user.id, state)
            prompt = "Stückzahl? / تعداد؟"
            markup = keyboard([[ONE_UNIT], [CANCEL]]) if state.get("condition") in {"open_box", "used"} else None
            await update.message.reply_text(prompt, reply_markup=markup)
    elif stage == "quantity_mode" and text in {SET_TOTAL, ADD_STOCK}:
        state["quantityMode"] = "set" if text == SET_TOTAL else "add"
        state["stage"] = "quantity"
        save(user.id, state)
        markup = keyboard([[ONE_UNIT], [CANCEL]]) if state.get("condition") in {"open_box", "used"} else None
        await update.message.reply_text("Stückzahl? / تعداد؟", reply_markup=markup)
    elif stage == "quantity":
        quantity = 1 if text == ONE_UNIT else clean_number(text, integer=True)
        minimum = 0 if state.get("intent") == "update" and state.get("quantityMode") == "set" else 1
        if quantity is None or quantity < minimum:
            await update.message.reply_text("Bitte ganze Stückzahl senden / تعداد صحیح")
            return
        state["quantity"] = quantity
        if state.get("condition") in {"open_box", "used"} and quantity > 1:
            state["stage"] = "quantity_confirmation"
            save(user.id, state)
            await update.message.reply_text(
                "Mehrere Open-Box/Gebraucht-Geräte dürfen nur zusammengeführt werden, wenn Modell, Farbe, Speicher und Zustand identisch sind.",
                reply_markup=keyboard([[CONFIRM_IDENTICAL], [CANCEL]]),
            )
        else:
            await continue_after_quantity(update, state)
    elif stage == "quantity_confirmation" and text == CONFIRM_IDENTICAL:
        state["multiUnitConfirmed"] = True
        await continue_after_quantity(update, state)
    elif stage == "condition_note":
        state["conditionNote"] = text[:1000]
        state["stage"] = "functional_condition"
        save(user.id, state)
        await update.message.reply_text(
            "Funktionstest: Was wurde geprüft, und gibt es Fehler?\n"
            "آزمایش عملکرد و عیب‌ها را بنویسید:"
        )
    elif stage == "functional_condition":
        state["functionalCondition"] = text[:1000]
        state["stage"] = "accessories"
        save(user.id, state)
        await update.message.reply_text(
            "Mitgeliefertes Zubehör auflisten; 'keins' schreiben, falls nichts enthalten ist.\n"
            "لوازم همراه را بنویسید؛ اگر نیست، بنویسید هیچ."
        )
    elif stage == "accessories":
        state["includedAccessories"] = text[:500]
        state["stage"] = "gtin"
        save(user.id, state)
        await update.message.reply_text("GTIN/EAN eingeben oder '-' wenn nur Barcodefoto folgt:")
    elif stage == "gtin":
        gtin = "" if text == "-" else re.sub(r"\D", "", text)[:20]
        if gtin and not valid_gtin(gtin):
            await update.message.reply_text("GTIN-Prüfziffer ist ungültig. Bitte Barcode erneut prüfen oder '-' senden.")
            return
        state["gtin"] = gtin
        state["stage"] = "mpn"
        save(user.id, state)
        await update.message.reply_text("MPN/Modellnummer eingeben oder '-':")
    elif stage == "mpn":
        state["mpn"] = "" if text == "-" else text[:120]
        state["stage"] = "assets"
        save(user.id, state)
        await update.message.reply_text(
            "Fotos hinzufügen. Bei About/Barcode bitte IMEI, Seriennummer und EID möglichst vorher zuschneiden.\n"
            "عکس‌ها را اضافه کنید؛ IMEI و سریال را تا حد ممکن حذف کنید.",
            reply_markup=asset_menu(),
        )
    elif stage == "assets" and text == PHOTOS:
        state["awaitingPhotoView"] = True
        save(user.id, state)
        await update.message.reply_text(
            "Ansicht wählen / زاویه عکس:",
            reply_markup=keyboard([[FRONT, BACK], [SCREEN, FRAME], [CANCEL]]),
        )
    elif stage == "assets" and state.get("awaitingPhotoView") and text in {FRONT, BACK, SCREEN, FRAME}:
        state["assetMode"] = "condition_photo"
        state["assetView"] = {FRONT: "front", BACK: "back", SCREEN: "screen", FRAME: "frame"}[text]
        state.pop("awaitingPhotoView", None)
        save(user.id, state)
        await update.message.reply_text("Jetzt das Foto senden / حالا عکس را بفرستید", reply_markup=asset_menu())
    elif stage == "assets" and text in {BARCODE, ABOUT, BATTERY, PACKAGING}:
        state["assetMode"] = {BARCODE: "barcode_label", ABOUT: "about_screen", BATTERY: "battery_health", PACKAGING: "packaging"}[text]
        save(user.id, state)
        await update.message.reply_text("Jetzt das Foto senden / حالا عکس را بفرستید", reply_markup=asset_menu())
    elif stage == "assets" and text == SUBMIT:
        await submit(update, state, _)
    else:
        await update.message.reply_text("Bitte den aktuellen Schritt beantworten / لطفاً مرحله فعلی را پاسخ دهید")


async def photo_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not user or user.id not in ALLOWED or not update.message:
        return
    document = update.message.document
    if update.message.photo:
        telegram_media = update.message.photo[-1]
        suffix = ".jpg"
        mime_type = "image/jpeg"
    elif document and (document.mime_type or "").startswith("image/"):
        telegram_media = document
        suffix = Path(document.file_name or "image.jpg").suffix.lower()
        if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
            suffix = ".jpg"
        mime_type = document.mime_type or "image/jpeg"
    else:
        return
    state = load(user.id)
    if state.get("stage") != "assets" or not state.get("assetMode"):
        await update.message.reply_text("Zuerst Fotoart wählen / اول نوع عکس را انتخاب کنید", reply_markup=asset_menu())
        return
    run_dir = UPLOAD_ROOT / state["runId"]
    run_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    path = run_dir / f"{state['assetMode']}-{len(state['assets'])}{suffix}"
    try:
        telegram_file = await context.bot.get_file(telegram_media.file_id)
        await telegram_file.download_to_drive(path)
        path.chmod(0o600)
        async with httpx.AsyncClient(timeout=120) as client:
            with path.open("rb") as handle:
                response = await client.post(
                    f"{VISION_URL}/extract",
                    headers={"X-Vision-Token": VISION_TOKEN},
                    data={"run_id": state["runId"], "asset_type": state["assetMode"]},
                    files={"image": (path.name, handle, mime_type)},
                )
        response.raise_for_status()
        extraction = response.json()
    except (OSError, ValueError, httpx.HTTPError):
        await update.message.reply_text("Foto konnte nicht sicher gelesen werden. Bitte erneut und schärfer senden.")
        return
    finally:
        path.unlink(missing_ok=True)
    if SENSITIVE_PAYLOAD.search(canonical_json(extraction)):
        await update.message.reply_text("Das Bildresultat enthält sensible Daten und wurde verworfen. Bitte sensible Felder zuschneiden.")
        return
    state["assets"].append({
        "type": state["assetMode"],
        "view": state.get("assetView"),
        "extraction": extraction,
    })
    state.pop("assetMode", None)
    state.pop("assetView", None)
    save(user.id, state)
    await update.message.reply_text(f"✅ Foto gespeichert ({len(state['assets'])})", reply_markup=asset_menu())


def validate_submission(state: dict) -> list[str]:
    types = {asset["type"] for asset in state.get("assets", [])}
    views = {asset.get("view") for asset in state.get("assets", []) if asset["type"] == "condition_photo"}
    missing: list[str] = []
    def safe_asset(asset_type: str) -> bool:
        return any(
            asset["type"] == asset_type and asset["extraction"].get("privacyScanPassed") is True
            for asset in state.get("assets", [])
        )
    if state.get("condition") == "sealed" and "barcode_label" not in types:
        missing.append("Barcodefoto")
    elif state.get("condition") == "sealed" and not safe_asset("barcode_label"):
        missing.append("sicher redigiertes Barcodefoto")
    if state.get("condition") in {"open_box", "used"}:
        if "about_screen" not in types or not safe_asset("about_screen"):
            missing.append("About-Screenshot")
        required_views = {"front", "back"} if state.get("condition") == "open_box" else {"front", "back", "screen", "frame"}
        absent_views = sorted(required_views - views)
        if absent_views:
            missing.append("echte Gerätefotos: " + ", ".join(absent_views))
        if not state.get("conditionNote"):
            missing.append("Zustandsbeschreibung")
        if not state.get("functionalCondition"):
            missing.append("Funktionstest")
        if not state.get("includedAccessories"):
            missing.append("Zubehörangabe")
        if state.get("quantity", 1) > 1 and not state.get("multiUnitConfirmed"):
            missing.append("Bestätigung identischer Geräte")
    if state.get("condition") == "used" and "iphone" in state.get("modelInput", "").lower() and (
        "battery_health" not in types or not safe_asset("battery_health")
    ):
        missing.append("Battery-Health-Screenshot")
    if state.get("condition") == "sealed" and not state.get("gtin") and not state.get("mpn"):
        decoded = [candidate for asset in state.get("assets", []) for candidate in asset["extraction"].get("gtinCandidates", [])]
        if not any(candidate.get("checksumValid") is True and candidate.get("autoAccept") is True for candidate in decoded):
            missing.append("gültige GTIN oder MPN")
    return missing


def media_asset_key(value: str) -> str:
    prefix = "/srv/n8n/media/"
    if not value.startswith(prefix):
        raise ValueError("vision service returned an unexpected media path")
    key = value[len(prefix):]
    if not key or ".." in key.split("/"):
        raise ValueError("vision service returned an unsafe media path")
    return key


def asset_records(state: dict) -> list[dict]:
    records: list[dict] = []
    primary_assigned = False
    for index, uploaded in enumerate(state.get("assets", [])):
        extraction = uploaded["extraction"]
        asset_type = uploaded["type"]
        safe_metadata = {
            key: value for key, value in extraction.items()
            if key not in {"redactedPath", "publishPath", "barcodeCropPath", "solVisionPrompt", "runId", "success"}
        }
        safe_metadata["assetType"] = asset_type
        if uploaded.get("view"):
            safe_metadata["view"] = uploaded["view"]

        if asset_type in {"condition_photo", "packaging"} and extraction.get("publishPath") and extraction.get("privacyScanPassed") is True:
            metadata = {
                **safe_metadata,
                "exactItem": True,
                "publishable": True,
                "isPrimary": not primary_assigned and (
                    uploaded.get("view") == "front"
                    or (asset_type == "packaging" and state.get("condition") == "sealed")
                ),
            }
            primary_assigned = primary_assigned or metadata["isPrimary"]
            records.append({
                "assetKey": media_asset_key(extraction["publishPath"]),
                "kind": "shop_photo",
                "sha256": extraction["publishSha256"],
                "contentType": "image/webp",
                "byteSize": extraction["publishBytes"],
                "width": 1500,
                "height": 1500,
                "rightsBasis": "shop_owned",
                "sourceUrl": None,
                "isRedacted": False,
                "containsSensitiveIdentifiers": False,
                "externalProcessingAllowed": False,
                "metadata": metadata,
            })
            continue

        records.append({
            "assetKey": media_asset_key(extraction["redactedPath"]),
            "kind": "redacted_derivative",
            "sha256": extraction["redactedSha256"],
            "contentType": "image/webp",
            "byteSize": extraction["redactedBytes"],
            "width": extraction["redactedWidth"],
            "height": extraction["redactedHeight"],
            "rightsBasis": "shop_owned",
            "sourceUrl": None,
            "isRedacted": True,
            "containsSensitiveIdentifiers": False,
            "externalProcessingAllowed": extraction.get("privacyScanPassed") is True,
            "metadata": {**safe_metadata, "solVisionRequired": True, "uploadIndex": index},
        })
        if extraction.get("barcodeCropPath"):
            records.append({
                "assetKey": media_asset_key(extraction["barcodeCropPath"]),
                "kind": "redacted_derivative",
                "sha256": extraction["barcodeCropSha256"],
                "contentType": "image/webp",
                "byteSize": extraction["barcodeCropBytes"],
                "width": extraction["barcodeCropWidth"],
                "height": extraction["barcodeCropHeight"],
                "rightsBasis": "shop_owned",
                "sourceUrl": None,
                "isRedacted": True,
                "containsSensitiveIdentifiers": False,
                "externalProcessingAllowed": False,
                "metadata": {"assetType": "barcode_crop", "reviewOnly": True, "parentUploadIndex": index},
            })
    return records


async def submit(update: Update, state: dict, context: ContextTypes.DEFAULT_TYPE) -> None:
    missing = validate_submission(state)
    if missing:
        await update.message.reply_text("Fehlt / کمبود: " + ", ".join(missing), reply_markup=asset_menu())
        return
    start_payload = {
        "source": "safi_bot", "sourceReference": state["runId"], "condition": state["condition"],
        "submittedBy": "safi", "submittedByRole": "safi", "locale": "de",
        "payload": {
            "intent": state["intent"], "modelInput": state["modelInput"], "price": state["price"],
            "quantity": {"mode": state["quantityMode"], "value": state["quantity"]},
            "gtin": state.get("gtin") or None, "mpn": state.get("mpn") or None,
            "conditionNote": state.get("conditionNote"),
            "functionalCondition": state.get("functionalCondition"),
            "includedAccessories": state.get("includedAccessories"),
            "assets": [{"type": asset["type"], "view": asset.get("view"),
                        "extraction": {key: value for key, value in asset["extraction"].items()
                                       if key not in {"redactedPath", "publishPath", "barcodeCropPath", "solVisionPrompt"}}}
                       for asset in state["assets"]],
        },
    }
    body = canonical_json(start_payload)
    if SENSITIVE_PAYLOAD.search(body):
        clear(update.effective_user.id)
        await update.message.reply_text(
            "IMEI, Seriennummer oder EID erkannt und der Entwurf wurde sicher gelöscht. Bitte Intake neu starten.",
            reply_markup=menu(),
        )
        return
    path = "/webhook/apfel-intake-v2"
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(N8N_URL, content=body.encode(), headers=hmac_headers(body, path))
    if response.status_code >= 300:
        await update.message.reply_text("Pipeline nicht erreichbar; Entwurf bleibt gespeichert. Später erneut senden.")
        return
    result = response.json()
    run_id = result.get("runId")
    intake_code = result.get("intakeCode") or state["runId"]
    if not run_id:
        await update.message.reply_text("Intake-Antwort war unvollständig; Entwurf bleibt gespeichert.")
        return
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            for asset in asset_records(state):
                asset_body = canonical_json({"runId": run_id, "asset": asset})
                asset_path = "/webhook/apfel-intake-v2-asset"
                asset_response = await client.post(
                    f"{N8N_URL.rsplit('/', 1)[0]}/apfel-intake-v2-asset",
                    content=asset_body.encode(),
                    headers=hmac_headers(asset_body, asset_path),
                )
                asset_response.raise_for_status()
    except (ValueError, httpx.HTTPError):
        await update.message.reply_text(
            f"Intake {run_id} wurde angelegt, aber Assets konnten nicht vollständig registriert werden. Entwurf bleibt für Wiederholung gespeichert."
        )
        return
    clear(update.effective_user.id)
    await update.message.reply_text(f"✅ Intake gesendet: {intake_code}\nJamshid erhält die Freigabe.", reply_markup=menu())
    if update.effective_chat and update.effective_chat.id != OWNER_ID:
        await context.bot.send_message(
            chat_id=OWNER_ID,
            text=f"📦 Product intake {intake_code} ist vollständig hochgeladen. Hermes kann jetzt die redigierten Assets prüfen.",
        )


def main() -> None:
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.PHOTO, photo_handler))
    app.add_handler(MessageHandler(filters.Document.IMAGE, photo_handler))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, text_handler))
    app.run_polling(allowed_updates=["message"])


if __name__ == "__main__":
    main()
