"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, formatCategories, getPrimaryCategory, normalizeCategories } from "@/lib/utils";
import toast from "react-hot-toast";

export default function RaceRegisterPage() {
  const router = useRouter();
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const syncRegistrationState = (value: string | string[] | null | undefined) => {
    const normalized = normalizeCategories(value);
    setSelectedCats(normalized);
    setAlreadyRegistered(normalized.length > 0);
  };

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (!token) {
      toast.error("Please sign in first");
      router.push("/login");
      return;
    }

    try {
      const storedUser = JSON.parse(localStorage.getItem("user_data") || "null");
      if (storedUser?.categories) {
        syncRegistrationState(storedUser.categories);
      }
    } catch {}

    // Check if already registered for races
    fetch("/api/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          syncRegistrationState(data.user.categories);
          try {
            const storedUser = JSON.parse(localStorage.getItem("user_data") || "{}");
            localStorage.setItem(
              "user_data",
              JSON.stringify({
                ...storedUser,
                ...data.user,
                category: getPrimaryCategory(data.user.categories),
                categories: formatCategories(data.user.categories),
              })
            );
          } catch {}
        }
        setCheckingAuth(false);
      })
      .catch(() => setCheckingAuth(false));
  }, [router]);

  const toggleCategory = (cat: string) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCats.length === 0) {
      toast.error("Select at least one race category");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("user_token");
      const res = await fetch("/api/race-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, categories: selectedCats }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      const normalizedCategories = normalizeCategories(data.user?.categories || selectedCats);
      syncRegistrationState(normalizedCategories);
      try {
        const storedUser = JSON.parse(localStorage.getItem("user_data") || "{}");
        localStorage.setItem(
          "user_data",
          JSON.stringify({
            ...storedUser,
            ...data.user,
            category: getPrimaryCategory(normalizedCategories),
            categories: formatCategories(normalizedCategories),
          })
        );
      } catch {}

      toast.success("Race registration successful! View your ticket.");
      router.push("/my-ticket");
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />

      <div className="relative glass p-6 sm:p-10 max-w-lg w-full animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">{"\uD83C\uDFC1"}</div>
          <h1 className="text-2xl sm:text-3xl font-bold">Register for the Race</h1>
          <p className="text-gray-400 mt-2 text-sm">
            {alreadyRegistered
              ? "Update your race categories below."
              : "Select the races you want to participate in. You can choose both!"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-300 mb-2">Race Categories</p>
            {CATEGORIES.map((cat) => (
              <label
                key={cat}
                className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedCats.includes(cat)
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/10 bg-black/20 hover:border-white/20"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedCats.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="w-5 h-5 rounded accent-blue-500"
                />
                <div>
                  <p className="font-semibold text-white">{cat}</p>
                  <p className="text-sm text-slate-400">
                    {cat.includes("5K")
                      ? "Competitive quarry loop \u2014 south trail, quarry arc, watch tower push."
                      : "Scenic warm-up loop \u2014 ridge turn, eucalyptus bend, finish chute."}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <div className="rounded-2xl border border-amber-400/10 bg-amber-400/5 p-4 text-sm text-slate-300">
            <strong className="text-amber-300">Note:</strong> BIB number will be assigned after payment verification and admin approval at the venue. You&apos;ll get a unique QR code to show at check-in.
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-4 text-lg"
            disabled={loading || selectedCats.length === 0}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Registering...
              </span>
            ) : alreadyRegistered ? (
              "Update Registration"
            ) : (
              "Register for Selected Races"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
