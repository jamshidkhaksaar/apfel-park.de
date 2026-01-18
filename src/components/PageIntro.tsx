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
    <section className="relative overflow-hidden border-b border-white/5">
      {/* Background Effects */}
      <div className="absolute inset-0 circuit-pattern opacity-20" />
      <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-[100px]" />
      
      <div className="container-page relative py-20 md:py-28">
        <div className="max-w-3xl space-y-6">
          {eyebrow ? (
            <span className="badge-gold inline-flex">
              <span className="h-1.5 w-1.5 animate-gold-pulse rounded-full bg-gold" />
              {eyebrow}
            </span>
          ) : null}
          
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          
          <p className="text-lg text-muted md:text-xl">{subtitle}</p>
        </div>
      </div>
    </section>
  );
}
