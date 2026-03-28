"use client";

import { useState, useEffect } from "react";
import { CATEGORIES, formatTime } from "@/lib/utils";
import { LoadingSpinner, EmptyState } from "@/components/UI";
import { WinnerBlast } from "@/components/WinnerBlast";

interface LeaderboardEntry {
  rank: number;
  name: string;
  bib_number: string | null;
  category: string;
  finish_time: string;
}

export default function LeaderboardPage() {
  const [category, setCategory] = useState("All");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  useEffect(() => {
    fetchLeaderboard();
  }, [category, page]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(perPage),
      });
      if (category !== "All") params.set("category", category);

      const res = await fetch(`/api/leaderboard?${params}`);
      const data = await res.json();

      if (res.ok) {
        setEntries(data.results || []);
        setTotal(data.total || 0);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / perPage);
  const winner = entries[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 animate-fade-in">
      <div className="text-center mb-10">
        <div className="text-4xl mb-3">🏆</div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Leaderboard</h1>
        <p className="text-gray-400">Real-time rankings by finish time</p>
      </div>

      {!loading && winner ? (
        <div className="mb-8">
          <WinnerBlast name={winner.name} bibNumber={winner.bib_number || "TBD"} subtitle={winner.category} />
        </div>
      ) : null}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {["All", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              category === cat
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading leaderboard..." />
      ) : entries.length === 0 ? (
        <EmptyState
          icon="🏁"
          title="No Results Yet"
          description="Results will appear here once the race begins."
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block glass overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Rank</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Bib #</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Category</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Finish Time</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        entry.rank === 1
                          ? "bg-yellow-500/20 text-yellow-400"
                          : entry.rank === 2
                          ? "bg-gray-300/20 text-gray-300"
                          : entry.rank === 3
                          ? "bg-orange-500/20 text-orange-400"
                          : "text-gray-400"
                      }`}>
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{entry.name}</td>
                    <td className="px-6 py-4 text-gray-400">{entry.bib_number || "—"}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-white/10 text-xs font-medium">
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-blue-400">{formatTime(entry.finish_time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {entries.map((entry, i) => (
              <div key={i} className="glass p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shrink-0 ${
                    entry.rank === 1
                      ? "bg-yellow-500/20 text-yellow-400"
                      : entry.rank === 2
                      ? "bg-gray-300/20 text-gray-300"
                      : entry.rank === 3
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-white/10 text-gray-400"
                  }`}>
                    #{entry.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{entry.name}</p>
                    <p className="text-xs text-gray-400">
                      Bib: {entry.bib_number || "—"} · {entry.category}
                    </p>
                  </div>
                  <div className="ml-auto text-right shrink-0">
                    <p className="font-mono text-blue-400 text-sm">{formatTime(entry.finish_time)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-30"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
