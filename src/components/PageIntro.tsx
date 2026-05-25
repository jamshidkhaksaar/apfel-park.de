export default function PageIntro({
  title,
  subtitle,
  eyebrow,
  compact,
}: {
  title: string;
  subtitle: string;
  eyebrow?: string;
  compact?: boolean;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/5 ocean-surface">
      {/* Background Effects */}
      <div className="absolute inset-0 circuit-pattern opacity-20" />
      <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-[100px]" />

      <div className={`container-page relative ${compact ? "py-5 md:py-7" : "py-10 md:py-14"}`}>
        <div className={`max-w-3xl ${compact ? "space-y-1.5" : "space-y-3"}`}>
          {eyebrow ? (
            <span className="badge-gold inline-flex text-xs">
              <span className="h-1.5 w-1.5 animate-gold-pulse rounded-full bg-gold" />
              {eyebrow}
            </span>
          ) : null}

          <h1 className={`font-bold tracking-tight text-foreground ${compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl lg:text-5xl"}`}>
            {title}
          </h1>

          <p className={`text-muted ${compact ? "text-sm" : "text-base md:text-lg"}`}>{subtitle}</p>
        </div>
      </div>
    </section>
  );
}
