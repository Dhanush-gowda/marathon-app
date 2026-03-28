"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  categories: string | null;
  bib_number: string | null;
  checkin_status: boolean;
}

export default function MyTicketPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetch("/api/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          toast.error("Could not load your profile");
        }
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const qrData = `RBA-BATTLE-RUN|${user.id}|${user.bib_number || ""}|${user.email}|${user.categories || ""}`;
    let cancelled = false;
    import("qrcode")
      .then(({ toDataURL }) =>
        toDataURL(qrData, { margin: 1, width: 320, color: { dark: "#e2e8f0", light: "#00000000" } })
      )
      .then((url) => { if (!cancelled) setQrCodeUrl(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass p-8 text-center max-w-md">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-gray-400 mb-6">Please sign in again.</p>
          <button onClick={() => router.push("/login")} className="btn-primary px-8 py-3">Sign In</button>
        </div>
      </div>
    );
  }

  const cats = user.categories ? user.categories.split(",") : [];
  const hasRegistered = cats.length > 0 && cats[0] !== "Unassigned";

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-4xl animate-slide-up">
        <div className="glass-strong overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Left: Info */}
            <div className="relative overflow-hidden border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-10">
              <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-cyan-400 via-emerald-400 to-blue-500" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-emerald-200">RBA Battle Run Fest</p>
                  <h2 className="mt-3 text-3xl font-bold">{user.name}</h2>
                  <p className="mt-1 text-sm text-slate-300">{user.email}</p>
                  <p className="mt-1 text-sm text-slate-300">{user.phone}</p>
                </div>
                {user.bib_number ? (
                  <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/80">BIB</p>
                    <p className="mt-1 text-3xl font-extrabold text-emerald-200">{user.bib_number}</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-100/80">BIB</p>
                    <p className="mt-1 text-sm font-semibold text-amber-200">Pending</p>
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-4">
                {/* Race Categories */}
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Registered Races</p>
                  {hasRegistered ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {cats.map((c) => (
                        <span key={c} className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">Not registered for any race yet.</p>
                  )}
                </div>

                {/* Status */}
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
                  <div className="mt-2 flex items-center gap-3">
                    {user.bib_number ? (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> BIB Assigned &middot; Payment Confirmed
                      </span>
                    ) : hasRegistered ? (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-400" /> Awaiting Payment &amp; Admin Approval
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-gray-400">
                        <span className="w-2 h-2 rounded-full bg-gray-500" /> No Race Selected
                      </span>
                    )}
                  </div>
                  {user.checkin_status && (
                    <p className="mt-2 text-sm text-emerald-400 font-medium">&#10003; Checked In</p>
                  )}
                </div>

                {/* Venue Info */}
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Venue</p>
                  <p className="mt-2 text-lg font-semibold">Turahalli Forest, Bengaluru</p>
                  <p className="mt-1 text-sm text-slate-300">Gate opens 5:30 AM</p>
                </div>
              </div>

              {!hasRegistered && (
                <div className="mt-6">
                  <button onClick={() => router.push("/race-register")} className="btn-primary px-6 py-3">
                    Register for a Race
                  </button>
                </div>
              )}
            </div>

            {/* Right: QR Code */}
            <div className="flex flex-col items-center justify-center bg-slate-950/70 p-8 lg:p-10">
              <div className="mb-4 text-center">
                <div className="text-5xl">🎫</div>
                <h3 className="mt-3 text-2xl font-bold">Your QR Pass</h3>
                <p className="mt-2 text-sm text-slate-400">Show this at the venue for check-in</p>
              </div>
              <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-4 shadow-2xl shadow-cyan-500/10">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="Your QR ticket" className="h-64 w-64 rounded-2xl bg-white/5 object-contain" />
                ) : (
                  <div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-white/5 text-sm text-slate-400">
                    Generating QR...
                  </div>
                )}
              </div>
              <p className="mt-4 max-w-xs text-center text-xs leading-5 text-slate-500">
                Save a screenshot of this pass. Admin will scan it to verify your identity and assign your BIB after payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
