// Without this, the catalog skeleton from ../loading.tsx would leak onto the
// product page, since loading boundaries apply to nested segments too.
export default function ProductLoading() {
  return (
    <div className="container-page py-10" aria-busy="true">
      <div className="grid animate-pulse gap-10 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl border border-border bg-store-card" />
          <div className="h-24 rounded-2xl border border-border bg-store-card" />
        </div>
        <div className="space-y-4">
          <div className="h-8 w-3/4 rounded bg-surface-strong" />
          <div className="h-5 w-1/2 rounded bg-surface-strong" />
          <div className="h-64 rounded-2xl border border-border bg-store-card" />
        </div>
      </div>
    </div>
  );
}
