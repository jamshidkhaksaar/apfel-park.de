import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { query } from "@/lib/db";

const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;
const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

type ConfirmationLocale = "de" | "en";
type ConfirmationState = "confirm" | "success" | "invalid";

const renderPage = (
  locale: ConfirmationLocale,
  state: ConfirmationState,
  token?: string,
): NextResponse => {
  const de = locale === "de";
  const content = {
    confirm: {
      title: de ? "Anmeldung bestätigen" : "Confirm subscription",
      message: de
        ? "Bestätige, dass du ausgewählte Angebote und Neuigkeiten von Apfel Park per E-Mail erhalten möchtest."
        : "Confirm that you want to receive selected Apfel Park offers and news by email.",
      action: de ? "Anmeldung bestätigen" : "Confirm subscription",
    },
    success: {
      title: de ? "Anmeldung bestätigt" : "Subscription confirmed",
      message: de
        ? "Deine E-Mail-Adresse ist bestätigt. Du erhältst künftig ausgewählte Angebote von Apfel Park."
        : "Your email address is confirmed. You can now receive selected offers from Apfel Park.",
      action: de ? "Zur Startseite" : "Go to homepage",
    },
    invalid: {
      title: de ? "Link nicht gültig" : "Invalid link",
      message: de
        ? "Dieser Bestätigungslink ist nicht gültig. Bitte melde dich erneut über das Formular auf unserer Website an."
        : "This confirmation link is not valid. Please subscribe again using the form on our website.",
      action: de ? "Zur Startseite" : "Go to homepage",
    },
  }[state];

  const action = state === "confirm" && token
    ? `<form method="post" action="/api/offer-subscribe/confirm"><input type="hidden" name="token" value="${token}"/><button type="submit">${content.action}</button></form>`
    : `<a class="button" href="/${locale}">${content.action}</a>`;
  const status = state === "invalid" ? 400 : 200;

  return new NextResponse(`<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex,nofollow"/>
<title>${content.title} | Apfel Park</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#11100e;color:#f7f4ee;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:24px}.card{width:min(100%,560px);border:1px solid #4d4232;border-radius:24px;background:#1c1915;padding:32px;box-shadow:0 24px 80px #0008}.eyebrow{color:#d4a34f;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}h1{font-size:clamp(28px,7vw,42px);line-height:1.1;margin:12px 0 16px}p{color:#c9c0b4;line-height:1.7;margin:0 0 24px}.button,button{display:inline-flex;align-items:center;justify-content:center;min-height:48px;border:0;border-radius:999px;background:linear-gradient(135deg,#e0b35f,#b9822e);color:#17120b;font:inherit;font-weight:800;padding:12px 22px;text-decoration:none;cursor:pointer}small{display:block;color:#8f867a;margin-top:20px;line-height:1.5}
</style>
</head>
<body><main class="card"><div class="eyebrow">Apfel Park · Hamburg</div><h1>${content.title}</h1><p>${content.message}</p>${action}<small>${de ? "Du kannst dich jederzeit wieder abmelden." : "You can unsubscribe at any time."}</small></main></body>
</html>`, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
};

const lookupToken = async (token: string) => {
  const result = await query(
    `SELECT locale, confirmed_at, unsubscribed_at
       FROM offer_subscribers
      WHERE confirmation_token_hash = $1
      LIMIT 1`,
    [hashToken(token)],
  );
  return result.rows[0] as { locale?: string; confirmed_at?: string | null; unsubscribed_at?: string | null } | undefined;
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  if (!TOKEN_PATTERN.test(token)) return renderPage("de", "invalid");
  const subscriber = await lookupToken(token);
  if (!subscriber || subscriber.unsubscribed_at) return renderPage("de", "invalid");
  const locale: ConfirmationLocale = subscriber.locale === "en" ? "en" : "de";
  return subscriber.confirmed_at ? renderPage(locale, "success") : renderPage(locale, "confirm", token);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const token = typeof form.get("token") === "string" ? String(form.get("token")).trim() : "";
  if (!TOKEN_PATTERN.test(token)) return renderPage("de", "invalid");
  const result = await query(
    `UPDATE offer_subscribers
        SET confirmed_at = COALESCE(confirmed_at, now()), updated_at = now()
      WHERE confirmation_token_hash = $1
        AND unsubscribed_at IS NULL
      RETURNING locale`,
    [hashToken(token)],
  );
  if (!result.rows[0]) return renderPage("de", "invalid");
  const locale: ConfirmationLocale = result.rows[0].locale === "en" ? "en" : "de";
  return renderPage(locale, "success");
}
