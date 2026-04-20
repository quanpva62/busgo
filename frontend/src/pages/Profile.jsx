import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

function formatPrice(price) {
  return price.toLocaleString("vi-VN") + "đ";
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

const STATUS_LABELS = {
  pending:   { label: "Chờ thanh toán", cls: "bg-yellow-100 text-yellow-700" },
  paid:      { label: "Đã thanh toán",  cls: "bg-green-100 text-green-700" },
  confirmed: { label: "Đã xác nhận",    cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Đã huỷ",         cls: "bg-red-100 text-red-500" },
  completed: { label: "Hoàn thành",     cls: "bg-blue-100 text-blue-700" },
};

const TABS = ["Thông tin", "Mật khẩu", "Lịch sử đặt vé"];

export default function Profile() {
  const { user, login, authFetch, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab ?? 0);

  // Tab 0 — profile
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");

  // Tab 1 — password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  // Tab 2 — bookings
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    if (tab === 2 && bookings.length === 0) {
      setBookingsLoading(true);
      authFetch(`${import.meta.env.VITE_API_URL}/api/bookings/my`)
        .then((r) => r.json())
        .then((data) => setBookings(Array.isArray(data) ? data : []))
        .finally(() => setBookingsLoading(false));
    }
  }, [tab, authFetch, bookings.length]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    setSaveErr("");
    try {
      const res = await authFetch(
        `${import.meta.env.VITE_API_URL}/api/auth/me`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, phone }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data.user, localStorage.getItem("token"), localStorage.getItem("refreshToken"));
      setSaveMsg("Cập nhật thành công!");
    } catch (err) {
      setSaveErr(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwErr("Mật khẩu xác nhận không khớp");
      return;
    }
    setPwSaving(true);
    setPwMsg("");
    setPwErr("");
    try {
      const res = await authFetch(
        `${import.meta.env.VITE_API_URL}/api/auth/password`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPwMsg("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwErr(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  if (!user) return null;

  const initials = user.fullName
    ?.split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <main className="min-h-screen pt-24 pb-16 bg-surface-container-low">
      <div className="max-w-4xl mx-auto px-6">
        {/* Avatar + tên */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-xl shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface">
              {user.fullName}
            </h1>
            <p className="text-secondary text-sm">{user.email}</p>
          </div>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="ml-auto text-sm text-secondary hover:text-red-500 font-semibold transition-colors"
          >
            Đăng xuất
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-container rounded-2xl p-1 mb-6 w-fit">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === i
                  ? "bg-white text-primary shadow-sm"
                  : "text-secondary hover:text-on-surface"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab 0 — Thông tin */}
        {tab === 0 && (
          <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl p-6 shadow-sm space-y-5 max-w-lg">
            <h2 className="text-lg font-bold">Thông tin cá nhân</h2>
            {saveMsg && <p className="text-green-600 text-sm font-medium">{saveMsg}</p>}
            {saveErr && <p className="text-red-500 text-sm font-medium">{saveErr}</p>}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase">
                Họ và tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 bg-surface-container-highest rounded-xl font-medium text-secondary cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-linear-to-br from-primary-container to-primary text-white font-bold rounded-xl hover:opacity-95 transition-all disabled:opacity-60 hover:cursor-pointer"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        )}

        {/* Tab 1 — Mật khẩu */}
        {tab === 1 && (
          <form onSubmit={handleChangePassword} className="bg-white rounded-2xl p-6 shadow-sm space-y-5 max-w-lg">
            <h2 className="text-lg font-bold">Đổi mật khẩu</h2>
            {pwMsg && <p className="text-green-600 text-sm font-medium">{pwMsg}</p>}
            {pwErr && <p className="text-red-500 text-sm font-medium">{pwErr}</p>}
            {[
              { label: "Mật khẩu hiện tại", value: currentPassword, set: setCurrentPassword },
              { label: "Mật khẩu mới", value: newPassword, set: setNewPassword },
              { label: "Xác nhận mật khẩu mới", value: confirmPassword, set: setConfirmPassword },
            ].map(({ label, value, set }) => (
              <div key={label} className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase">
                  {label}
                </label>
                <input
                  type="password"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-surface-container-low rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={pwSaving}
              className="px-6 py-3 bg-linear-to-br from-primary-container to-primary text-white font-bold rounded-xl hover:opacity-95 transition-all disabled:opacity-60 hover:cursor-pointer"
            >
              {pwSaving ? "Đang lưu..." : "Đổi mật khẩu"}
            </button>
          </form>
        )}

        {/* Tab 2 — Lịch sử */}
        {tab === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Lịch sử đặt vé</h2>
            {bookingsLoading && (
              <p className="text-secondary text-sm">Đang tải...</p>
            )}
            {!bookingsLoading && bookings.length === 0 && (
              <p className="text-secondary text-sm">Chưa có đơn đặt vé nào.</p>
            )}
            {bookings.map((b) => {
              const status = STATUS_LABELS[b.status] || { label: b.status, cls: "bg-gray-100 text-gray-600" };
              const seats = b.bookingSeats?.map((bs) => bs.seat.seat.seatLabel).join(", ");
              return (
                <div
                  key={b.id}
                  onClick={() => navigate(`/booking/${b.id}`)}
                  className="bg-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:shadow-md hover:bg-surface-container-low/50 active:scale-[0.99] transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-on-surface">
                      {b.trip.route.fromCity} → {b.trip.route.toCity}
                    </p>
                    <p className="text-secondary text-sm mt-0.5">
                      {formatDate(b.trip.departureTime)} · Ghế: {seats}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.cls}`}>
                      {status.label}
                    </span>
                    <p className="font-black text-primary">
                      {formatPrice(b.totalPrice)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
