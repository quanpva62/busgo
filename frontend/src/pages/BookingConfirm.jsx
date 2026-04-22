import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    weekday: "short", day: "numeric", month: "numeric", year: "numeric",
  });
}
function formatPrice(price) {
  return price.toLocaleString("vi-VN") + "đ";
}

const STATUS_MAP = {
  pending:   { label: "Chờ thanh toán", icon: "schedule",      cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  paid:      { label: "Đã thanh toán",  icon: "payments",      cls: "bg-green-50 text-green-700 border-green-200" },
  confirmed: { label: "Đã xác nhận",    icon: "check_circle",  cls: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "Đã huỷ",         icon: "cancel",        cls: "bg-red-50 text-red-500 border-red-200" },
  completed: { label: "Hoàn thành",     icon: "task_alt",      cls: "bg-blue-50 text-blue-700 border-blue-200" },
};

export default function BookingConfirm() {
  const { id } = useParams();
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await authFetch(
          `${import.meta.env.VITE_API_URL}/api/bookings/${id}`,
        );
        if (!response.ok) throw new Error("Không tìm thấy đơn đặt vé");
        const data = await response.json();
        setBooking(data.booking);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (!booking) return null;

  const status = STATUS_MAP[booking.status] ?? STATUS_MAP.pending;
  const seats = booking.bookingSeats?.map((bs) => bs.seat.seat.seatLabel).join(", ");

  async function handlePay() {
    setPaying(true);
    try {
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/api/payments/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.paymentUrl;
    } catch (err) {
      alert(err.message);
      setPaying(false);
    }
  }

  return (
    <main className="min-h-screen pt-24 pb-16 bg-surface-container-low">
      <div className="max-w-2xl mx-auto px-6">

        {/* Status banner */}
        <div className={`flex items-center gap-3 p-4 rounded-2xl border mb-6 ${status.cls}`}>
          <span className="material-symbols-outlined text-2xl">{status.icon}</span>
          <div>
            <p className="font-black text-base">{status.label}</p>
            <p className="text-xs font-medium opacity-70">
              Mã đơn: {booking.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Card chính */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          {/* Route header */}
          <div className="bg-primary/5 px-6 py-5 border-b border-outline-variant/20">
            <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">
              Lộ trình
            </p>
            <p className="text-2xl font-black text-on-surface">
              {booking.trip.route.fromCity} → {booking.trip.route.toCity}
            </p>
            <p className="text-secondary text-sm mt-1">
              {formatDate(booking.trip.departureTime)}
            </p>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Giờ đi / đến */}
            <div className="flex gap-8">
              <div>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Khởi hành</p>
                <p className="text-xl font-black">{formatTime(booking.trip.departureTime)}</p>
                <p className="text-xs text-secondary mt-0.5">{booking.pickupAddress}</p>
              </div>
              <div className="flex items-center text-outline-variant/60 text-xl">→</div>
              <div>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Đến nơi</p>
                <p className="text-xl font-black">{formatTime(booking.trip.arrivalTime)}</p>
                <p className="text-xs text-secondary mt-0.5">{booking.dropoffAddress}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-outline-variant/20" />

            {/* Hành khách */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Hành khách</p>
                <p className="font-bold text-on-surface">{booking.passengerName}</p>
                <p className="text-sm text-secondary">{booking.passengerPhone}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Ghế</p>
                <p className="font-bold text-primary">{seats}</p>
                <p className="text-sm text-secondary">{booking.bookingSeats?.length} ghế</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-outline-variant/20" />

            {/* Giá */}
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Tổng cộng</p>
              <p className="text-2xl font-black text-primary">{formatPrice(booking.totalPrice)}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {booking.status === "pending" && (
            <button
              onClick={handlePay}
              disabled={paying}
              className="flex-1 py-3 bg-linear-to-br from-primary-container to-primary text-white font-bold rounded-xl hover:opacity-95 transition-all disabled:opacity-60 hover:cursor-pointer"
            >
              {paying ? "Đang xử lý..." : "Thanh toán ngay"}
            </button>
          )}
          {booking.status === "paid" && (
            <button
              onClick={() => navigate(`/tickets/${booking.id}`)}
              className="flex-1 py-3 bg-linear-to-br from-primary-container to-primary text-white font-bold rounded-xl hover:opacity-95 transition-all hover:cursor-pointer"
            >
              Xem vé
            </button>
          )}
          <button
            onClick={() => navigate("/profile", { state: { tab: 2 } })}
            className="flex-1 py-3 bg-white border border-outline-variant/30 text-on-surface font-bold rounded-xl hover:bg-surface-container-low transition-all hover:cursor-pointer"
          >
            Xem lịch sử đặt vé
          </button>
        </div>
      </div>
    </main>
  );
}
