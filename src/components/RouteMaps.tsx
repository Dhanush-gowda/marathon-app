const ROUTES = [
  {
    title: "5K Quarry Loop",
    distance: "5.0 km",
    pace: "Competitive trail pace",
    badge: "Primary race route",
    path: "M24 144 L66 102 L110 86 L150 56 L208 54 L264 80 L302 122 L288 164 L238 188 L184 214 L126 214 L78 196 Z",
    checkpoints: [
      "Turahalli Forest main gate start arch",
      "Southern ridge fire road",
      "Granite quarry curve",
      "Watch tower climb",
      "Finish chute near parking lawn",
    ],
  },
  {
    title: "3K Warm-Up Loop",
    distance: "3.0 km",
    pace: "Fast beginner-friendly circuit",
    badge: "Community route",
    path: "M38 136 L88 98 L148 90 L202 110 L224 144 L184 182 L122 188 L68 170 Z",
    checkpoints: [
      "Main gate rollout",
      "Eucalyptus bend",
      "North trail switchback",
      "Ridge turnaround",
      "Finish straight back at the gate",
    ],
  },
];

export function RouteMaps() {
  return (
    <section className="section-shell py-20">
      <div className="mx-auto max-w-3xl text-center">
        <div className="winner-badge">Route Maps</div>
        <h2 className="mt-5 text-3xl font-bold sm:text-4xl">Turahalli Forest course plan</h2>
        <p className="mt-4 text-sm leading-6 text-slate-300 sm:text-base">
          Illustrative demo maps around Turahalli Forest, Bengaluru for the local event website. Final marshal placement and signage should be confirmed on ground.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {ROUTES.map((route) => (
          <div key={route.title} className="glass-strong overflow-hidden p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">{route.badge}</p>
                <h3 className="mt-2 text-2xl font-bold">{route.title}</h3>
              </div>
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">Distance</p>
                <p className="mt-1 text-xl font-semibold text-cyan-100">{route.distance}</p>
              </div>
            </div>

            <div className="mt-5 rounded-[2rem] border border-white/10 bg-slate-950/70 p-4">
              <svg viewBox="0 0 330 250" className="h-64 w-full">
                <defs>
                  <linearGradient id={`route-${route.title}`} x1="0" y1="0" x2="330" y2="250" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38BDF8" />
                    <stop offset="1" stopColor="#34D399" />
                  </linearGradient>
                </defs>
                <rect x="12" y="12" width="306" height="226" rx="26" fill="rgba(15,23,42,0.92)" stroke="rgba(255,255,255,0.08)" />
                <circle cx="70" cy="60" r="24" fill="rgba(16,185,129,0.16)" />
                <circle cx="258" cy="182" r="34" fill="rgba(56,189,248,0.14)" />
                <path d={route.path} stroke={`url(#route-${route.title})`} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <circle cx="40" cy="144" r="8" fill="#f8fafc" />
                <circle cx="288" cy="164" r="8" fill="#F59E0B" />
                <text x="28" y="168" fill="#cbd5e1" fontSize="12">Start</text>
                <text x="272" y="188" fill="#fde68a" fontSize="12">Climb</text>
                <path d="M44 144h26" stroke="#f8fafc" strokeWidth="2" strokeDasharray="4 4" />
              </svg>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Route feel</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{route.pace}</p>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Turahalli+Forest+Bengaluru"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex text-sm font-semibold text-cyan-300 transition-colors hover:text-cyan-200"
                >
                  Open Turahalli Forest in Maps →
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Checkpoints</p>
                <div className="mt-2 space-y-2">
                  {route.checkpoints.map((checkpoint) => (
                    <div key={checkpoint} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                      {checkpoint}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}