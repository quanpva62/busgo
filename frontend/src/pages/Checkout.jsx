import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Checkout = () => {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();
  const [passengerName, setPassengerName] = useState(user?.fullName || "");
  const [passengerPhone, setPassengerPhone] = useState(user?.phone || "");
  const [passengerEmail, setPassengerEmail] = useState(user?.email || "");
  const selectedSeats = useLocation().state?.selectedSeats || [];
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  const { id } = useParams();

  useEffect(() => {
    if (selectedSeats.length === 0) {
      navigate(`/trips/${id}`, { replace: true });
    }
  }, [selectedSeats.length, id, navigate]);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/trips/${id}`,
        );
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setTrip(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await authFetch(
        `${import.meta.env.VITE_API_URL}/api/bookings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tripId: id,
            seatIds: selectedSeats.map((s) => s.id),
            passengerName,
            passengerPhone,
            passengerEmail,
            promoCode: promoCode.trim() || undefined,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      // Tạo payment URL và redirect sang VNPay
      const paymentRes = await authFetch(
        `${import.meta.env.VITE_API_URL}/api/payments/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: data.booking.id }),
        },
      );
      const paymentData = await paymentRes.json();
      if (!paymentRes.ok)
        throw new Error(paymentData.error || "Không thể tạo link thanh toán");

      window.location.href = paymentData.paymentUrl;
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-secondary">
        Đang tải...
      </div>
    );

  if (!trip) return null;

  const totalPrice = trip.price * selectedSeats.length;

  return (
    <main className="min-h-screen pt-24 pb-16 bg-surface-container-low">
      <div className="max-w-360 mx-auto px-6">
        {/* Stepper */}
        <div className="flex items-center gap-3 mb-10">
          {["Chọn chuyến", "Thông tin đặt vé", "Thanh toán"].map(
            (step, idx) => (
              <div key={step} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      idx === 1
                        ? "bg-primary text-white"
                        : idx < 1
                          ? "bg-primary/20 text-primary"
                          : "bg-surface-container-highest text-secondary"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`text-sm font-bold ${idx === 1 ? "text-primary" : "text-secondary"}`}
                  >
                    {step}
                  </span>
                </div>
                {idx < 2 && <div className="w-8 h-px bg-outline-variant/40" />}
              </div>
            ),
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left — Form */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Thông tin hành khách */}
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
                <h2 className="text-lg font-bold text-on-surface">
                  Thông tin hành khách
                </h2>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-on-surface font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      placeholder="0912 345 678"
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-on-surface font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase">
                    Email nhận vé
                  </label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={passengerEmail}
                    onChange={(e) => setPassengerEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-on-surface font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Điểm đón / trả */}
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-on-surface">
                  Điểm đón và trả khách
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase">
                      Điểm đón
                    </label>
                    <div className="flex items-start gap-3 p-4 bg-surface-container-low rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />
                      <p className="text-on-surface font-medium text-sm">
                        {trip.pickupAddress}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase">
                      Điểm trả
                    </label>
                    <div className="flex items-start gap-3 p-4 bg-surface-container-low rounded-xl">
                      <div className="w-2 h-2 rounded-full border-2 border-primary mt-1 shrink-0" />
                      <p className="text-on-surface font-medium text-sm">
                        {trip.dropoffAddress}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mã giảm giá */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase mb-3">
                  Mã giảm giá
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="BUSGOVUI2024"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-3 bg-surface-container-low rounded-xl text-on-surface font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button type="submit" className="hidden" id="submit-btn" />
                </div>
              </div>
            </form>
          </div>

          {/* Right — Order summary */}
          <aside className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-28 space-y-5">
              <h2 className="text-lg font-bold text-on-surface">
                Thông tin đơn hàng
              </h2>

              {/* Tuyến */}
              <div>
                <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">
                  Lộ trình
                </p>
                <p className="font-black text-on-surface">
                  {trip.route.fromCity} → {trip.route.toCity}
                </p>
                <p className="text-secondary text-sm">
                  {new Date(trip.departureTime).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Giờ đi/đến */}
              <div className="space-y-3 py-4 border-t border-b border-outline-variant/20">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="font-bold text-on-surface">
                      {new Date(trip.departureTime).toLocaleTimeString(
                        "vi-VN",
                        { hour: "2-digit", minute: "2-digit", hour12: false },
                      )}
                    </p>
                    <p className="text-secondary text-xs">
                      {trip.pickupAddress}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full border-2 border-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="font-bold text-on-surface">
                      {new Date(trip.arrivalTime).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </p>
                    <p className="text-secondary text-xs">
                      {trip.dropoffAddress}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ghế */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">
                    Ghế đã chọn
                  </p>
                  <p className="font-bold text-primary">
                    {selectedSeats.map((ts) => ts.seat.seatLabel).join(", ")}
                  </p>
                </div>
                <p className="font-bold text-on-surface">
                  x{selectedSeats.length}
                </p>
              </div>

              {/* Giá */}
              <div className="space-y-2 pt-4 border-t border-outline-variant/20">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary font-medium">
                    Giá vé cơ bản
                  </span>
                  <span className="font-bold">
                    {totalPrice.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-outline-variant/20">
                  <span className="font-bold text-on-surface">Tổng cộng</span>
                  <span className="text-2xl font-black text-primary">
                    {totalPrice.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              <button
                disabled={submitting}
                onClick={() => document.getElementById("submit-btn").click()}
                className="w-full py-4 bg-linear-to-br from-primary-container to-primary text-white font-bold rounded-xl shadow-lg hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-60 hover:cursor-pointer"
              >
                {submitting ? "Đang xử lý..." : "Thanh toán →"}
              </button>

              <p className="text-xs text-secondary text-center">
                Đơn hàng giữ chỗ trong vòng 15 phút sau khi đặt.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Checkout;
