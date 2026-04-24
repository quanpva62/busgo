import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
const API = import.meta.env.VITE_API_URL;

function formatPrice(p) {
  return (p ?? 0).toLocaleString("vi-VN") + "đ";
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}
function formatDateTime(iso) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TRIP_STATUS = {
  scheduled: { label: "Đã lên lịch", cls: "bg-blue-100 text-blue-700" },
  running: { label: "Đang chạy", cls: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Hoàn thành", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Đã huỷ", cls: "bg-red-100 text-red-500" },
};
const BOOKING_STATUS = {
  pending: { label: "Chờ TT", cls: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Đã TT", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Đã huỷ", cls: "bg-red-100 text-red-500" },
};
const REPORT_STATUS = {
  pending: { label: "Chờ xử lý", cls: "bg-gray-100 text-gray-600" },
  reviewing: { label: "Đang xem", cls: "bg-blue-100 text-blue-700" },
  resolved: { label: "Đã xử lý", cls: "bg-green-100 text-green-700" },
  dismissed: { label: "Bác bỏ", cls: "bg-red-100 text-red-500" },
};
const SEVERITY = {
  low: { label: "Nhẹ", cls: "bg-yellow-100 text-yellow-700" },
  medium: { label: "Trung bình", cls: "bg-orange-100 text-orange-700" },
  high: { label: "Nghiêm trọng", cls: "bg-red-100 text-red-600" },
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

function Badge({ map, value }) {
  const s = map[value] ?? { label: value, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
      <span className="material-symbols-outlined text-3xl text-primary">
        {icon}
      </span>
      <div>
        <p className="text-xs font-bold text-secondary uppercase tracking-widest">
          {label}
        </p>
        <p className="text-2xl font-black text-on-surface">{value}</p>
      </div>
    </div>
  );
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

function TotalRevenueChart({ authFetch }) {
  const [groupBy, setGroupBy] = useState("month");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    const url =
      groupBy === "month"
        ? `${API}/api/admin/revenue-chart?groupBy=month&year=${year}`
        : `${API}/api/admin/revenue-chart?groupBy=year`;
    authFetch(url)
      .then((r) => r.json())
      .then((d) =>
        setRevenueData(
          (d.data ?? []).map((r) => ({
            ...r,
            period:
              groupBy === "month"
                ? `T${new Date(r.period).getMonth() + 1}`
                : `${new Date(r.period).getFullYear()}`,
          })),
        ),
      );
  }, [authFetch, groupBy, year]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-surface-container rounded-xl p-1">
          {[
            ["month", "Theo tháng"],
            ["year", "Theo năm"],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setGroupBy(k)}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${groupBy === k ? "bg-white text-primary shadow-sm" : "text-secondary"}`}
            >
              {l}
            </button>
          ))}
        </div>
        {groupBy === "month" && (
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-1.5 text-sm border border-outline-variant/30 rounded-xl focus:outline-none"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={revenueData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis dataKey="period" />
          <YAxis tickFormatter={(v) => v >= 1000000 ? (v / 1000000).toFixed(1) + "M" : v >= 1000 ? (v / 1000).toFixed(0) + "K" : v} width={55} />
          <Tooltip formatter={(v) => v.toLocaleString("vi-VN") + "đ"} />
          <Line dataKey="revenue" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
function TotalBookingsChart({ authFetch }) {
  const [groupBy, setGroupBy] = useState("month");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [bookingData, setBookingData] = useState([]);

  useEffect(() => {
    const url =
      groupBy === "month"
        ? `${API}/api/admin/bookings-chart?groupBy=month&year=${year}`
        : `${API}/api/admin/bookings-chart?groupBy=year`;
    authFetch(url)
      .then((r) => r.json())
      .then((d) =>
        setBookingData(
          (d.data ?? []).map((r) => ({
            ...r,
            period:
              groupBy === "month"
                ? `T${new Date(r.period).getMonth() + 1}`
                : `${new Date(r.period).getFullYear()}`,
          })),
        ),
      );
  }, [authFetch, groupBy, year]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-surface-container rounded-xl p-1">
          {[
            ["month", "Theo tháng"],
            ["year", "Theo năm"],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setGroupBy(k)}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${groupBy === k ? "bg-white text-primary shadow-sm" : "text-secondary"}`}
            >
              {l}
            </button>
          ))}
        </div>
        {groupBy === "month" && (
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-1.5 text-sm border border-outline-variant/30 rounded-xl focus:outline-none"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={bookingData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis dataKey="period" />
          <YAxis allowDecimals={false} width={40} />
          <Tooltip />
          <Line dataKey="bookings" stroke="#3b82f6" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CompanyRevenueChart({ authFetch }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    authFetch(`${API}/api/admin/company-revenue-chart`)
      .then((r) => r.json())
      .then((d) => setData(d.data ?? []));
  }, [authFetch]);
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-secondary">Doanh thu theo nhà xe</p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <XAxis type="number" allowDecimals={false} tickFormatter={(v) => v >= 1000000 ? (v / 1000000).toFixed(1) + "M" : v >= 1000 ? (v / 1000).toFixed(0) + "K" : v} />
          <YAxis type="category" dataKey="name" width={110} />
          <Tooltip formatter={(v) => v.toLocaleString("vi-VN") + "đ"} />
          <Bar dataKey="revenue" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopRoutesChart({ authFetch }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    authFetch(`${API}/api/admin/top-routes-chart`)
      .then((r) => r.json())
      .then((d) =>
        setData(
          (d.data ?? []).map((r) => ({
            route: `${r.fromCity} → ${r.toCity}`,
            bookings: r.bookings,
          })),
        ),
      );
  }, [authFetch]);
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-secondary">Tuyến phổ biến</p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="route" width={90} />
          <Tooltip />
          <Bar dataKey="bookings" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── CompanyAdmin views ───────────────────────────────────────────

