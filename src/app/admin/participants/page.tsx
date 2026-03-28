"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner, EmptyState } from "@/components/UI";
import { QrScanner } from "@/components/QrScanner";
import { getNextBibNumber, getParticipantCategoryLabel, type User } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminParticipantsPage() {
  const router = useRouter();
  const [participants, setParticipants] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [bibModal, setBibModal] = useState<{ open: boolean; userId: string; bib: string }>({
    open: false,
    userId: "",
    bib: "",
  });
  const perPage = 20;

  const openBibModal = (userId: string) => {
    setBibModal({ open: true, userId, bib: getNextBibNumber(participants) });
  };

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    fetchParticipants(token);
  }, [router]);

  const fetchParticipants = async (token: string) => {
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
      setParticipants(data.participants || []);
    } catch {
      toast.error("Failed to load participants");
    } finally {
      setLoading(false);
    }
  };

  const assignBib = async () => {
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch("/api/assign-bib", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: bibModal.userId, bibNumber: bibModal.bib }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Bib assigned!");
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === bibModal.userId ? { ...p, bib_number: data.bibNumber || bibModal.bib } : p
          )
        );
      } else {
        toast.error(data.error || "Failed to assign bib");
      }
    } catch {
      toast.error("Network error");
    }
    setBibModal({ open: false, userId: "", bib: "" });
  };

  const checkIn = async (userId: string) => {
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Checked in!");
        setParticipants((prev) =>
          prev.map((p) => (p.id === userId ? { ...p, checkin_status: true, bib_number: data.user?.bib_number || p.bib_number } : p))
        );
      } else {
        toast.error(data.error || "Check-in failed");
      }
    } catch {
      toast.error("Check-in failed");
    }
  };

  const checkInByQr = async (qrCode: string) => {
    const token = localStorage.getItem("admin_token");
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ qrCode }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Scan check-in failed");
    }

    toast.success(`${data.user?.name || "Participant"} checked in from QR`);
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === data.user?.id
          ? { ...p, checkin_status: true, bib_number: data.user?.bib_number || p.bib_number }
          : p
      )
    );
  };

  const filtered = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.bib_number && p.bib_number.includes(search))
  );

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading participants..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">Participants</h1>
          <p className="text-gray-400 mt-1">{participants.length} registered</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <input
          type="text"
          className="input-field max-w-md"
          placeholder="Search by name, email, or bib..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <QrScanner onScan={checkInByQr} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="👥" title="No Participants" description="No matching participants found." />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block glass overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Email</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Phone</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Category</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Bib #</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Check-in</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{p.email}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{p.phone}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full bg-white/10 text-xs">{getParticipantCategoryLabel(p)}</span>
                      </td>
                      <td className="px-4 py-3 font-mono">{p.bib_number || "—"}</td>
                      <td className="px-4 py-3">
                        {p.checkin_status ? (
                          <span className="text-green-400 text-sm">✓ Done</span>
                        ) : (
                          <span className="text-yellow-400 text-sm">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {!p.bib_number && (
                            <button
                              onClick={() => openBibModal(p.id)}
                              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs rounded-lg transition-colors"
                            >
                              Generate Bib
                            </button>
                          )}
                          {!p.checkin_status && (
                            <button
                              onClick={() => checkIn(p.id)}
                              className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs rounded-lg transition-colors"
                            >
                              Check In
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3 mb-6">
            {paginated.map((p) => (
              <div key={p.id} className="glass p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 truncate">{p.email}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-white/10 text-xs shrink-0 ml-2">
                    {getParticipantCategoryLabel(p)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mb-3">
                  <span>📱 {p.phone}</span>
                  <span>🏷️ Bib: {p.bib_number || "—"}</span>
                  <span>
                    {p.checkin_status ? "✅ Checked In" : "⏳ Pending"}
                  </span>
                </div>
                <div className="flex gap-2">
                  {!p.bib_number && (
                    <button
                      onClick={() => openBibModal(p.id)}
                      className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs rounded-lg transition-colors flex-1"
                    >
                      Generate Bib
                    </button>
                  )}
                  {!p.checkin_status && (
                    <button
                      onClick={() => checkIn(p.id)}
                      className="px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs rounded-lg transition-colors flex-1"
                    >
                      Check In
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
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

      {/* Bib Assignment Modal */}
      {bibModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setBibModal({ open: false, userId: "", bib: "" })} />
          <div className="glass-strong p-6 max-w-sm w-full relative animate-slide-up">
            <h3 className="text-lg font-bold mb-4">Assign Bib Number</h3>
            <p className="mb-3 text-sm text-slate-400">Suggested sequence starts at 1000. You can override if needed.</p>
            <input
              type="text"
              className="input-field mb-4"
              placeholder="Enter bib number (e.g., 1000)"
              value={bibModal.bib}
              onChange={(e) => setBibModal({ ...bibModal, bib: e.target.value })}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setBibModal({ open: false, userId: "", bib: "" })}
                className="btn-secondary text-sm px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={assignBib}
                disabled={!bibModal.bib.trim()}
                className="btn-primary text-sm px-4 py-2"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
