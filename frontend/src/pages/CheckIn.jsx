import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Html5Qrcode } from "html5-qrcode";

const API = import.meta.env.VITE_API_URL;

export default function CheckIn() {
  const { authFetch } = useAuth();
  const scannerRef = useRef(null);
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    if (!scanning) return;
    const qr = new Html5Qrcode("qr-reader");
    scannerRef.current = qr;

    qr.start(
      {
        facingMode: "environment",
      },
      {
        fps: 10,
        qrbox: 250,
      },
      async (decoded) => {
        await qr.stop();
        setScanning(false);
        const res = await authFetch(`${API}/api/tickets/checkin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrCode: decoded }),
        });
        const data = await res.json();
        setResult({ ok: res.ok, ...data });
      },
      () => {},
    ).catch((e) =>
      setResult({
        ok: false,
        error: e.message || "Không thể khởi động camera",
      }),
    );

    return () => {
      if (qr.isScanning) qr.stop().catch(() => {});
    };
  }, [authFetch, scanning]);

  function rescan() {
    setResult(null);
    setScanning(true);
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-black">Check-in vé</h1>

      <div id="qr-reader" className="w-full" />
      {result && (
        <div
          className={`p-4 rounded-2xl ${result.ok ? "bg-green-50 border border-green-300" : "bg-red-50 border border-red-300"}`}
        >
          <p className="font-bold">
            {result.ok ? "✅ " + result.message : "❌ " + result.error}
          </p>
          {result.ticket && (
            <div className="mt-2 text-sm space-y-1">
              <p>
                Khách: <b>{result.ticket.booking.passengerName}</b>
              </p>
              <p>
                Tuyến: {result.ticket.booking.trip.route.fromCity} →{" "}
                {result.ticket.booking.trip.route.toCity}
              </p>
              <p>
                Mã vé: <code>{result.ticket.ticketCode}</code>
              </p>
              {result.usedAt && (
                <p className="text-red-600">
                  Đã dùng lúc: {new Date(result.usedAt).toLocaleString("vi-VN")}
                </p>
              )}
            </div>
          )}
          <button
            onClick={rescan}
            className="mt-3 px-4 py-2 bg-primary text-white rounded-xl font-bold"
          >
            Quét tiếp
          </button>
        </div>
      )}
    </div>
  );
}
