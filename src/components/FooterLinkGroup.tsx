import Link from "next/link";

/**
 * A footer column that collapses on phones and stays open on desktop.
 *
 * Fully expanded, the four columns stack into several screens of scrolling on a
 * phone. `<details>` gives a native accordion with no JavaScript; `lg:open`
 * cannot be expressed in CSS, so the desktop version renders as a plain block
 * and only the phone version is a disclosure.
 */
export default function FooterLinkGroup({
  title,
  links,
  lang,
}: {
  title: string;
  links: ReadonlyArray<{ readonly label: string; readonly path: string }>;
  lang: string;
}) {
  const list = (
    <ul className="space-y-1">
      {links.map((item) => (
        <li key={item.path}>
          <Link
            href={`/${lang}${item.path}`}
            className="flex min-h-11 items-center text-sm text-muted transition hover:text-foreground lg:min-h-0 lg:py-1"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  const heading = (
    <span className="flex items-center gap-2 text-sm font-semibold text-gold">
      <span aria-hidden="true" className="h-px w-4 bg-gold" />
      {title}
    </span>
  );

  return (
    <>
      <details className="group border-b border-border lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
          {heading}
          <svg
            className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="pb-3">{list}</div>
      </details>

      <div className="hidden lg:block">
        {heading}
        <div className="mt-5">{list}</div>
      </div>
    </>
  );
}
