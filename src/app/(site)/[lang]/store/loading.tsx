import StoreCatalogSkeleton from "@/components/store/StoreCatalogSkeleton";

// No locale is available in a loading boundary, so the placeholder carries no
// copy — aria-busy communicates the state without an untranslated string.
export default function StoreLoading() {
  return (
    <div className="bg-store-ground py-6 md:py-8" aria-busy="true">
      <div className="container-page">
        <StoreCatalogSkeleton />
      </div>
    </div>
  );
}
