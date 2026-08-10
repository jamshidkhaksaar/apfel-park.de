import Image from "next/image";

import { siteInfo } from "@/lib/site";

/**
 * The person behind the counter.
 *
 * Naming the owner is not decoration: for an Einzelunternehmen German law
 * requires it in the Impressum, and for a repair shop it is also the most
 * reassuring thing on the page, because a customer is handing over a device
 * that holds their whole life. So the name appears where people actually look
 * -- About and Contact -- and not only in the legal notice.
 *
 * The portrait is optional. Until one is in place a monogram stands in, so the
 * page never renders a broken image and dropping the file in later needs no
 * code change.
 */
export default function OwnerCard({
  locale,
  variant = "full",
}: {
  locale: "de" | "en";
  variant?: "full" | "compact";
}) {
  const { owner } = siteInfo;
  const isGerman = locale === "de";
  const role = isGerman ? owner.roleDe : owner.roleEn;
  const initials = owner.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const portrait = (size: string) =>
    owner.photo ? (
      <Image
        src={owner.photo}
        alt={`${owner.name}, ${role} – ${siteInfo.name}`}
        width={480}
        height={480}
        className={`${size} rounded-2xl border border-gold/20 object-cover object-top`}
        sizes="(max-width: 768px) 40vw, 240px"
      />
    ) : (
      <span
        aria-hidden
        className={`${size} flex items-center justify-center rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/25 to-amber/10 text-2xl font-bold text-gold`}
      >
        {initials}
      </span>
    );

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-4">
        {portrait("h-16 w-16 shrink-0")}
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{owner.name}</p>
          <p className="text-sm text-muted">{role}</p>
          <a
            href={`tel:${owner.phoneE164}`}
            className="text-sm text-gold underline-offset-2 transition hover:underline"
          >
            {owner.phone}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="tech-card overflow-hidden rounded-3xl">
      <div className="grid items-center gap-8 p-8 md:grid-cols-[auto_minmax(0,1fr)] md:p-12">
        {portrait("h-40 w-40 md:h-56 md:w-56")}
        <div>
          <span className="badge-gold inline-flex text-xs">
            <span className="h-1.5 w-1.5 animate-gold-pulse rounded-full bg-gold" />
            {role}
          </span>
          <h2 className="mt-4 text-2xl font-bold text-foreground md:text-3xl">{owner.name}</h2>
          <p className="mt-4 leading-relaxed text-muted">
            {isGerman
              ? "Bei Apfel Park steht kein Callcenter zwischen Ihnen und Ihrem Gerät. Wer Ihr Smartphone repariert, steht selbst im Laden am Wilhelm-Strauß-Weg – und ist persönlich erreichbar, wenn einmal etwas nicht stimmt."
              : "At Apfel Park there is no call centre between you and your device. The person who repairs your phone stands in the shop on Wilhelm-Strauß-Weg, and is reachable in person if something is ever not right."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={`tel:${owner.phoneE164}`}
              className="inline-flex items-center gap-2 rounded-xl border border-gold/40 px-4 py-2 text-sm font-medium text-gold transition hover:bg-gold/10"
            >
              {isGerman ? "Direkt anrufen" : "Call directly"}
              <span className="text-muted">{owner.phone}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
