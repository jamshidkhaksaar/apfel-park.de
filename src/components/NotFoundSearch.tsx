/** Plain search form for 404 pages: lands on the shop search with the query. */
export default function NotFoundSearch({ lang }: { lang: "de" | "en" }) {
  const isGerman = lang === "de";
  return (
    <form action={`/${lang}/store`} method="get" role="search" className="mx-auto mt-6 flex max-w-md gap-2">
      <label htmlFor="not-found-search" className="sr-only">
        {isGerman ? "Produkt suchen" : "Search products"}
      </label>
      <input
        id="not-found-search"
        name="q"
        type="search"
        enterKeyHint="search"
        placeholder={isGerman ? "z. B. iPhone 13" : "e.g. iPhone 13"}
        className="min-w-0 flex-1 rounded-full border border-border bg-background/70 px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
      />
      <button type="submit" className="btn-primary shrink-0 justify-center px-5">
        {isGerman ? "Suchen" : "Search"}
      </button>
    </form>
  );
}
