import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { QRCodeSVG } from "qrcode.react";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    weekday: "long", day: "numeric", month: "numeric", year: "numeric",
  });
}

export default function Ticket() {
  const { bookingId } = useParams();
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    authFetch(`${import.meta.env.VITE_API_URL}/api/tickets/${bookingId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTicket(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bookingId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-secondary">
        Đang tải...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );

  if (!ticket) return null;

  const { booking, ticketCode, qrCode, issuedAt } = ticket;
  const { trip, bookingSeats, passengerName, passengerPhone, totalPrice } = booking;
  const seats = bookingSeats?.map((bs) => bs.seat.seat.seatLabel).join(", ");

  return (
    <main className="min-h-screen pt-24 pb-16 bg-surface-container-low flex flex-col items-center px-4">
      <div className="w-full max-w-sm">
        {/* Ticket card */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-br from-primary-container to-primary px-6 py-5 text-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xl font-black tracking-tighter">BusGo</span>
              <span className="material-symbols-outlined text-3xl">confirmation_number</span>
            </div>
            <p className="text-white/70 text-xs font-medium">E-TICKET</p>
          </div>

          {/* Route */}
          <div className="px-6 pt-5 pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-center">
                <p className="text-2xl font-black text-on-surface">{trip.route.fromCity}</p>
                <p className="text-xs text-secondary mt-0.5">{formatTime(trip.departureTime)}</p>
              </div>
              <div className="flex-1 flex items-center gap-1 px-2">
                <div className="flex-1 h-px bg-outline-variant/40" />
                <span className="material-symbols-outlined text-secondary text-base">directions_bus</span>
                <div className="flex-1 h-px bg-outline-variant/40" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-on-surface">{trip.route.toCity}</p>
                <p className="text-xs text-secondary mt-0.5">{formatTime(trip.arrivalTime)}</p>
              </div>
            </div>
            <p className="text-center text-secondary text-xs mt-2">{formatDate(trip.departureTime)}</p>
          </div>

          {/* Dashed divider */}
          <div className="relative mx-6 my-3">
            <div className="border-t border-dashed border-outline-variant/50" />
            <div className="absolute -left-9 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface-container-low" />
            <div className="absolute -right-9 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface-container-low" />
          </div>

          {/* Details grid */}
          <div className="px-6 pb-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Hành khách</p>
              <p className="font-bold text-on-surface text-sm">{passengerName}</p>
              <p className="text-secondary text-xs">{passengerPhone}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Ghế</p>
              <p className="font-bold text-primary text-sm">{seats}</p>
              <p className="text-secondary text-xs">{bookingSeats?.length} ghế</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Tổng tiền</p>
              <p className="font-bold text-on-surface text-sm">{totalPrice.toLocaleString("vi-VN")}đ</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Ngày xuất vé</p>
              <p className="font-bold text-on-surface text-sm">
                {new Date(issuedAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>

          {/* Dashed divider */}
          <div className="relative mx-6 mb-3">
            <div className="border-t border-dashed border-outline-variant/50" />
            <div className="absolute -left-9 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface-container-low" />
            <div className="absolute -right-9 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface-container-low" />
          </div>

          {/* QR Code */}
          <div className="px-6 pb-6 flex flex-col items-center gap-3">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-outline-variant/20">
              <QRCodeSVG value={qrCode} size={160} level="M" />
            </div>
            <div className="text-center">
              <p className="font-mono font-black text-on-surface tracking-widest text-sm">{ticketCode}</p>
              <p className="text-secondary text-xs mt-0.5">Mã vé</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => navigate("/profile", { state: { tab: 2 } })}
            className="flex-1 py-3 bg-white border border-outline-variant/30 text-on-surface font-bold rounded-xl hover:bg-surface-container-low transition-all"
          >
            Lịch sử đặt vé
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 py-3 bg-linear-to-br from-primary-container to-primary text-white font-bold rounded-xl hover:opacity-95 transition-all"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </main>
  );
}
