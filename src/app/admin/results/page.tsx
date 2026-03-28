"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner, EmptyState } from "@/components/UI";
import { formatTime } from "@/lib/utils";
import { WinnerBlast } from "@/components/WinnerBlast";
import toast from "react-hot-toast";

interface ResultEntry {
  id: string;
  user_id: string;
  finish_time: string;
  rank: number | null;
  name?: string;
  bib_number?: string;
}

export default function AdminResultsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Manual entry
  const [manualForm, setManualForm] = useState({ bibNumber: "", finishTime: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    fetchResults();
  }, [router]);

  const fetchResults = async () => {
    try {
      const res = await fetch("/api/leaderboard?limit=9999");
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const token = localStorage.getItem("admin_token");

    try {
      const text = await file.text();

      const res = await fetch("/api/upload-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ csv: text }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Uploaded ${data.count} results!`);
        fetchResults();
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Failed to process CSV");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem("admin_token");

    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bibNumber: manualForm.bibNumber,
          finishTime: manualForm.finishTime,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Result added!");
        setManualForm({ bibNumber: "", finishTime: "" });
        fetchResults();
      } else {
        toast.error(data.error || "Failed to add result");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading results..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 animate-fade-in">
      <h1 className="text-3xl sm:text-4xl font-bold mb-2">Results Management</h1>
      <p className="text-gray-400 mb-8">{results.length} results uploaded</p>

      {results[0] ? (
        <div className="mb-8">
          <WinnerBlast
            name={results[0].name || "Top finisher"}
            bibNumber={results[0].bib_number || "TBD"}
            subtitle="Current race leader"
          />
        </div>
      ) : null}

      {/* Upload & Manual Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* CSV Upload */}
        <div className="glass p-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            📄 CSV Upload
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Upload a CSV with columns: <code className="text-blue-400">bib_number, finish_time</code>
            <br />
            Time format: <code className="text-blue-400">HH:MM:SS</code>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary w-full"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </span>
            ) : (
              "Choose CSV File"
            )}
          </button>
        </div>

        {/* Manual Entry */}
        <div className="glass p-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            ✏️ Manual Entry
          </h2>
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <input
              type="text"
              className="input-field"
              placeholder="Bib Number (1000+)"
              value={manualForm.bibNumber}
              onChange={(e) => setManualForm({ ...manualForm, bibNumber: e.target.value })}
              required
            />
            <input
              type="text"
              className="input-field"
              placeholder="Finish Time (HH:MM:SS)"
              value={manualForm.finishTime}
              onChange={(e) => setManualForm({ ...manualForm, finishTime: e.target.value })}
              pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
              required
            />
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Adding..." : "Add Result"}
            </button>
          </form>
        </div>
      </div>

      {/* Results List */}
      {results.length === 0 ? (
        <EmptyState icon="🏁" title="No Results" description="Upload results via CSV or add manually." />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block glass overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Rank</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Bib #</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Finish Time</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.id || i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-bold">{r.rank || i + 1}</td>
                    <td className="px-4 py-3">{r.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono">{r.bib_number || "—"}</td>
                    <td className="px-4 py-3 font-mono text-blue-400">{formatTime(r.finish_time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {results.map((r, i) => (
              <div key={r.id || i} className="glass p-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">
                  #{r.rank || i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{r.name || "Unknown"}</p>
                  <p className="text-xs text-gray-400">Bib: {r.bib_number || "—"}</p>
                </div>
                <span className="font-mono text-sm text-blue-400 shrink-0">
                  {formatTime(r.finish_time)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