function CompanyStats({ authFetch }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    authFetch(`${API}/api/admin/company/stats`)
      .then((r) => r.json())
      .then(setStats);
  }, [authFetch]);
  if (!stats) return <p className="text-secondary text-sm">Đang tải...</p>;
  if (stats.error)
    return (
      <p className="text-red-500 text-sm">
        Không thể tải thống kê: {stats.error}
      </p>
    );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        icon="directions_bus"
        label="Tổng chuyến"
        value={stats.totalTrips ?? 0}
      />
      <StatCard
        icon="confirmation_number"
        label="Đặt vé thành công"
        value={stats.totalBookings ?? 0}
      />
      <StatCard
        icon="payments"
        label="Doanh thu"
        value={formatPrice(stats.totalRevenue)}
      />
    </div>
  );
}

function AddTripForm({ authFetch, onCreated, onCancel }) {
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [form, setForm] = useState({
    routeId: "",
    busId: "",
    driverId: "",
    assistantId: "",
    departureTime: "",
    price: "",
    pickupAddress: "",
    dropoffAddress: "",
  });
  const [recurring, setRecurring] = useState(false);
  const [interval, setInterval] = useState("weekly");
  const [occurrences, setOccurrences] = useState(4);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      authFetch(`${API}/api/admin/routes`).then((r) => r.json()),
      authFetch(`${API}/api/admin/company/buses`).then((r) => r.json()),
      authFetch(`${API}/api/admin/company/drivers?role=driver`).then((r) =>
        r.json(),
      ),
      authFetch(`${API}/api/admin/company/drivers?role=assistant`).then((r) =>
        r.json(),
      ),
    ]).then(([rs, bs, ds, as]) => {
      setRoutes(Array.isArray(rs) ? rs : []);
      setBuses(Array.isArray(bs) ? bs.filter((b) => b.isActive) : []);
      setDrivers(Array.isArray(ds) ? ds.filter((d) => d.isActive) : []);
      setAssistants(Array.isArray(as) ? as.filter((a) => a.isActive) : []);
    });
  }, [authFetch]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await authFetch(`${API}/api/admin/company/trips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        ...(recurring ? { interval, occurrences } : {}),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Có lỗi xảy ra");
    onCreated(data.trip, data.total ?? 1);
  }

  const inputCls =
    "w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30";
  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl p-4 shadow-sm space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          required
          value={form.routeId}
          onChange={(e) => setForm((f) => ({ ...f, routeId: e.target.value }))}
          className={inputCls}
        >
          <option value="">— Tuyến —</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.fromCity} → {r.toCity}
            </option>
          ))}
        </select>
        <select
          required
          value={form.busId}
          onChange={(e) => setForm((f) => ({ ...f, busId: e.target.value }))}
          className={inputCls}
        >
          <option value="">— Xe —</option>
          {buses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.licensePlate} ({b.typeName})
            </option>
          ))}
        </select>
        <select
          required
          value={form.driverId}
          onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}
          className={inputCls}
        >
          <option value="">— Tài xế —</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName}
            </option>
          ))}
        </select>
        <select
          value={form.assistantId}
          onChange={(e) =>
            setForm((f) => ({ ...f, assistantId: e.target.value }))
          }
          className={inputCls}
        >
          <option value="">— Phụ xe (tuỳ chọn) —</option>
          {assistants.map((a) => (
            <option key={a.id} value={a.id}>
              {a.fullName}
            </option>
          ))}
        </select>
        <input
          required
          type="datetime-local"
          value={form.departureTime}
          onChange={(e) =>
            setForm((f) => ({ ...f, departureTime: e.target.value }))
          }
          className={inputCls}
        />
        <input
          required
          type="number"
          placeholder="Giá vé (VND)"
          value={form.price}
          onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          className={inputCls}
        />
        <input
          required
          placeholder="Điểm đón"
          value={form.pickupAddress}
          onChange={(e) =>
            setForm((f) => ({ ...f, pickupAddress: e.target.value }))
          }
          className={inputCls}
        />
        <input
          required
          placeholder="Điểm trả"
          value={form.dropoffAddress}
          onChange={(e) =>
            setForm((f) => ({ ...f, dropoffAddress: e.target.value }))
          }
          className={inputCls}
        />
      </div>
      <div className="flex items-center gap-3 pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-secondary">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="accent-primary"
          />
          Chuyến lặp lại
        </label>
        {recurring && (
          <>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="px-2 py-1 text-sm border border-outline-variant/30 rounded-lg focus:outline-none"
            >
              <option value="daily">Hằng ngày</option>
              <option value="weekly">Hằng tuần</option>
              <option value="monthly">Hằng tháng</option>
            </select>
            <input
              type="number"
              min={2}
              max={52}
              value={occurrences}
              onChange={(e) => setOccurrences(parseInt(e.target.value))}
              className="w-20 px-2 py-1 text-sm border border-outline-variant/30 rounded-lg focus:outline-none"
              placeholder="Số lần"
            />
            <span className="text-xs text-secondary">lần</span>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl disabled:opacity-50"
        >
          {saving ? "Đang tạo..." : recurring ? `Tạo ${occurrences} chuyến` : "Tạo chuyến"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-secondary"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}

function CompanyTrips({ authFetch }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    authFetch(`${API}/api/admin/company/trips`)
      .then((r) => r.json())
      .then((data) => setTrips(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [authFetch]);

  async function changeStatus(id, status) {
    setUpdating(id);
    const res = await authFetch(`${API}/api/admin/company/trips/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok)
      setTrips((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: data.trip.status } : t)),
      );
    setUpdating(null);
  }

  async function deleteTrip(id) {
    if (!confirm("Xoá chuyến này?")) return;
    const res = await authFetch(`${API}/api/admin/company/trips/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error ?? "Không thể xoá");
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }

  async function deleteSeries(seriesId) {
    if (!confirm("Xoá toàn bộ chuyến trong chuỗi này? (Chỉ xoá được nếu chưa có booking)")) return;
    const res = await authFetch(`${API}/api/admin/company/trips/series/${seriesId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error ?? "Không thể xoá chuỗi");
    setTrips((prev) => prev.filter((t) => t.seriesId !== seriesId));
  }

  if (loading) return <p className="text-secondary text-sm">Đang tải...</p>;
  return (
    <div className="space-y-3">
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Thêm chuyến
        </button>
      ) : (
        <AddTripForm
          authFetch={authFetch}
          onCreated={(trip, total) => {
            if (total > 1) {
              authFetch(`${API}/api/admin/company/trips`)
                .then((r) => r.json())
                .then((data) => setTrips(Array.isArray(data) ? data : []));
            } else {
              setTrips((prev) => [trip, ...prev]);
            }
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {trips.length === 0 && (
        <p className="text-secondary text-sm">Chưa có chuyến nào.</p>
      )}
      {trips.map((t) => (
        <div
          key={t.id}
          className="bg-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold">
                {t.route.fromCity} → {t.route.toCity}
              </p>
              {t.seriesId && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                  {t.interval === "daily" ? "Hằng ngày" : t.interval === "weekly" ? "Hằng tuần" : "Hằng tháng"}
                </span>
              )}
            </div>
            <p className="text-secondary text-sm">
              {formatDateTime(t.departureTime)} · {t.bus.typeName} ·{" "}
              {t.driver.fullName}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge map={TRIP_STATUS} value={t.status} />
            <select
              value={t.status}
              disabled={updating === t.id}
              onChange={(e) => changeStatus(t.id, e.target.value)}
              className="text-xs px-2 py-1 border border-outline-variant/30 rounded-lg focus:outline-none"
            >
              <option value="scheduled">Lịch trình</option>
              <option value="running">Đang chạy</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Huỷ</option>
            </select>
            {t.seriesId && (
              <button
                onClick={() => deleteSeries(t.seriesId)}
                className="p-1.5 text-purple-500 hover:bg-purple-50 rounded-lg"
                title="Xoá cả chuỗi"
              >
                <span className="material-symbols-outlined text-base">delete_sweep</span>
              </button>
            )}
            <button
              onClick={() => deleteTrip(t.id)}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
              title="Xoá chuyến này"
            >
              <span className="material-symbols-outlined text-base">delete</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CompanyBookings({ authFetch }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    authFetch(`${API}/api/admin/company/bookings`)
      .then((r) => r.json())
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [authFetch]);
  if (loading) return <p className="text-secondary text-sm">Đang tải...</p>;
  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <div
          key={b.id}
          className="bg-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <p className="font-bold">{b.user?.fullName ?? b.passengerName}</p>
            <p className="text-secondary text-sm">
              {b.trip.route.fromCity} → {b.trip.route.toCity} ·{" "}
              {formatDate(b.trip.departureTime)}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Badge map={BOOKING_STATUS} value={b.status} />
            <p className="font-black text-primary text-sm">
              {formatPrice(b.totalPrice)}
            </p>
          </div>
        </div>
      ))}
      {bookings.length === 0 && (
        <p className="text-secondary text-sm">Chưa có booking nào.</p>
      )}
    </div>
  );
}

// ─── Drivers (driver + assistant) ────────────────────────────────

function DriverForm({ authFetch, initial, onSaved, onCancel }) {
  const [buses, setBuses] = useState([]);
  const [form, setForm] = useState(
    initial ?? {
      fullName: "",
      phone: "",
      driverRole: "driver",
      licenseNo: "",
      licenseType: "",
      busId: "",
    },
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authFetch(`${API}/api/admin/company/buses`)
      .then((r) => r.json())
      .then((data) =>
        setBuses(Array.isArray(data) ? data.filter((b) => b.isActive) : []),
      );
  }, [authFetch]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url = initial
      ? `${API}/api/admin/company/drivers/${initial.id}`
      : `${API}/api/admin/company/drivers`;
    const res = await authFetch(url, {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Có lỗi xảy ra");
    onSaved(data.driver);
  }

  const inputCls =
    "w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30";
  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl p-4 shadow-sm space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          required
          placeholder="Họ tên"
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          className={inputCls}
        />
        <input
          required
          placeholder="Số điện thoại"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className={inputCls}
        />
        {!initial && (
          <select
            value={form.driverRole}
            onChange={(e) =>
              setForm((f) => ({ ...f, driverRole: e.target.value }))
            }
            className={inputCls}
          >
            <option value="driver">Tài xế</option>
            <option value="assistant">Phụ xe</option>
          </select>
        )}
        <select
          required
          value={form.busId ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, busId: e.target.value }))}
          className={inputCls}
        >
          <option value="">— Xe phụ trách —</option>
          {buses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.licensePlate} ({b.typeName})
            </option>
          ))}
        </select>
        <input
          placeholder="Số bằng lái (tuỳ chọn)"
          value={form.licenseNo ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, licenseNo: e.target.value }))
          }
          className={inputCls}
        />
        <input
          placeholder="Hạng bằng (B2, D, ...)"
          value={form.licenseType ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, licenseType: e.target.value }))
          }
          className={inputCls}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : initial ? "Lưu" : "Tạo"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-secondary"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}

