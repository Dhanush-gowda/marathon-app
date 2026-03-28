"use client";

import { useState } from "react";
import { formatTime } from "@/lib/utils";
import { LoadingSpinner, EmptyState } from "@/components/UI";
import toast from "react-hot-toast";

interface TrackResult {
  name: string;
  email: string;
  bib_number: string | null;
  category: string;
  checkin_status: boolean;
  finish_time: string | null;
  rank: number | null;
}

export default function TrackPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setResult(null);

    try {
      const res = await fetch(`/api/track?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (res.ok && data.result) {
        setResult(data.result);
      } else {
        toast.error(data.error || "Participant not found");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 animate-fade-in">
      <div className="text-center mb-10">
        <div className="text-4xl mb-3">📍</div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Track Participant</h1>
        <p className="text-gray-400">Search by bib number or email address</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-10">
        <input
          type="text"
          className="input-field flex-1"
          placeholder="Enter bib number or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={loading}>
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Search"
          )}
        </button>
      </form>

      {/* Results */}
      {loading && <LoadingSpinner text="Searching..." />}

      {!loading && searched && !result && (
        <EmptyState
          icon="🔍"
          title="Not Found"
          description="No participant found with that bib number or email."
        />
      )}

      {!loading && result && (
        <div className="glass p-6 sm:p-8 animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl shrink-0">
              🏃
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold truncate">{result.name}</h2>
              <p className="text-sm text-gray-400">{result.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Bib Number</p>
              <p className="text-lg font-bold">{result.bib_number || "Pending"}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Category</p>
              <p className="text-lg font-bold">{result.category}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Check-in</p>
              <p className="text-lg font-bold">
                {result.checkin_status ? (
                  <span className="text-green-400">✓ Checked In</span>
                ) : (
                  <span className="text-yellow-400">Pending</span>
                )}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Finish Time</p>
              <p className="text-lg font-bold font-mono">
                {result.finish_time ? (
                  <span className="text-blue-400">{formatTime(result.finish_time)}</span>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </p>
            </div>
          </div>

          {result.rank && (
            <div className="mt-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-yellow-400/70 mb-1">Overall Rank</p>
              <p className="text-3xl font-extrabold text-yellow-400">#{result.rank}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
