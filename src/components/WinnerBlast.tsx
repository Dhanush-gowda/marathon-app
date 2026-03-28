const colors = ["#F59E0B", "#F97316", "#38BDF8", "#22C55E", "#E879F9", "#F43F5E"];

export function WinnerBlast({
  name,
  bibNumber,
  subtitle,
}: {
  name: string;
  bibNumber: string;
  subtitle: string;
}) {
  return (
    <section className="glass-strong relative overflow-hidden p-6 sm:p-8">
      <div className="winner-glow absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/20 blur-3xl" />
      {Array.from({ length: 18 }).map((_, index) => {
        const angle = (Math.PI * 2 * index) / 18;
        const x = `${Math.cos(angle) * 120}px`;
        const y = `${Math.sin(angle) * 100}px`;
        return (
          <span
            key={index}
            className="confetti-piece absolute left-1/2 top-1/2 h-3 w-3 rounded-sm"
            style={{
              backgroundColor: colors[index % colors.length],
              animationDelay: `${index * 0.08}s`,
              transformOrigin: "center",
              ["--tx" as string]: x,
              ["--ty" as string]: y,
            }}
          />
        );
      })}
      <div className="relative flex flex-col gap-5 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-amber-200/30 bg-amber-300/15 text-4xl shadow-lg shadow-amber-500/20">
          🏆
        </div>
        <div>
          <div className="winner-badge">Winner Blast</div>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">{name}</h2>
          <p className="mt-2 text-lg text-amber-100">BIB #{bibNumber}</p>
          <p className="mt-2 text-sm uppercase tracking-[0.24em] text-slate-300">{subtitle}</p>
        </div>
      </div>
    </section>
  );
}