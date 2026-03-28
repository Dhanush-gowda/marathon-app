"use client";

import { useEffect, useId, useRef, useState } from "react";
import toast from "react-hot-toast";

export function QrScanner({
  onScan,
}: {
  onScan: (qrCode: string) => Promise<void>;
}) {
  const scannerElementId = useId().replace(/[:]/g, "");
  const scannerRef = useRef<any>(null);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const stopScanner = async () => {
    if (!scannerRef.current) {
      return;
    }

    try {
      await scannerRef.current.stop();
    } catch {
      // noop
    }

    try {
      await scannerRef.current.clear();
    } catch {
      // noop
    }

    scannerRef.current = null;
    setActive(false);
  };

  useEffect(() => {
    return () => {
      stopScanner().catch(() => null);
    };
  }, []);

  const startScanner = async () => {
    setLoading(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(scannerElementId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          await onScan(decodedText);
          await stopScanner();
        },
        () => null
      );

      setActive(true);
    } catch {
      toast.error("Camera scan is unavailable. Use the manual QR code field.");
    } finally {
      setLoading(false);
    }
  };

  const submitManualCode = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!manualCode.trim()) {
      return;
    }

    try {
      await onScan(manualCode.trim());
      setManualCode("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "QR check-in failed");
    }
  };

  return (
    <div className="glass p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">QR check-in</p>
          <p className="mt-1 text-xs text-slate-400">Scan the registration ticket or paste the QR payload.</p>
        </div>
        {active ? (
          <button onClick={() => stopScanner()} className="btn-secondary px-4 py-2 text-xs">
            Stop
          </button>
        ) : (
          <button onClick={startScanner} disabled={loading} className="btn-primary px-4 py-2 text-xs">
            {loading ? "Opening..." : "Start Scan"}
          </button>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 p-3">
        {active ? <div className="scan-line mb-2 h-1 rounded-full bg-cyan-400/70" /> : null}
        <div id={scannerElementId} className="min-h-[180px] rounded-xl bg-black/40" />
      </div>

      <form onSubmit={submitManualCode} className="mt-4 space-y-3">
        <textarea
          value={manualCode}
          onChange={(event) => setManualCode(event.target.value)}
          rows={3}
          className="input-field resize-none"
          placeholder="Paste TURAHALLI-RUN|participant-id|bib|email|category"
        />
        <button type="submit" className="btn-secondary w-full justify-center">
          Check In From QR Text
        </button>
      </form>
    </div>
  );
}