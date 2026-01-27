export default function PageIntro({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle: string;
  eyebrow?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/5 ocean-surface">
      {/* Background Effects */}
      <div className="absolute inset-0 circuit-pattern opacity-20" />
      <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-[100px]" />
      
      <div className="container-page relative py-10 md:py-14">
        <div className="max-w-3xl space-y-3">
          {eyebrow ? (
            <span className="badge-gold inline-flex text-xs">
              <span className="h-1.5 w-1.5 animate-gold-pulse rounded-full bg-gold" />
              {eyebrow}
            </span>
          ) : null}
          
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          
          <p className="text-base text-muted md:text-lg">{subtitle}</p>
        </div>
      </div>
    </section>
  );
}
