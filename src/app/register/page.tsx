"use client";

import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/utils";
import toast from "react-hot-toast";

interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  bib_number: string;
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    category: CATEGORIES[0] as string,
  });
  const [loading, setLoading] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(null);
  const [ticketPayload, setTicketPayload] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    if (!ticketPayload) {
      setQrCodeUrl("");
      return;
    }

    let isCancelled = false;

    import("qrcode")
      .then(({ toDataURL }) =>
        toDataURL(ticketPayload, {
          margin: 1,
          width: 320,
          color: {
            dark: "#e2e8f0",
            light: "#00000000",
          },
        })
      )
      .then((url) => {
        if (!isCancelled) {
          setQrCodeUrl(url);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          toast.error("Could not generate your QR ticket.");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [ticketPayload]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);

    try {
      const { confirmPassword: _, ...payload } = form;
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      if (data.token) {
        localStorage.setItem("user_token", data.token);
        localStorage.setItem("user_data", JSON.stringify(data.user));
      }
      toast.success("Registration successful!");
      setRegisteredUser(data.user);
      setTicketPayload(data.ticketPayload || "");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (registeredUser) {
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
                    <p className="mt-1 text-3xl font-extrabold text-emerald-200">{registeredUser.bib_number}</p>
                  </div>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Participant</p>
                    <p className="mt-2 text-xl font-semibold">{registeredUser.name}</p>
                    <p className="mt-1 text-sm text-slate-300">{registeredUser.email}</p>
                    <p className="mt-1 text-sm text-slate-300">{registeredUser.phone}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Race</p>
                    <p className="mt-2 text-xl font-semibold">{registeredUser.category}</p>
                    <p className="mt-1 text-sm text-slate-300">Turahalli Forest, Bengaluru</p>
                    <p className="mt-1 text-sm text-slate-300">Gate opens 5:30 AM</p>
                  </div>
                </div>

                <div className="mt-10 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setRegisteredUser(null);
                      setTicketPayload("");
                      setForm({ name: "", email: "", phone: "", password: "", confirmPassword: "", category: CATEGORIES[0] });
                    }}
                    className="btn-secondary"
                  >
                    Register Another
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center bg-slate-950/70 p-8 lg:p-10">
                <div className="mb-4 text-center">
                  <div className="text-5xl">🎟️</div>
                  <h3 className="mt-3 text-2xl font-bold">Scan-ready QR pass</h3>
                  <p className="mt-2 text-sm text-slate-400">Looks like a movie ticket. Works like race-day check-in.</p>
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
      {/* Background */}
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />

      <div className="relative glass p-6 sm:p-10 max-w-lg w-full animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📝</div>
          <h1 className="text-2xl sm:text-3xl font-bold">Register for the Turahalli Run</h1>
          <p className="text-gray-400 mt-2 text-sm">BIB numbers are generated automatically starting from 1000.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              className="input-field"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              className="input-field"
              placeholder="john@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1.5">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              required
              className="input-field"
              placeholder="98765 43210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
              Create Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              className="input-field"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={6}
              className="input-field"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1.5">
              Category
            </label>
            <select
              id="category"
              className="input-field appearance-none cursor-pointer"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-gray-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4 text-sm text-slate-300">
            Registration generates a QR pass instantly. Admin can scan it on race day for fast entry.
          </div>

          <p className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <a href="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</a>
          </p>

          <button type="submit" className="btn-primary w-full py-4 text-lg" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Registering...
              </span>
            ) : (
              "Register Now"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
