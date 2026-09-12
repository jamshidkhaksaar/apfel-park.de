import type { AdminLocale } from '@/lib/admin-i18n';

export type SocialPublishResult = {
  success: boolean;
  target: "facebook" | "instagram";
  postId?: string;
  error?: string;
};

const isExpiredMetaTokenError = (error: string | undefined) => {
  const normalized = (error ?? "").toLowerCase();
  return (
    normalized.includes("session has expired") ||
    normalized.includes("access token") && normalized.includes("expired") ||
    normalized.includes("code 190") && normalized.includes("subcode 463")
  );
};

const formatSocialError = (result: SocialPublishResult, locale: AdminLocale) => {
  if (isExpiredMetaTokenError(result.error)) {
    return locale === "de"
      ? `${result.target}: Meta-Zugriffstoken ist abgelaufen. Bitte in Einstellungen > Integrationen einen neuen Business/System-User-Token speichern.`
      : `${result.target}: Meta access token is expired. Save a new Business/System User token in Settings > Integrations.`;
  }

  return `${result.target}: ${result.error || (locale === "de" ? "fehlgeschlagen" : "failed")}`;
};

export const formatSocialPublishMessage = (results: SocialPublishResult[] | undefined, locale: AdminLocale) => {
  if (!results || results.length === 0) {
    return locale === "de"
      ? "Produkt aktualisiert. Social Publishing ist nicht aktiv."
      : "Product updated. Social publishing is not active.";
  }

  const successful = results.filter((result) => result.success).map((result) => result.target);
  const failed = results.filter((result) => !result.success);
  const labels = new Intl.ListFormat(locale === "de" ? "de-DE" : "en-US", {
    style: "short",
    type: "conjunction",
  });

  if (failed.length === 0) {
    return locale === "de"
      ? `Produkt aktualisiert und auf ${labels.format(successful)} veröffentlicht.`
      : `Product updated and published to ${labels.format(successful)}.`;
  }

  const failureText = failed.map((result) => formatSocialError(result, locale)).join("; ");

  if (successful.length === 0) {
    return locale === "de"
      ? `Produkt aktualisiert. Social Publishing fehlgeschlagen: ${failureText}`
      : `Product updated. Social publishing failed: ${failureText}`;
  }

  return locale === "de"
    ? `Produkt aktualisiert und auf ${labels.format(successful)} veröffentlicht. Fehler: ${failureText}`
    : `Product updated and published to ${labels.format(successful)}. Failed: ${failureText}`;
};
