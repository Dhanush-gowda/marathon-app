import Link from "next/link";
import { RouteMaps } from "@/components/RouteMaps";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <section className="relative min-h-[88vh] flex items-center">
        <div className="section-shell grid gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="animate-fade-in">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
              Turahalli Forest Bengaluru
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">
                3K and 5K forest run management,
              </span>{" "}
              built for race day speed.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
              Registrations, QR ticketing, live results, winner celebration, and admin control in one responsive experience.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/register" className="btn-primary text-base sm:text-lg px-8 py-4">
                Register For 3K / 5K
              </Link>
              <Link href="/leaderboard" className="btn-secondary text-base sm:text-lg px-8 py-4">
                View Live Results
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Auto BIB", value: "Starts at 1000" },
                { label: "Entry Pass", value: "QR movie-ticket style" },
                { label: "Venue", value: "Turahalli Forest" },
              ].map((item) => (
                <div key={item.label} className="glass p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-strong relative overflow-hidden p-6 sm:p-8 animate-slide-up">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-emerald-400/10" />
            <div className="relative">
              <div className="winner-badge">Featured Event</div>
              <h2 className="mt-5 text-2xl font-bold sm:text-3xl">Turahalli Twilight Run</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                A mobile-first race console for your Bengaluru forest event with fast admin actions, instant participant tickets, and dramatic podium moments.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">3K Route</p>
                  <p className="mt-2 text-xl font-semibold">Warm-up Loop</p>
                  <p className="mt-2 text-sm text-slate-300">Main gate, ridge turn, eucalyptus bend, finish chute.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">5K Route</p>
                  <p className="mt-2 text-xl font-semibold">Quarry Loop</p>
                  <p className="mt-2 text-sm text-slate-300">Main gate, south trail, quarry arc, watch tower push, finish.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
          Everything You Need
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: "📝",
              title: "Easy Registration",
              desc: "Sign up in seconds with our streamlined registration form.",
            },
            {
              icon: "🏆",
              title: "Live Leaderboard",
              desc: "Real-time rankings filtered by category. See where you stand.",
            },
            {
              icon: "📍",
              title: "Race Tracking",
              desc: "Track any participant by bib number or email during the race.",
            },
            {
              icon: "🎫",
              title: "QR Entry Ticket",
              desc: "Generate a scannable registration ticket the moment a runner signs up.",
            },
            {
              icon: "🗺️",
              title: "Route Maps",
              desc: "Showcase the 3K and 5K Turahalli Forest loops with clear route cards.",
            },
            {
              icon: "🔒",
              title: "Secure Admin",
              desc: "Protected admin panel for managing the entire event.",
            },
          ].map((feature) => (
            <div key={feature.title} className="glass p-6 card-hover">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/[0.02] py-20">
        <div className="section-shell">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
            Race Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { name: "5K Run", dist: "5.0 km", gradient: "from-cyan-500 to-blue-600", desc: "Competitive quarry loop with rolling trail sections." },
              { name: "3K Run", dist: "3.0 km", gradient: "from-emerald-500 to-lime-500", desc: "Fast scenic loop ideal for beginners and families." },
            ].map((cat) => (
              <div key={cat.name} className="glass p-6 card-hover">
                <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${cat.gradient} text-xs font-bold mb-3`}>
                  {cat.dist}
                </div>
                <h3 className="text-xl font-bold">{cat.name}</h3>
                <p className="mt-2 text-sm text-slate-300">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RouteMaps />

      <section className="section-shell py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready for the forest start line?
          </h2>
          <p className="text-gray-300 mb-8">
            Register today and get a QR race ticket, auto-generated bib, and instant access to results tracking.
          </p>
          <Link href="/register" className="btn-primary text-lg px-10 py-4">
            Get Started →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-8 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Marathon Manager. All rights reserved.</p>
      </footer>
    </div>
  );
}
