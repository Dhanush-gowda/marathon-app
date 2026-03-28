"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/UI";
import { LoadingSpinner } from "@/components/UI";
import { normalizeCategories } from "@/lib/utils";

interface DashboardStats {
  totalParticipants: number;
  checkedIn: number;
  resultsUploaded: number;
  categories: Record<string, number>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    fetchStats(token);
  }, [router]);

  const fetchStats = async (token: string) => {
    try {
      const res = await fetch("/api/participants", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("admin_token");
        router.push("/admin/login");
        return;
      }

      const data = await res.json();
      const participants = data.participants || [];

      const resultsRes = await fetch("/api/leaderboard?limit=9999");
      const resultsData = await resultsRes.json();

      const categories: Record<string, number> = {};
      participants.forEach((p: { category?: string | null; categories?: string | null }) => {
        const participantCategories = normalizeCategories(p.categories || p.category);
        if (participantCategories.length === 0) {
          categories.Unassigned = (categories.Unassigned || 0) + 1;
          return;
        }

        participantCategories.forEach((category) => {
          categories[category] = (categories[category] || 0) + 1;
        });
      });

      setStats({
        totalParticipants: participants.length,
        checkedIn: participants.filter((p: { checkin_status: boolean }) => p.checkin_status).length,
        resultsUploaded: resultsData.total || 0,
        categories,
      });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">Dashboard</h1>
          <p className="text-gray-400 mt-1">Overview of marathon operations</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary text-sm self-start">
          Logout
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          icon="👥"
          label="Total Participants"
          value={stats?.totalParticipants || 0}
          gradient="from-blue-600 to-cyan-600"
        />
        <StatCard
          icon="✅"
          label="Checked In"
          value={stats?.checkedIn || 0}
          gradient="from-green-600 to-emerald-600"
        />
        <StatCard
          icon="🏁"
          label="Results Uploaded"
          value={stats?.resultsUploaded || 0}
          gradient="from-purple-600 to-pink-600"
        />
        <StatCard
          icon="📊"
          label="Categories"
          value={Object.keys(stats?.categories || {}).length}
          gradient="from-orange-600 to-red-600"
        />
      </div>

      {/* Category Breakdown */}
      <div className="glass p-6 sm:p-8 mb-10">
        <h2 className="text-xl font-bold mb-4">Category Breakdown</h2>
        {stats?.categories && Object.keys(stats.categories).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(stats.categories).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                <span className="text-gray-300">{cat}</span>
                <span className="font-bold text-lg">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No participants registered yet.</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="glass p-6 sm:p-8">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => router.push("/admin/participants")}
            className="btn-secondary py-4 text-left flex items-center gap-3"
          >
            <span className="text-xl">👥</span>
            <span>Manage Participants</span>
          </button>
          <button
            onClick={() => router.push("/admin/results")}
            className="btn-secondary py-4 text-left flex items-center gap-3"
          >
            <span className="text-xl">🏆</span>
            <span>Upload Results</span>
          </button>
          <button
            onClick={async () => {
              const token = localStorage.getItem("admin_token");
              const res = await fetch("/api/export", {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "participants.csv";
                a.click();
                URL.revokeObjectURL(url);
              }
            }}
            className="btn-secondary py-4 text-left flex items-center gap-3"
          >
            <span className="text-xl">📥</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}
