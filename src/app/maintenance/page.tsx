export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-20 text-foreground">
      <div className="mx-auto max-w-2xl rounded-2xl border border-border/60 bg-surface/70 p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Apfel Park</p>
        <h1 className="mt-4 text-3xl font-semibold">Maintenance Mode</h1>
        <p className="mt-3 text-sm text-muted">
          We are currently updating the website. Please check back in a few minutes.
        </p>
      </div>
    </main>
  );
}
