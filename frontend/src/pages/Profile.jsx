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

const CATEGORY_LABELS = {
  dangerous_driving: "Lái xe nguy hiểm",
  phone_while_driving: "Dùng điện thoại khi lái",
  wrong_vehicle: "Sai phương tiện",
  dirty_vehicle: "Xe bẩn",
  wrong_stop: "Sai điểm dừng",
  late_departure: "Trễ giờ khởi hành",
  rude_behavior: "Thái độ thô lỗ",
  other: "Khác",
};

const SEVERITY_LABELS = {
  low: { label: "Nhẹ", cls: "bg-yellow-100 text-yellow-700" },
  medium: { label: "Trung bình", cls: "bg-orange-100 text-orange-700" },
  high: { label: "Nghiêm trọng", cls: "bg-red-100 text-red-600" },
};

const REPORT_STATUS_LABELS = {
  pending: { label: "Chờ xử lý", cls: "bg-gray-100 text-gray-600" },
  reviewing: { label: "Đang xem xét", cls: "bg-blue-100 text-blue-700" },
  resolved: { label: "Đã xử lý", cls: "bg-green-100 text-green-700" },
  dismissed: { label: "Đã bác bỏ", cls: "bg-red-100 text-red-500" },
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

  // Report form state
  const [reportingId, setReportingId] = useState(null);
  const [reportForm, setReportForm] = useState({ category: "", severity: "medium", details: "" });
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState("");

  // Cancel booking
  const [cancellingId, setCancellingId] = useState(null);

  async function handleCancelBooking(booking) {
    const isPaid = booking.status === "paid";
    const hoursLeft = (new Date(booking.trip.departureTime) - new Date()) / 3600000;

    let refundMsg = "";
    if (isPaid) {
      if (hoursLeft > 24) refundMsg = "Bạn sẽ được hoàn 100% giá vé.";
      else if (hoursLeft > 12) refundMsg = "Bạn sẽ được hoàn 50% giá vé.";
      else refundMsg = "Không được hoàn tiền (huỷ dưới 12 giờ trước khởi hành).";
    }

    const msg = isPaid
      ? `Huỷ vé đã thanh toán?\n${refundMsg}\n\nXác nhận huỷ?`
      : "Bạn có chắc muốn huỷ đặt vé này không?";
    if (!window.confirm(msg)) return;

    setCancellingId(booking.id);
    try {
      const res = await authFetch(
        `${import.meta.env.VITE_API_URL}/api/bookings/${booking.id}/cancel`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: data.status } : b))
      );
      if (data.refundAmount > 0) {
        alert(`Hoàn tiền: ${data.refundAmount.toLocaleString("vi-VN")}đ\n${data.refundNote}`);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setCancellingId(null);
    }
  }


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

  async function handleSubmitReport(bookingId, driverId) {
    if (!reportForm.category || !reportForm.details.trim()) return;
    setReportSubmitting(true);
    setReportError("");
    try {
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, driverId, ...reportForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // đánh dấu booking đã có report
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, reports: [data.report] } : b))
      );
      setReportingId(null);
      setReportForm({ category: "", severity: "medium", details: "" });
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportSubmitting(false);
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
        <div className="flex flex-wrap items-center gap-4 sm:gap-5 mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-lg sm:text-xl shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface truncate">
              {user.fullName}
            </h1>
            <p className="text-secondary text-sm truncate">{user.email}</p>
          </div>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="text-sm text-secondary hover:text-red-500 font-semibold transition-colors shrink-0"
          >
            Đăng xuất
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-container rounded-2xl p-1 mb-6 w-full sm:w-fit overflow-x-auto">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`px-4 sm:px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
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
              const eligible = b.status === "paid" && b.trip.status === "completed";
              const hasReport = b.reports?.length > 0;
              return (
                <div key={b.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {/* Clickable booking info */}
                  <div
                    onClick={() => {
                      if (b.status === "paid") navigate(`/tickets/${b.id}`);
                      else if (b.status === "pending") navigate(`/booking/${b.id}`);
                    }}
                    className={`p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all ${b.status === "paid" || b.status === "pending" ? "cursor-pointer hover:bg-surface-container-low/50 active:scale-[0.99]" : ""}`}
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

                  {/* Huỷ vé */}
                  {(b.status === "pending" || b.status === "paid") && new Date(b.trip.departureTime) > new Date() && (
                    <div className="px-5 pb-4 border-t border-surface-container-low pt-3 flex items-center justify-between">
                      <button
                        onClick={() => handleCancelBooking(b)}
                        disabled={cancellingId === b.id}
                        className="text-sm text-red-500 font-bold flex items-center gap-1 hover:opacity-70 disabled:opacity-50 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-sm">cancel</span>
                        {cancellingId === b.id ? "Đang huỷ..." : "Huỷ đặt vé"}
                      </button>
                      {b.status === "paid" && (
                        <span className="text-xs text-secondary">
                          {(() => {
                            const h = (new Date(b.trip.departureTime) - new Date()) / 3600000;
                            if (h > 24) return "Hoàn 100%";
                            if (h > 12) return "Hoàn 50%";
                            return "Không hoàn tiền";
                          })()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Report section */}
                  {eligible && (
                    <div className="px-5 pb-4 border-t border-surface-container-low">
                      {hasReport ? (
                        <div className="pt-3 space-y-1.5">
                          <p className="text-[10px] font-bold tracking-widest text-secondary uppercase">Báo cáo của bạn</p>
                          {(() => {
                            const r = b.reports[0];
                            const sev = SEVERITY_LABELS[r.severity];
                            const st = REPORT_STATUS_LABELS[r.status];
                            return (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-on-surface">{CATEGORY_LABELS[r.category] ?? r.category}</span>
                                {sev && <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sev.cls}`}>{sev.label}</span>}
                                {st && <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${st.cls}`}>{st.label}</span>}
                              </div>
                            );
                          })()}
                        </div>
                      ) : reportingId === b.id ? (
                        <div className="pt-3 space-y-3">
                          <p className="text-sm font-bold">Báo cáo sự cố</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold tracking-widest text-secondary uppercase">Loại sự cố</label>
                              <select
                                value={reportForm.category}
                                onChange={(e) => setReportForm((f) => ({ ...f, category: e.target.value }))}
                                className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                              >
                                <option value="">-- Chọn loại --</option>
                                {[
                                  ["dangerous_driving", "Lái xe nguy hiểm"],
                                  ["phone_while_driving", "Dùng điện thoại khi lái"],
                                  ["wrong_vehicle", "Sai phương tiện"],
                                  ["dirty_vehicle", "Xe bẩn"],
                                  ["wrong_stop", "Sai điểm dừng"],
                                  ["late_departure", "Trễ giờ khởi hành"],
                                  ["rude_behavior", "Thái độ thô lỗ"],
                                  ["other", "Khác"],
                                ].map(([val, label]) => (
                                  <option key={val} value={val}>{label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold tracking-widest text-secondary uppercase">Mức độ</label>
                              <select
                                value={reportForm.severity}
                                onChange={(e) => setReportForm((f) => ({ ...f, severity: e.target.value }))}
                                className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                              >
                                <option value="low">Nhẹ</option>
                                <option value="medium">Trung bình</option>
                                <option value="high">Nghiêm trọng</option>
                              </select>
                            </div>
                          </div>
                          <textarea
                            value={reportForm.details}
                            onChange={(e) => setReportForm((f) => ({ ...f, details: e.target.value }))}
                            placeholder="Mô tả chi tiết sự cố..."
                            rows={3}
                            className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          {reportError && <p className="text-red-500 text-xs">{reportError}</p>}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSubmitReport(b.id, b.trip.driverId)}
                              disabled={!reportForm.category || !reportForm.details.trim() || reportSubmitting}
                              className="px-4 py-1.5 bg-red-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
                            >
                              {reportSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
                            </button>
                            <button
                              onClick={() => { setReportingId(null); setReportError(""); }}
                              className="px-4 py-1.5 text-sm text-secondary hover:text-on-surface transition-colors"
                            >
                              Huỷ
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setReportingId(b.id); setReportForm({ category: "", severity: "medium", details: "" }); setReportError(""); }}
                          className="mt-3 text-sm text-red-500 font-bold flex items-center gap-1 cursor-pointer group"
                        >
                          <span className="material-symbols-outlined text-sm">flag</span>
                          <span className="group-hover:underline">Báo cáo sự cố</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