function DriversView({ authFetch }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all / driver / assistant
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    authFetch(`${API}/api/admin/company/drivers`)
      .then((r) => r.json())
      .then((data) => setDrivers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [authFetch]);

  async function deactivate(id) {
    if (!confirm("Ngưng hoạt động nhân viên này?")) return;
    const res = await authFetch(`${API}/api/admin/company/drivers/${id}`, {
      method: "DELETE",
    });
    if (res.ok)
      setDrivers((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isActive: false } : d)),
      );
  }

  if (loading) return <p className="text-secondary text-sm">Đang tải...</p>;

  const filtered =
    filter === "all" ? drivers : drivers.filter((d) => d.driverRole === filter);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        {!adding && !editing && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Thêm nhân sự
          </button>
        )}
        <div className="flex gap-1 bg-surface-container rounded-xl p-1 ml-auto">
          {[
            ["all", "Tất cả"],
            ["driver", "Tài xế"],
            ["assistant", "Phụ xe"],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${filter === k ? "bg-white text-primary shadow-sm" : "text-secondary"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {adding && (
        <DriverForm
          authFetch={authFetch}
          onSaved={(d) => {
            setDrivers((prev) => [d, ...prev]);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {filtered.length === 0 && (
        <p className="text-secondary text-sm">Chưa có nhân sự nào.</p>
      )}
      {filtered.map((d) =>
        editing === d.id ? (
          <DriverForm
            key={d.id}
            authFetch={authFetch}
            initial={d}
            onSaved={(u) => {
              setDrivers((prev) => prev.map((x) => (x.id === u.id ? u : x)));
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <div
            key={d.id}
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
              {d.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-sm">{d.fullName}</p>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${d.driverRole === "driver" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
                >
                  {d.driverRole === "driver" ? "Tài xế" : "Phụ xe"}
                </span>
                {!d.isActive && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-500">
                    Ngưng
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary mt-0.5">
                {d.phone} · Xe: {d.bus?.licensePlate ?? "—"}
              </p>
              {d.licenseNo && (
                <p className="text-xs text-secondary">
                  Bằng: {d.licenseType} · {d.licenseNo}
                </p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setEditing(d.id)}
                className="px-3 py-1 text-xs font-bold text-primary hover:bg-primary/5 rounded-xl"
              >
                Sửa
              </button>
              {d.isActive && (
                <button
                  onClick={() => deactivate(d.id)}
                  className="px-3 py-1 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl"
                >
                  Ngưng
                </button>
              )}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

// ─── Buses ─────────────────────────────────────────────────────────

const AMENITIES = [
  ["wifi", "Wi-Fi"],
  ["airConditioner", "Điều hoà"],
  ["usb", "Sạc USB"],
  ["blanket", "Chăn"],
  ["water", "Nước uống"],
  ["toilet", "WC"],
];
const BUS_TYPE_LABELS = {
  standard: "Ghế ngồi",
  sleeper: "Giường nằm",
  minibus: "Xe nhỏ",
};

function BusForm({ authFetch, initial, onSaved, onCancel }) {
  const [form, setForm] = useState(
    initial ?? {
      licensePlate: "",
      busType: "standard",
      typeName: "",
      layout: "2-2",
      amenities: {},
    },
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url = initial
      ? `${API}/api/admin/company/buses/${initial.id}`
      : `${API}/api/admin/company/buses`;
    const body = initial
      ? {
          licensePlate: form.licensePlate,
          typeName: form.typeName,
          layout: form.layout,
          amenities: form.amenities,
        }
      : form;
    const res = await authFetch(url, {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Có lỗi xảy ra");
    onSaved(data.bus);
  }

  function toggleAmenity(key) {
    setForm((f) => ({
      ...f,
      amenities: { ...f.amenities, [key]: !f.amenities[key] },
    }));
  }

  const inputCls =
    "w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30";
  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl p-4 shadow-sm space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          required
          placeholder="Biển số (vd: 29B-12345)"
          value={form.licensePlate}
          onChange={(e) =>
            setForm((f) => ({ ...f, licensePlate: e.target.value }))
          }
          className={inputCls}
        />
        {!initial && (
          <select
            value={form.busType}
            onChange={(e) =>
              setForm((f) => ({ ...f, busType: e.target.value }))
            }
            className={inputCls}
          >
            <option value="standard">Ghế ngồi (29 chỗ)</option>
            <option value="sleeper">Giường nằm (36 chỗ)</option>
            <option value="minibus">Xe nhỏ (16 chỗ)</option>
          </select>
        )}
        <input
          required
          placeholder="Tên loại (vd: Limousine 9 chỗ)"
          value={form.typeName}
          onChange={(e) => setForm((f) => ({ ...f, typeName: e.target.value }))}
          className={inputCls}
        />
        <input
          placeholder="Layout (2-2, 2-1, ...)"
          value={form.layout}
          onChange={(e) => setForm((f) => ({ ...f, layout: e.target.value }))}
          className={inputCls}
        />
      </div>
      <div>
        <p className="text-xs font-bold text-secondary mb-2">Tiện ích</p>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleAmenity(key)}
              className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                form.amenities?.[key]
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-secondary border-outline-variant/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {!initial && (
        <p className="text-xs text-secondary italic">
          Ghế sẽ được tạo tự động theo loại xe.
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : initial ? "Lưu" : "Tạo xe"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-secondary"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}

function BusesView({ authFetch }) {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    authFetch(`${API}/api/admin/company/buses`)
      .then((r) => r.json())
      .then((data) => setBuses(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [authFetch]);

  async function deactivate(id) {
    if (!confirm("Ngưng hoạt động xe này?")) return;
    const res = await authFetch(`${API}/api/admin/company/buses/${id}`, {
      method: "DELETE",
    });
    if (res.ok)
      setBuses((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive: false } : b)),
      );
  }

  if (loading) return <p className="text-secondary text-sm">Đang tải...</p>;

  return (
    <div className="space-y-3">
      {!adding && !editing && (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Thêm xe
        </button>
      )}
      {adding && (
        <BusForm
          authFetch={authFetch}
          onSaved={(b) => {
            setBuses((prev) => [b, ...prev]);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {buses.length === 0 && (
        <p className="text-secondary text-sm">Chưa có xe nào.</p>
      )}
      {buses.map((b) =>
        editing === b.id ? (
          <BusForm
            key={b.id}
            authFetch={authFetch}
            initial={b}
            onSaved={(u) => {
              setBuses((prev) =>
                prev.map((x) => (x.id === u.id ? { ...x, ...u } : x)),
              );
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <div
            key={b.id}
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary">
                directions_bus
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold">{b.licensePlate}</p>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                  {BUS_TYPE_LABELS[b.busType]}
                </span>
                {!b.isActive && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-500">
                    Ngưng
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary mt-0.5">
                {b.typeName} · {b.totalSeats} chỗ · Layout {b.layout}
              </p>
              <p className="text-xs text-secondary">
                {b._count?.trips ?? 0} chuyến · {b._count?.drivers ?? 0} nhân sự
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setEditing(b.id)}
                className="px-3 py-1 text-xs font-bold text-primary hover:bg-primary/5 rounded-xl"
              >
                Sửa
              </button>
              {b.isActive && (
                <button
                  onClick={() => deactivate(b.id)}
                  className="px-3 py-1 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl"
                >
                  Ngưng
                </button>
              )}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

// ─── Shared Reports view (admin + companyadmin) ───────────────────

function ReportsView({ authFetch, endpoint }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // report id
  const [form, setForm] = useState({ status: "", adminNote: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authFetch(`${API}${endpoint}`)
      .then((r) => r.json())
      .then((data) => setReports(data.reports ?? []))
      .finally(() => setLoading(false));
  }, [authFetch, endpoint]);

  function openEdit(r) {
    setEditing(r.id);
    setForm({ status: r.status, adminNote: r.adminNote ?? "" });
  }

  async function saveReport(id) {
    setSaving(true);
    const res = await authFetch(`${API}/api/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data.report } : r)),
      );
      setEditing(null);
    }
    setSaving(false);
  }

  if (loading) return <p className="text-secondary text-sm">Đang tải...</p>;
  if (reports.length === 0)
    return <p className="text-secondary text-sm">Chưa có báo cáo nào.</p>;

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <div
          key={r.id}
          className="bg-white rounded-2xl p-4 shadow-sm space-y-2"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-sm">
              {CATEGORY_LABELS[r.category] ?? r.category}
            </p>
            <Badge map={SEVERITY} value={r.severity} />
            <Badge map={REPORT_STATUS} value={r.status} />
            <span className="text-xs text-secondary ml-auto">
              {formatDate(r.createdAt)}
            </span>
          </div>
          <p className="text-xs text-secondary">
            Hành khách:{" "}
            <span className="text-on-surface font-medium">
              {r.user.fullName}
            </span>
            {" · "}Tài xế:{" "}
            <span className="text-on-surface font-medium">
              {r.driver.fullName}
            </span>
            {" · "}
            {r.booking.trip.route.fromCity} → {r.booking.trip.route.toCity}
          </p>
          {r.details && (
            <p className="text-sm text-on-surface bg-surface-container-low rounded-xl px-3 py-2">
              {r.details}
            </p>
          )}
          {r.adminNote && editing !== r.id && (
            <p className="text-xs text-secondary italic">
              Ghi chú: {r.adminNote}
            </p>
          )}

          {editing === r.id ? (
            <div className="space-y-2 pt-1">
              <div className="flex gap-2">
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value }))
                  }
                  className="text-xs px-2 py-1 border border-outline-variant/30 rounded-lg focus:outline-none"
                >
                  <option value="pending">Chờ xử lý</option>
                  <option value="reviewing">Đang xem xét</option>
                  <option value="resolved">Đã xử lý</option>
                  <option value="dismissed">Bác bỏ</option>
                </select>
              </div>
              <textarea
                value={form.adminNote}
                onChange={(e) =>
                  setForm((f) => ({ ...f, adminNote: e.target.value }))
                }
                placeholder="Ghi chú xử lý..."
                rows={2}
                className="w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => saveReport(r.id)}
                  disabled={saving}
                  className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="px-3 py-1.5 text-xs text-secondary"
                >
                  Huỷ
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => openEdit(r)}
              className="text-xs text-primary font-bold hover:underline"
            >
              Xử lý
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Admin-only views ─────────────────────────────────────────────

const ROLE_LABELS = {
  admin: "Quản trị viên",
  company_admin: "Quản lý nhà xe",
  staff: "Nhân viên",
  user: "Người dùng",
};

function AddUserForm({ authFetch, onCreated, onCancel }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    role: "company_admin",
    companyId: "",
  });
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authFetch(`${API}/api/admin/companies`)
      .then((r) => r.json())
      .then((data) => setCompanies(Array.isArray(data) ? data : []));
  }, [authFetch]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await authFetch(`${API}/api/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Có lỗi xảy ra");
    onCreated(data.user);
  }

  const inputCls =
    "w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30";
  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl p-4 shadow-sm space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          required
          placeholder="Họ tên"
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          className={inputCls}
        />
        <input
          required
          placeholder="Số điện thoại"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className={inputCls}
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className={inputCls}
        />
        <input
          required
          type="password"
          placeholder="Mật khẩu"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className={inputCls}
        />
        <select
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          className={inputCls}
        >
          <option value="company_admin">Quản lý nhà xe</option>
          <option value="admin">Quản trị viên</option>
          <option value="staff">Nhân viên</option>
        </select>
        {form.role === "company_admin" && (
          <select
            required
            value={form.companyId}
            onChange={(e) =>
              setForm((f) => ({ ...f, companyId: e.target.value }))
            }
            className={inputCls}
          >
            <option value="">— Chọn doanh nghiệp —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl disabled:opacity-50"
        >
          {saving ? "Đang tạo..." : "Tạo tài khoản"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-secondary"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}

function UsersView({ authFetch }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    authFetch(`${API}/api/admin/users`)
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [authFetch]);

  async function toggleStatus(id) {
    setToggling(id);
    const res = await authFetch(`${API}/api/admin/users/${id}/status`, {
      method: "PATCH",
    });
    if (res.ok)
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u)),
      );
    setToggling(null);
  }

  if (loading) return <p className="text-secondary text-sm">Đang tải...</p>;
  return (
    <div className="space-y-3">
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Thêm tài khoản
        </button>
      ) : (
        <AddUserForm
          authFetch={authFetch}
          onCreated={(u) => {
            setUsers((prev) => [u, ...prev]);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {users.length === 0 && (
        <p className="text-secondary text-sm">Chưa có người dùng nào.</p>
      )}
      {users.map((u) => (
        <div
          key={u.id}
          className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
            {u.fullName?.charAt(0) ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{u.fullName}</p>
            <p className="text-xs text-secondary truncate">
              {u.email} · {ROLE_LABELS[u.role] ?? u.role}
            </p>
          </div>
          <button
            onClick={() => toggleStatus(u.id)}
            disabled={toggling === u.id || u.role === "admin"}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors disabled:opacity-40 ${
              u.isActive
                ? "bg-red-50 text-red-500 hover:bg-red-100"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
          >
            {u.isActive ? "Khoá" : "Mở khoá"}
          </button>
        </div>
      ))}
    </div>
  );
}

function CompanyForm({ authFetch, initial, onSaved, onCancel }) {
  const [form, setForm] = useState(
    initial ?? {
      name: "",
      hotline: "",
      email: "",
      address: "",
      description: "",
    },
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url = initial
      ? `${API}/api/admin/companies/${initial.id}`
      : `${API}/api/admin/companies`;
    const res = await authFetch(url, {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Có lỗi xảy ra");
    onSaved(data.company);
  }

  const inputCls =
    "w-full px-3 py-2 text-sm bg-surface-container-low rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30";
  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl p-4 shadow-sm space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          required
          placeholder="Tên doanh nghiệp"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className={inputCls}
        />
        <input
          required
          placeholder="Hotline"
          value={form.hotline}
          onChange={(e) => setForm((f) => ({ ...f, hotline: e.target.value }))}
          className={inputCls}
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className={inputCls}
        />
        <input
          required
          placeholder="Địa chỉ"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          className={inputCls}
        />
      </div>
      <textarea
        placeholder="Mô tả (tuỳ chọn)"
        rows={2}
        value={form.description ?? ""}
        onChange={(e) =>
          setForm((f) => ({ ...f, description: e.target.value }))
        }
        className={`${inputCls} resize-none`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : initial ? "Lưu" : "Tạo doanh nghiệp"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-secondary"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}

function CompaniesView({ authFetch }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    authFetch(`${API}/api/admin/companies`)
      .then((r) => r.json())
      .then((data) => setCompanies(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [authFetch]);

  if (loading) return <p className="text-secondary text-sm">Đang tải...</p>;

  return (
    <div className="space-y-3">
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Thêm doanh nghiệp
        </button>
      ) : (
        <CompanyForm
          authFetch={authFetch}
          onSaved={(c) => {
            setCompanies((prev) => [c, ...prev]);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {companies.length === 0 && (
        <p className="text-secondary text-sm">Chưa có doanh nghiệp nào.</p>
      )}
      {companies.map((c) =>
        editing === c.id ? (
          <CompanyForm
            key={c.id}
            authFetch={authFetch}
            initial={c}
            onSaved={(updated) => {
              setCompanies((prev) =>
                prev.map((x) =>
                  x.id === updated.id ? { ...x, ...updated } : x,
                ),
              );
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <div
            key={c.id}
            className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary">
                apartment
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold">{c.name}</p>
                {!c.isActive && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-500">
                    Tạm ngưng
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary mt-0.5">
                {c.email} · {c.hotline}
              </p>
              <p className="text-xs text-secondary truncate">{c.address}</p>
              <div className="flex gap-3 mt-2 text-xs text-secondary">
                <span>
                  <b className="text-on-surface">{c._count?.buses ?? 0}</b> xe
                </span>
                <span>
                  <b className="text-on-surface">{c._count?.drivers ?? 0}</b>{" "}
                  tài xế
                </span>
                <span>
                  <b className="text-on-surface">{c._count?.users ?? 0}</b> tài
                  khoản
                </span>
              </div>
            </div>
            <button
              onClick={() => setEditing(c.id)}
              className="px-3 py-1 text-xs font-bold text-primary hover:bg-primary/5 rounded-xl"
            >
              Sửa
            </button>
          </div>
        ),
      )}
    </div>
  );
}

function AdminStats({ authFetch }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    authFetch(`${API}/api/admin/stats`)
      .then((r) => r.json())
      .then(setStats);
  }, [authFetch]);
  if (!stats) return <p className="text-secondary text-sm">Đang tải...</p>;
  if (stats.error)
    return (
      <p className="text-red-500 text-sm">
        Không thể tải thống kê: {stats.error}
      </p>
    );
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon="group"
          label="Người dùng"
          value={stats.totalUsers ?? 0}
        />
        <StatCard
          icon="confirmation_number"
          label="Booking thành công"
          value={stats.totalBookings ?? 0}
        />
        <StatCard
          icon="payments"
          label="Tổng doanh thu"
          value={formatPrice(stats.totalRevenue)}
        />
        <StatCard
          icon="flag"
          label="Báo cáo chờ"
          value={stats.pendingReports ?? 0}
        />
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm mt-4">
        <p className="text-sm font-bold text-secondary mb-4">
          Doanh thu theo tháng
        </p>
        <TotalRevenueChart authFetch={authFetch} />
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm mt-4">
        <p className="text-sm font-bold text-secondary mb-4">
          Booking theo tháng
        </p>
        <TotalBookingsChart authFetch={authFetch} />
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm mt-4">
        <p className="text-sm font-bold text-secondary mb-4">
          Các tuyến đường phổ biến
        </p>
        <TopRoutesChart authFetch={authFetch} />
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm mt-4">
        <p className="text-sm font-bold text-secondary mb-4">
          Doanh thu theo nhà xe
        </p>
        <CompanyRevenueChart authFetch={authFetch} />
      </div>
    </>
  );
}

// ─── Routes view (admin only) ────────────────────────────────────

const EMPTY_ROUTE_FORM = { fromCity: "", toCity: "", distanceKm: "", estimatedDuration: "" };

function RoutesView({ authFetch }) {
  const [routes, setRoutes] = useState([]);
  const [uploading, setUploading] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ROUTE_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    authFetch(`${API}/api/admin/routes`)
      .then((r) => r.json())
      .then((d) => setRoutes(Array.isArray(d) ? d : []));
  }, [authFetch]);

  async function uploadImage(routeId, file) {
    const fd = new FormData();
    fd.append("image", file);
    const res = await authFetch(`${API}/api/admin/routes/${routeId}/image`, {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    return data.imageUrl ?? null;
  }

  async function handleUpload(routeId, file) {
    if (!file) return;
    setUploading(routeId);
    try {
      const imageUrl = await uploadImage(routeId, file);
      if (imageUrl)
        setRoutes((prev) => prev.map((r) => (r.id === routeId ? { ...r, imageUrl } : r)));
    } finally {
      setUploading(null);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      const res = await authFetch(`${API}/api/admin/routes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromCity: form.fromCity,
          toCity: form.toCity,
          distanceKm: parseInt(form.distanceKm),
          estimatedDuration: parseInt(form.estimatedDuration),
        }),
      });
      const data = await res.json();
      if (!res.ok) return setErr(data.error ?? "Lỗi tạo tuyến");

      let imageUrl = null;
      if (imageFile) imageUrl = await uploadImage(data.id, imageFile);

      setRoutes((prev) => [...prev, { ...data, imageUrl }]);
      setForm(EMPTY_ROUTE_FORM);
      setImageFile(null);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => { setShowForm((v) => !v); setErr(""); setImageFile(null); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Thêm tuyến
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <p className="font-bold text-sm">Tuyến đường mới</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-secondary block mb-1">Điểm đi</label>
              <input
                className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                placeholder="VD: Hà Nội"
                value={form.fromCity}
                onChange={(e) => setForm((f) => ({ ...f, fromCity: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs text-secondary block mb-1">Điểm đến</label>
              <input
                className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                placeholder="VD: TP.HCM"
                value={form.toCity}
                onChange={(e) => setForm((f) => ({ ...f, toCity: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs text-secondary block mb-1">Khoảng cách (km)</label>
              <input
                type="number" min="1"
                className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                placeholder="VD: 1700"
                value={form.distanceKm}
                onChange={(e) => setForm((f) => ({ ...f, distanceKm: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs text-secondary block mb-1">Thời gian ước tính (phút)</label>
              <input
                type="number" min="1"
                className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                placeholder="VD: 1080"
                value={form.estimatedDuration}
                onChange={(e) => setForm((f) => ({ ...f, estimatedDuration: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-secondary block mb-1">Ảnh tuyến đường (tuỳ chọn)</label>
            <label className="flex items-center gap-2 w-fit cursor-pointer px-3 py-2 border border-outline-variant rounded-xl text-sm hover:border-primary transition-colors">
              <span className="material-symbols-outlined text-base text-secondary">upload</span>
              <span className="text-secondary">{imageFile ? imageFile.name : "Chọn ảnh..."}</span>
              <input
                type="file" accept="image/*" className="hidden"
                onChange={(e) => setImageFile(e.target.files[0] ?? null)}
              />
            </label>
          </div>

          {err && <p className="text-red-500 text-xs">{err}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowForm(false); setImageFile(null); }} className="px-4 py-2 text-sm font-bold text-secondary hover:bg-surface-container rounded-xl">
              Huỷ
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-60">
              {saving ? "Đang lưu..." : "Tạo tuyến"}
            </button>
          </div>
        </form>
      )}

      {routes.map((r) => (
        <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-20 h-14 rounded-xl overflow-hidden shrink-0 bg-surface-container-low">
            {r.imageUrl ? (
              <img src={r.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-outline-variant">image</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{r.fromCity} → {r.toCity}</p>
            <p className="text-xs text-secondary">
              {r.distanceKm} km · ~{Math.floor(r.estimatedDuration / 60)}h{r.estimatedDuration % 60 > 0 ? `${r.estimatedDuration % 60}p` : ""}
            </p>
          </div>
          <label className={`px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-all ${uploading === r.id ? "bg-surface-container text-secondary" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
            {uploading === r.id ? "Đang tải..." : "Tải ảnh"}
            <input
              type="file" accept="image/*" className="hidden"
              disabled={uploading === r.id}
              onChange={(e) => handleUpload(r.id, e.target.files[0])}
            />
          </label>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────

export default function Admin() {
  const { user, authFetch } = useAuth();
  const isAdmin = user?.role === "admin";
  const stableAuthFetch = useCallback(
    (...args) => authFetch(...args),
    [authFetch],
  );

  const TABS = isAdmin
    ? ["Tổng quan", "Người dùng", "Doanh nghiệp", "Tuyến đường", "Báo cáo"]
    : ["Tổng quan", "Chuyến xe", "Nhân sự", "Xe", "Đặt vé", "Báo cáo"];

  const [tab, setTab] = useState(0);

  return (
    <main className="min-h-screen pt-24 pb-16 bg-surface-container-low">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-2xl text-primary">
            admin_panel_settings
          </span>
          <h1 className="text-2xl font-extrabold">
            {isAdmin ? "Quản trị hệ thống" : "Quản lý nhà xe"}
          </h1>
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

        {/* CompanyAdmin tabs */}
        {!isAdmin && tab === 0 && <CompanyStats authFetch={stableAuthFetch} />}
        {!isAdmin && tab === 1 && <CompanyTrips authFetch={stableAuthFetch} />}
        {!isAdmin && tab === 2 && <DriversView authFetch={stableAuthFetch} />}
        {!isAdmin && tab === 3 && <BusesView authFetch={stableAuthFetch} />}
        {!isAdmin && tab === 4 && (
          <CompanyBookings authFetch={stableAuthFetch} />
        )}
        {!isAdmin && tab === 5 && (
          <ReportsView
            authFetch={stableAuthFetch}
            endpoint="/api/admin/company/reports"
          />
        )}

        {/* Admin tabs */}
        {isAdmin && tab === 0 && <AdminStats authFetch={stableAuthFetch} />}
        {isAdmin && tab === 1 && <UsersView authFetch={stableAuthFetch} />}
        {isAdmin && tab === 2 && <CompaniesView authFetch={stableAuthFetch} />}
        {isAdmin && tab === 3 && <RoutesView authFetch={stableAuthFetch} />}
        {isAdmin && tab === 4 && (
          <ReportsView authFetch={stableAuthFetch} endpoint="/api/reports" />
        )}
      </div>
    </main>
  );
}
