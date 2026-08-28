/**
 * Filtering and sorting are full server round-trips, so without this the page
 * simply freezes after a click. Mirrors the real grid's shape so the swap to
 * loaded content doesn't jump.
 */
export default function StoreCatalogSkeleton({ cards = 12 }: { cards?: number }) {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-border py-3">
        <div className="h-4 w-24 rounded bg-surface-strong" />
        <div className="h-11 w-40 rounded-xl bg-surface-strong" />
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="hidden w-64 shrink-0 space-y-3 lg:block">
          <div className="h-56 rounded-2xl border border-border bg-store-card" />
          <div className="h-96 rounded-2xl border border-border bg-store-card" />
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: cards }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-border bg-store-card">
              <div className="aspect-square bg-surface-strong" />
              <div className="space-y-2 border-t border-border p-3">
                <div className="h-3 w-1/2 rounded bg-surface-strong" />
                <div className="h-4 w-full rounded bg-surface-strong" />
                <div className="h-4 w-2/3 rounded bg-surface-strong" />
                <div className="mt-3 h-6 w-20 rounded bg-surface-strong" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
