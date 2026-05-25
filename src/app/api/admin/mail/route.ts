import { NextRequest, NextResponse } from "next/server";

import { rejectCrossSiteAdminMutation } from "@/lib/admin-csrf";
import { isAdminUser } from "@/lib/admin-auth";
import { createAdminServerClient } from "@/lib/admin-auth-server";
import {
  createMailbox,
  deleteMailbox,
  listMailboxes,
  resetMailboxPassword,
  updateMailboxQuota,
} from "@/lib/mail-admin";

const messages = {
  de: {
    unauthorized: "Nicht autorisiert",
    generic: "Mailserver-Aktion fehlgeschlagen.",
    mailboxRequired: "Mailbox-Name ist erforderlich.",
    emailRequired: "E-Mail-Adresse ist erforderlich.",
    actionRequired: "Aktion ist erforderlich.",
  },
  en: {
    unauthorized: "Unauthorized",
    generic: "Mail server action failed.",
    mailboxRequired: "Mailbox name is required.",
    emailRequired: "Email address is required.",
    actionRequired: "Action is required.",
  },
} as const;

const getMessages = (request: NextRequest) =>
  request.cookies.get("admin-lang")?.value === "en" ? messages.en : messages.de;

const waitForMailserverRefresh = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
};

const ensureAdmin = async (request: NextRequest) => {
  const adminClient = await createAdminServerClient();
  const {
    data: { user },
  } = await adminClient.auth.getUser();

  if (!isAdminUser(user)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: getMessages(request).unauthorized }, { status: 401 }),
    };
  }
  const csrf = rejectCrossSiteAdminMutation(request, getMessages(request).unauthorized);
  if (csrf) {
    return { ok: false as const, response: csrf };
  }

  return { ok: true as const };
};

export async function GET(request: NextRequest) {
  const auth = await ensureAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    return NextResponse.json({ mailboxes: await listMailboxes() });
  } catch (error) {
    console.error("List mailboxes failed:", error);
    return NextResponse.json({ error: getMessages(request).generic }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await ensureAdmin(request);
  if (!auth.ok) return auth.response;

  const dictionary = getMessages(request);

  try {
    const body = (await request.json()) as { localPart?: string; password?: string; quota?: string };
    if (!body.localPart?.trim()) {
      return NextResponse.json({ error: dictionary.mailboxRequired }, { status: 400 });
    }

    const created = await createMailbox({
      localPart: body.localPart,
      password: body.password,
      quota: body.quota,
    });
    await waitForMailserverRefresh();
    return NextResponse.json({
      mailboxes: await listMailboxes(),
      password: created.password,
    });
  } catch (error) {
    console.error("Create mailbox failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : dictionary.generic },
      { status: 400 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await ensureAdmin(request);
  if (!auth.ok) return auth.response;

  const dictionary = getMessages(request);

  try {
    const body = (await request.json()) as {
      action?: string;
      email?: string;
      password?: string;
      quota?: string;
    };

    if (!body.email?.trim()) {
      return NextResponse.json({ error: dictionary.emailRequired }, { status: 400 });
    }

    if (body.action === "password") {
      const updated = await resetMailboxPassword({ email: body.email, password: body.password });
      await waitForMailserverRefresh();
      return NextResponse.json({
        mailboxes: await listMailboxes(),
        password: updated.password,
      });
    }

    if (body.action === "quota") {
      await updateMailboxQuota({ email: body.email, quota: body.quota ?? "0" });
      await waitForMailserverRefresh();
      return NextResponse.json({
        mailboxes: await listMailboxes(),
      });
    }

    if (body.action === "delete") {
      await deleteMailbox({ email: body.email });
      await waitForMailserverRefresh();
      return NextResponse.json({
        mailboxes: await listMailboxes(),
      });
    }

    return NextResponse.json({ error: dictionary.actionRequired }, { status: 400 });
  } catch (error) {
    console.error("Update mailbox failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : dictionary.generic },
      { status: 400 },
    );
  }
}
