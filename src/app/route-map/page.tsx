import Link from "next/link";
import { RouteMaps } from "@/components/RouteMaps";

export default function RouteMapPage() {
  return (
    <div className="pb-16 pt-6">
      <section className="section-shell py-12">
        <div className="glass-strong overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="winner-badge">Turahalli Forest</div>
              <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Route map for the 3K and 5K runs</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Use this page to brief runners and volunteers before race day. The route cards summarize the forest loop shape, checkpoints, and link out to Turahalli Forest on Google Maps.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="btn-primary">
                Register Runner
              </Link>
              <Link href="/leaderboard" className="btn-secondary">
                Live Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <RouteMaps />
    </div>
  );
}
