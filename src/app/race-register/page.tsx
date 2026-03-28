"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/utils";
import toast from "react-hot-toast";

interface RaceUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  bib_number: string;
}

export default function RaceRegisterPage() {
  const router = useRouter();
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [raceUser, setRaceUser] = useState<RaceUser | null>(null);
  const [ticketPayload, setTicketPayload] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (!token) {
      toast.error("Please sign in first");
      router.push("/login");
      return;
    }
    setCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    if (!ticketPayload) { setQrCodeUrl(""); return; }
    let cancelled = false;
    import("qrcode")
      .then(({ toDataURL }) =>
        toDataURL(ticketPayload, { margin: 1, width: 320, color: { dark: "#e2e8f0", light: "#00000000" } })
      )
      .then((url) => { if (!cancelled) setQrCodeUrl(url); })
      .catch(() => { if (!cancelled) toast.error("Could not generate QR ticket."); });
    return () => { cancelled = true; };
  }, [ticketPayload]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("user_token");
      const res = await fetch("/api/race-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, category }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }
      if (data.alreadyRegistered) {
        toast.success("You're already registered! Here's your ticket.");
      } else {
        toast.success("Race registration successful!");
      }
      setRaceUser(data.user);
      setTicketPayload(data.ticketPayload || "");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (raceUser) {
    return (
      <div className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-4xl animate-slide-up">
          <div className="glass-strong overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="relative overflow-hidden border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-10">
                <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-cyan-400 via-emerald-400 to-blue-500" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-emerald-200">Race Ticket</p>
                    <h2 className="mt-3 text-3xl font-bold">You&apos;re on the start list</h2>
                    <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">
                      Show this QR at the Turahalli Forest entry desk. Admin can scan it directly for check-in.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/80">BIB</p>
                    <p className="mt-1 text-3xl font-extrabold text-emerald-200">{raceUser.bib_number}</p>
                  </div>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Participant</p>
                    <p className="mt-2 text-xl font-semibold">{raceUser.name}</p>
                    <p className="mt-1 text-sm text-slate-300">{raceUser.email}</p>
                    <p className="mt-1 text-sm text-slate-300">{raceUser.phone}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Race</p>
                    <p className="mt-2 text-xl font-semibold">{raceUser.category}</p>
                    <p className="mt-1 text-sm text-slate-300">Turahalli Forest, Bengaluru</p>
                    <p className="mt-1 text-sm text-slate-300">Gate opens 5:30 AM</p>
                  </div>
                </div>

                <div className="mt-10">
                  <button onClick={() => router.push("/")} className="btn-secondary">
                    Back to Home
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center bg-slate-950/70 p-8 lg:p-10">
                <div className="mb-4 text-center">
                  <div className="text-5xl">🎟️</div>
                  <h3 className="mt-3 text-2xl font-bold">Scan-ready QR pass</h3>
                  <p className="mt-2 text-sm text-slate-400">Your race-day entry ticket</p>
                </div>
                <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-4 shadow-2xl shadow-cyan-500/10">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Participant QR ticket" className="h-64 w-64 rounded-2xl bg-white/5 object-contain" />
                  ) : (
                    <div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-white/5 text-sm text-slate-400">
                      Generating QR ticket...
                    </div>
                  )}
                </div>
                <p className="mt-4 max-w-xs text-center text-xs leading-5 text-slate-500">
                  Save a screenshot of this pass. The QR encodes your registration ID, BIB, email, and category.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />

      <div className="relative glass p-6 sm:p-10 max-w-lg w-full animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏁</div>
          <h1 className="text-2xl sm:text-3xl font-bold">Register for the Race</h1>
          <p className="text-gray-400 mt-2 text-sm">Choose your category to get your BIB number and QR entry pass.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1.5">Race Category</label>
            <select
              id="category"
              className="input-field appearance-none cursor-pointer"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">5K Route</p>
              <p className="mt-2 text-lg font-semibold">Quarry Loop</p>
              <p className="mt-1 text-sm text-slate-300">South trail, quarry arc, watch tower push.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">3K Route</p>
              <p className="mt-2 text-lg font-semibold">Warm-up Loop</p>
              <p className="mt-1 text-sm text-slate-300">Ridge turn, eucalyptus bend, finish chute.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4 text-sm text-slate-300">
            You&apos;ll get a BIB number and a scannable QR entry pass instantly.
          </div>

          <button type="submit" className="btn-primary w-full py-4 text-lg" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Registering...
              </span>
            ) : (
              "Get My Race Ticket"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
