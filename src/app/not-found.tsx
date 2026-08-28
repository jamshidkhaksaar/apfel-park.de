"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RootNotFound() {
  const pathname = usePathname();
  const lang = pathname.startsWith("/en") ? "en" : "de";
  const isGerman = lang === "de";
  return (
    <main className="min-h-screen bg-background px-4 py-16 text-foreground">
      <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-surface p-6 text-center shadow-xl sm:p-10">
        <Link href={`/${lang}`} className="inline-flex items-center gap-2 text-lg font-bold text-gold-text" aria-label="Apfel Park">
          <span aria-hidden="true"></span> Apfel Park
        </Link>
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-gold-text">404</p>
        <h1 className="mt-3 text-balance text-3xl font-bold sm:text-4xl">
          {isGerman ? "Diese Seite wurde nicht gefunden" : "This page could not be found"}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty leading-7 text-muted">
          {isGerman
            ? "Die Adresse ist möglicherweise veraltet. Über die Startseite oder den Shop findest du schnell zurück."
            : "The address may be outdated. Use the homepage or store to continue browsing."}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={`/${lang}`} className="btn-secondary justify-center">
            {isGerman ? "Zur Startseite" : "Go to homepage"}
          </Link>
          <Link href={`/${lang}/store`} className="btn-primary justify-center">
            {isGerman ? "Zum Online Shop" : "Go to store"}
          </Link>
        </div>
      </div>
    </main>
  );
}
