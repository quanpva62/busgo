import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext.jsx";
import Pagination from "../components/Pagination.jsx";
import Icon from "../components/Icon.jsx";
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
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
function formatDateTime(iso) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
  refunded: { label: "Đã hoàn", cls: "bg-orange-100 text-orange-700" },
  refund_failed: { label: "Hoàn lỗi", cls: "bg-amber-100 text-amber-700" },
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

function ExportButton({ authFetch, endpoint, filename }) {
  const [downloading, setDownloading] = useState(false);
  async function download() {
    setDownloading(true);
    try {
      const res = await authFetch(`${API}${endpoint}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }
  return (
    <button
      onClick={download}
      disabled={downloading}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
    >
      <Icon name="download" className="w-4 h-4" />
      {downloading ? "Đang xuất..." : "Xuất Excel"}
    </button>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 min-w-0">
      <Icon name={icon} className="w-6 h-6 text-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-secondary uppercase tracking-wide">
          {label}
        </p>
        <p className="text-lg font-bold text-on-surface wrap-break-word">
          {value}
        </p>
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
          <YAxis
            tickFormatter={(v) =>
              v >= 1000000
                ? (v / 1000000).toFixed(1) + "M"
                : v >= 1000
                  ? (v / 1000).toFixed(0) + "K"
                  : v
            }
            width={55}
          />
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

function TotalCommissionChart({ authFetch }) {
  const [groupBy, setGroupBy] = useState("month");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [data, setData] = useState([]);

  useEffect(() => {
    const url =
      groupBy === "month"
        ? `${API}/api/admin/commission-chart?groupBy=month&year=${year}`
        : `${API}/api/admin/commission-chart?groupBy=year`;
    authFetch(url)
      .then((r) => r.json())
      .then((d) =>
        setData(
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
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis dataKey="period" />
          <YAxis
            tickFormatter={(v) =>
              v >= 1000000
                ? (v / 1000000).toFixed(1) + "M"
                : v >= 1000
                  ? (v / 1000).toFixed(0) + "K"
                  : v
            }
            width={55}
          />
          <Tooltip formatter={(v) => v.toLocaleString("vi-VN") + "đ"} />
          <Line dataKey="commission" stroke="#f59e0b" />
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
          <XAxis
            type="number"
            allowDecimals={false}
            tickFormatter={(v) =>
              v >= 1000000
                ? (v / 1000000).toFixed(1) + "M"
                : v >= 1000
                  ? (v / 1000).toFixed(0) + "K"
                  : v
            }
          />
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
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
        <StatCard
          icon="percent"
          label="Hoa hồng BusGo"
          value={formatPrice(stats.totalCommission)}
        />
        <StatCard
          icon="account_balance_wallet"
          label="Thực nhận"
          value={formatPrice(stats.netRevenue)}
        />
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm mt-4">
        <p className="text-sm font-bold text-secondary mb-4">Doanh thu</p>
        <TotalRevenueChart authFetch={authFetch} />
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm mt-4">
        <p className="text-sm font-bold text-secondary mb-4">Booking</p>
        <TotalBookingsChart authFetch={authFetch} />
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm mt-4">
        <p className="text-sm font-bold text-secondary mb-4">
          Hoa hồng đã trả BusGo
        </p>
        <TotalCommissionChart authFetch={authFetch} />
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm mt-4">
        <p className="text-sm font-bold text-secondary mb-4">Tuyến phổ biến</p>
        <TopRoutesChart authFetch={authFetch} />
      </div>
    </>
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
          {saving
            ? "Đang tạo..."
            : recurring
              ? `Tạo ${occurrences} chuyến`
              : "Tạo chuyến"}
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
  const toast = useToast();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [adding, setAdding] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [tripBookings, setTripBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  async function toggleBookings(tripId) {
    if (expandedId === tripId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(tripId);
    setBookingsLoading(true);
    try {
      const res = await authFetch(
        `${API}/api/admin/company/bookings?tripId=${tripId}&limit=100`,
      );
      const data = await res.json();
      setTripBookings(Array.isArray(data.bookings) ? data.bookings : []);
    } finally {
      setBookingsLoading(false);
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await authFetch(
          `${API}/api/admin/company/trips?page=${page}`,
        );
        const data = await res.json();
        setTrips(Array.isArray(data.trips) ? data.trips : []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authFetch, page]);

  async function changeStatus(id, status) {
    setUpdating(id);
    const res = await authFetch(`${API}/api/admin/company/trips/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok) {
      setTrips((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: data.trip.status } : t)),
      );
      if (data.refundFailures?.length) toast.warning(data.message);
    }
    setUpdating(null);
  }

  async function deleteTrip(id) {
    const ok = await toast.confirm({
      title: "Xoá chuyến này?",
      confirmText: "Xoá",
      variant: "danger",
    });
    if (!ok) return;
    const res = await authFetch(`${API}/api/admin/company/trips/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Không thể xoá");
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }

  async function deleteSeries(seriesId) {
    const ok = await toast.confirm({
      title: "Xoá toàn bộ chuyến trong chuỗi?",
      message: "Chỉ xoá được nếu chưa có booking.",
      confirmText: "Xoá chuỗi",
      variant: "danger",
    });
    if (!ok) return;
    const res = await authFetch(
      `${API}/api/admin/company/trips/series/${seriesId}`,
      {
        method: "DELETE",
      },
    );
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Không thể xoá chuỗi");
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
          <Icon name="add" className="w-4 h-4" />
          Thêm chuyến
        </button>
      ) : (
        <AddTripForm
          authFetch={authFetch}
          onCreated={() => {
            // Refetch trang 1 sau khi tạo (chuyến mới + cập nhật total)
            authFetch(`${API}/api/admin/company/trips?page=1`)
              .then((r) => r.json())
              .then((data) => {
                setTrips(Array.isArray(data.trips) ? data.trips : []);
                setTotal(data.total || 0);
                setTotalPages(data.totalPages || 1);
              });
            setPage(1);
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
          className="bg-white rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold">
                  {t.route.fromCity} → {t.route.toCity}
                </p>
                {t.seriesId && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                    {t.interval === "daily"
                      ? "Hằng ngày"
                      : t.interval === "weekly"
                        ? "Hằng tuần"
                        : "Hằng tháng"}
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
                  <Icon name="delete_sweep" className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => deleteTrip(t.id)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                title="Xoá chuyến này"
              >
                <Icon name="delete" className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleBookings(t.id)}
                className="p-1.5 text-secondary hover:bg-surface-container-low rounded-lg"
                title="Xem vé của chuyến"
              >
                <Icon
                  name={expandedId === t.id ? "expand_less" : "expand_more"}
                  className="w-4 h-4"
                />
              </button>
            </div>
          </div>
          {expandedId === t.id && (
            <div className="border-t border-outline-variant/30 px-4 py-3 bg-surface-container-low/50 space-y-2">
              {bookingsLoading ? (
                <p className="text-secondary text-sm">Đang tải vé...</p>
              ) : tripBookings.length === 0 ? (
                <p className="text-secondary text-sm">Chuyến này chưa có vé.</p>
              ) : (
                tripBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0 truncate">
                      <span className="font-semibold">
                        {b.user?.fullName ?? b.passengerName}
                      </span>
                      <span className="text-secondary">
                        {" "}
                        · {b.passengerPhone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge map={BOOKING_STATUS} value={b.status} />
                      <span className="text-primary font-semibold">
                        {formatPrice(b.totalPrice)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          label="chuyến"
          onChange={setPage}
        />
      )}
    </div>
  );
}

function CompanyBookings({ authFetch }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await authFetch(
          `${API}/api/admin/company/bookings?page=${page}${status ? `&status=${status}` : ""}`,
        );
        const data = await res.json();
        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authFetch, page, status]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="border border-outline-variant rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ thanh toán</option>
          <option value="paid">Đã thanh toán</option>
          <option value="cancelled">Đã huỷ</option>
          <option value="refunded">Đã hoàn tiền</option>
          <option value="refund_failed">Hoàn tiền lỗi — cần xử lý</option>
        </select>
        <ExportButton
          authFetch={authFetch}
          endpoint="/api/admin/export/bookings"
          filename="bookings"
        />
      </div>
      {loading ? (
        <p className="text-secondary text-sm">Đang tải...</p>
      ) : bookings.length === 0 ? (
        <p className="text-secondary text-sm">Chưa có booking nào.</p>
      ) : (
        bookings.map((b) => (
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
              <p className="font-bold text-primary text-sm">
                {formatPrice(b.totalPrice)}
              </p>
            </div>
          </div>
        ))
      )}

      {!loading && totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          label="booking"
          onChange={setPage}
        />
      )}
    </div>
  );
}

// ─── Drivers (driver + assistant) ────────────────────────────────

function DriverForm({ authFetch, initial, onSaved, onCancel }) {
  const [form, setForm] = useState(
    initial ?? {
      fullName: "",
      phone: "",
      driverRole: "driver",
      licenseNo: "",
      licenseType: "",
    },
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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

function HumanResourcesView({ authFetch }) {
  const [section, setSection] = useState("drivers");
  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-surface-container rounded-xl p-1 w-fit">
        {[
          { id: "drivers", label: "Tài xế" },
          { id: "staff", label: "Nhân viên" },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
              section === s.id
                ? "bg-white text-primary shadow-sm"
                : "text-secondary hover:text-on-surface"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {section === "drivers" ? (
        <DriversView authFetch={authFetch} />
      ) : (
        <StaffView authFetch={authFetch} />
      )}
    </div>
  );
}

function StaffView({ authFetch }) {
  const toast = useToast();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const load = useCallback(() => {
    authFetch(`${API}/api/admin/company/staff`)
      .then((r) => r.json())
      .then((data) => setStaff(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [authFetch]);
  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(u) {
    const res = await authFetch(
      `${API}/api/admin/company/staff/${u.id}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      },
    );
    if (res.ok) {
      setStaff((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, isActive: !u.isActive } : x)),
      );
    } else {
      const data = await res.json();
      toast.error(data.error || "Lỗi");
    }
  }

  if (loading) return <p className="text-secondary text-sm">Đang tải...</p>;

  return (
    <div className="space-y-3">
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90"
        >
          <Icon name="add" className="w-4 h-4" />
          Thêm nhân viên
        </button>
      ) : (
        <StaffForm
          authFetch={authFetch}
          onCreated={(cred) => {
            setAdding(false);
            setCredentials(cred);
            load();
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-container text-secondary">
            <tr>
              <th className="text-left px-4 py-3">Họ tên</th>
              <th className="text-left px-4 py-3">SĐT</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Vai trò</th>
              <th className="text-left px-4 py-3">Trạng thái</th>
              <th className="text-left px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((u) => (
              <tr key={u.id} className="border-t border-outline-variant/20">
                <td className="px-4 py-3 font-bold">{u.fullName}</td>
                <td className="px-4 py-3">{u.phone}</td>
                <td className="px-4 py-3 text-secondary">{u.email || "—"}</td>
                <td className="px-4 py-3">
                  {u.role === "company_admin" ? "Quản lý" : "Nhân viên"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      u.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {u.isActive ? "Hoạt động" : "Vô hiệu"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(u)}
                    className="text-primary text-xs font-bold hover:underline"
                  >
                    {u.isActive ? "Vô hiệu hoá" : "Kích hoạt"}
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-secondary py-8">
                  Chưa có nhân viên nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {credentials && (
        <CredentialsModal
          credentials={credentials}
          onClose={() => setCredentials(null)}
        />
      )}
    </div>
  );
}

function StaffForm({ authFetch, onCreated, onCancel }) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    role: "staff",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await authFetch(`${API}/api/admin/company/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Có lỗi xảy ra");
    onCreated(data.credentials);
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
          placeholder="Số điện thoại (dùng để đăng nhập)"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className={inputCls}
        />
        <input
          type="email"
          placeholder="Email (tuỳ chọn)"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className={inputCls}
        />
        <input
          placeholder="Mật khẩu (trống = tên-nhà-xe + 123)"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className={inputCls}
        />
        <select
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          className={inputCls}
        >
          <option value="staff">Nhân viên (check-in vé)</option>
          <option value="company_admin">Quản lý nhà xe</option>
        </select>
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

function CredentialsModal({ credentials, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = `SĐT: ${credentials.phone}\nMật khẩu: ${credentials.password}`;
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4"
      >
        <h3 className="text-lg font-extrabold text-green-700">
          ✓ Tạo tài khoản thành công
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-2 text-sm">
          <p>
            <b>SĐT đăng nhập:</b>{" "}
            <code className="bg-white px-2 py-0.5 rounded">
              {credentials.phone}
            </code>
          </p>
          <p>
            <b>Mật khẩu:</b>{" "}
            <code className="bg-white px-2 py-0.5 rounded">
              {credentials.password}
            </code>
          </p>
          <p className="text-xs text-yellow-800 mt-2">⚠️ {credentials.note}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={copy}
            className="px-4 py-2 border border-outline-variant rounded-xl font-bold text-sm hover:bg-surface-container"
          >
            {copied ? "✓ Đã copy" : "📋 Copy"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function DriversView({ authFetch }) {
  const toast = useToast();
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
    const ok = await toast.confirm({
      title: "Xóa nhân viên?",
      confirmText: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
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
            <Icon name="add" className="w-4 h-4" />
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
                  Xóa
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
  const toast = useToast();
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
    const ok = await toast.confirm({
      title: "Xóa xe?",
      confirmTextXóa: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
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
          <Icon name="add" className="w-4 h-4" />
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
              <Icon name="directions_bus" className="w-5 h-5 text-primary" />
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
                  Xóa
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

  return (
    <div className="space-y-3">
      <ExportButton
        authFetch={authFetch}
        endpoint="/api/admin/export/reports"
        filename="reports"
      />
      {reports.length === 0 && (
        <p className="text-secondary text-sm">Chưa có báo cáo nào.</p>
      )}
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

function UsersView({ authFetch }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await authFetch(`${API}/api/admin/users?page=${page}`);
        const data = await res.json();
        setUsers(Array.isArray(data.users) ? data.users : []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authFetch, page]);

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
      <ExportButton
        authFetch={authFetch}
        endpoint="/api/admin/export/users"
        filename="users"
      />

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
              {u.email || u.phone} · {ROLE_LABELS[u.role] ?? u.role}
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

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          label="người dùng"
          onChange={setPage}
        />
      )}
    </div>
  );
}

function CompanyForm({ authFetch, initial, onSaved, onCancel, onCredentials }) {
  const [form, setForm] = useState(
    initial ?? {
      name: "",
      hotline: "",
      email: "",
      address: "",
      description: "",
      adminPhone: "",
      adminFullName: "",
      adminPassword: "",
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
    if (!initial && data.credentials) {
      onCredentials?.(data.credentials);
    }
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
        {initial && (
          <div>
            <label className="text-xs text-secondary">
              Hoa hồng (%) — phần trăm BusGo thu mỗi vé
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="VD: 10"
              value={
                form.commissionRate != null
                  ? Math.round(form.commissionRate * 1000) / 10
                  : ""
              }
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  commissionRate: e.target.value
                    ? Number(e.target.value) / 100
                    : 0,
                }))
              }
              className={`${inputCls} mt-1`}
            />
          </div>
        )}
      </div>

      {!initial && (
        <div className="border-t border-outline-variant/30 pt-3 mt-2 space-y-3">
          <p className="text-xs font-bold text-secondary uppercase tracking-wide">
            Tài khoản quản lý nhà xe
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              required
              placeholder="SĐT đăng nhập của quản lý *"
              value={form.adminPhone || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, adminPhone: e.target.value }))
              }
              className={inputCls}
            />
            <input
              placeholder="Tên quản lý (mặc định: Quản lý + tên nhà xe)"
              value={form.adminFullName || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, adminFullName: e.target.value }))
              }
              className={inputCls}
            />
            <input
              placeholder="Mật khẩu"
              value={form.adminPassword || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, adminPassword: e.target.value }))
              }
              className={`${inputCls} sm:col-span-2`}
            />
          </div>
        </div>
      )}
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
  const [credentials, setCredentials] = useState(null);

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
          <Icon name="add" className="w-4 h-4" />
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
          onCredentials={setCredentials}
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
              <Icon name="apartment" className="w-5 h-5 text-primary" />
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
      {credentials && (
        <CredentialsModal
          credentials={credentials}
          onClose={() => setCredentials(null)}
        />
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
          icon="percent"
          label="Hoa hồng thu được"
          value={formatPrice(stats.totalCommission)}
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
          Hoa hồng theo tháng
        </p>
        <TotalCommissionChart authFetch={authFetch} />
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

const EMPTY_ROUTE_FORM = {
  fromCity: "",
  toCity: "",
  distanceKm: "",
  estimatedDuration: "",
};

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
        setRoutes((prev) =>
          prev.map((r) => (r.id === routeId ? { ...r, imageUrl } : r)),
        );
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
          onClick={() => {
            setShowForm((v) => !v);
            setErr("");
            setImageFile(null);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90"
        >
          <Icon name="add" className="w-4 h-4" />
          Thêm tuyến
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl p-5 shadow-sm space-y-3"
        >
          <p className="font-bold text-sm">Tuyến đường mới</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-secondary block mb-1">
                Điểm đi
              </label>
              <input
                className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                placeholder="VD: Hà Nội"
                value={form.fromCity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fromCity: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="text-xs text-secondary block mb-1">
                Điểm đến
              </label>
              <input
                className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                placeholder="VD: TP.HCM"
                value={form.toCity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, toCity: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="text-xs text-secondary block mb-1">
                Khoảng cách (km)
              </label>
              <input
                type="number"
                min="1"
                className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                placeholder="VD: 1700"
                value={form.distanceKm}
                onChange={(e) =>
                  setForm((f) => ({ ...f, distanceKm: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="text-xs text-secondary block mb-1">
                Thời gian ước tính (phút)
              </label>
              <input
                type="number"
                min="1"
                className="w-full border border-outline-variant rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                placeholder="VD: 1080"
                value={form.estimatedDuration}
                onChange={(e) =>
                  setForm((f) => ({ ...f, estimatedDuration: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-secondary block mb-1">
              Ảnh tuyến đường (tuỳ chọn)
            </label>
            <label className="flex items-center gap-2 w-fit cursor-pointer px-3 py-2 border border-outline-variant rounded-xl text-sm hover:border-primary transition-colors">
              <Icon name="upload" className="w-4 h-4 text-secondary" />
              <span className="text-secondary">
                {imageFile ? imageFile.name : "Chọn ảnh..."}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImageFile(e.target.files[0] ?? null)}
              />
            </label>
          </div>

          {err && <p className="text-red-500 text-xs">{err}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setImageFile(null);
              }}
              className="px-4 py-2 text-sm font-bold text-secondary hover:bg-surface-container rounded-xl"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Tạo tuyến"}
            </button>
          </div>
        </form>
      )}

      {routes.map((r) => (
        <div
          key={r.id}
          className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4"
        >
          <div className="w-20 h-14 rounded-xl overflow-hidden shrink-0 bg-surface-container-low">
            {r.imageUrl ? (
              <img
                src={r.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon name="image" className="w-6 h-6 text-outline-variant" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">
              {r.fromCity} → {r.toCity}
            </p>
            <p className="text-xs text-secondary">
              {r.distanceKm} km · ~{Math.floor(r.estimatedDuration / 60)}h
              {r.estimatedDuration % 60 > 0
                ? `${r.estimatedDuration % 60}p`
                : ""}
            </p>
          </div>
          <label
            className={`px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-all ${uploading === r.id ? "bg-surface-container text-secondary" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
          >
            {uploading === r.id ? "Đang tải..." : "Tải ảnh"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading === r.id}
              onChange={(e) => handleUpload(r.id, e.target.files[0])}
            />
          </label>
        </div>
      ))}
    </div>
  );
}

function PromoForm({ authFetch, promo, onSaved, onCancel }) {
  const isEdit = !!promo;
  const [form, setForm] = useState(() => ({
    code: promo?.code ?? "",
    discountType: promo?.discountType ?? "percentage",
    discountValue: promo?.discountValue ?? 10,
    minPrice: promo?.minPrice ?? "",
    maxUses: promo?.maxUses ?? "",
    expiresAt: promo?.expiresAt
      ? new Date(promo.expiresAt).toISOString().slice(0, 16)
      : "",
    isActive: promo?.isActive ?? true,
    firstBookingOnly: promo?.firstBookingOnly ?? false,
    oncePerUser: promo?.oncePerUser ?? false,
    minBookings: promo?.minBookings ?? "",
  }));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function update(key) {
    return (e) => {
      const v =
        e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [key]: v }));
    };
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");

    const body = {
      ...form,
      discountValue: Number(form.discountValue),
      minPrice: form.minPrice ? Number(form.minPrice) : null,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      minBookings: form.minBookings ? Number(form.minBookings) : null,
      expiresAt: new Date(form.expiresAt).toISOString(),
    };

    const url = isEdit ? `${API}/api/promos/${promo.id}` : `${API}/api/promos`;
    const method = isEdit ? "PATCH" : "POST";
    const res = await authFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setErr(data.error ?? data.errors?.[0]?.msg ?? "Có lỗi xảy ra");
      return;
    }
    onSaved();
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl p-6 shadow-sm space-y-4"
    >
      <h2 className="text-lg font-extrabold">
        {isEdit ? "Sửa mã" : "Tạo mã mới"}
      </h2>

      {err && <p className="text-red-500 text-sm">{err}</p>}

      {!isEdit && (
        <div>
          <label className="text-xs font-bold uppercase text-secondary">
            Mã giảm giá
          </label>
          <input
            required
            value={form.code}
            onChange={update("code")}
            placeholder="VD: SUMMER2026"
            className="w-full mt-1 px-3 py-2 border border-outline-variant/30 rounded-xl uppercase"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase text-secondary">
            Loại giảm giá
          </label>
          <select
            value={form.discountType}
            onChange={update("discountType")}
            className="w-full mt-1 px-3 py-2 border border-outline-variant/30 rounded-xl"
          >
            <option value="percentage">Phần trăm (%)</option>
            <option value="fixed">Cố định (VNĐ)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-secondary">
            Giá trị giảm
          </label>
          <input
            required
            type="number"
            min="1"
            value={form.discountValue}
            onChange={update("discountValue")}
            className="w-full mt-1 px-3 py-2 border border-outline-variant/30 rounded-xl"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold uppercase text-secondary">
          Hạn dùng
        </label>
        <input
          required
          type="datetime-local"
          value={form.expiresAt}
          onChange={update("expiresAt")}
          className="w-full mt-1 px-3 py-2 border border-outline-variant/30 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase text-secondary">
            Giá vé tối thiểu (VNĐ)
          </label>
          <input
            type="number"
            value={form.minPrice}
            onChange={update("minPrice")}
            placeholder="Không yêu cầu"
            className="w-full mt-1 px-3 py-2 border border-outline-variant/30 rounded-xl"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-secondary">
            Tổng lượt dùng tối đa
          </label>
          <input
            type="number"
            value={form.maxUses}
            onChange={update("maxUses")}
            placeholder="Không giới hạn"
            className="w-full mt-1 px-3 py-2 border border-outline-variant/30 rounded-xl"
          />
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        <p className="text-xs font-bold uppercase text-secondary">
          Điều kiện áp dụng
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.firstBookingOnly}
            onChange={update("firstBookingOnly")}
          />
          Chỉ khách hàng mới (chưa có vé)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.oncePerUser}
            onChange={update("oncePerUser")}
          />
          Mỗi user chỉ dùng 1 lần
        </label>
        <div>
          <label className="text-xs text-secondary">
            Số booking tối thiểu (để dùng được)
          </label>
          <input
            type="number"
            value={form.minBookings}
            onChange={update("minBookings")}
            placeholder="Không yêu cầu"
            className="w-full mt-1 px-3 py-2 border border-outline-variant/30 rounded-xl"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={update("isActive")}
        />
        Kích hoạt
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-primary text-white rounded-xl font-bold disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : isEdit ? "Lưu" : "Tạo"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-surface-container rounded-xl font-bold"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}

function PromosView({ authFetch }) {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [editing, setEditing] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await authFetch(`${API}/api/promos?page=${page}`);
      const data = await res.json();
      setPromos(data.promos || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages ?? 1);
      setLoading(false);
    }
    load();
  }, [page, refreshKey, authFetch]);

  async function deletePromo(id) {
    if (!confirm("Bạn có chắc muốn xoá khuyến mãi này?")) return;
    const res = await authFetch(`${API}/api/promos/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error ?? "Có lỗi xảy ra");
    setRefreshKey((k) => k + 1);
  }

  if (loading) return <p className="text-secondary text-sm">Đang tải...</p>;

  if (editing) {
    return (
      <PromoForm
        authFetch={authFetch}
        promo={editing === "new" ? null : promos.find((p) => p.id === editing)}
        onSaved={() => {
          setEditing(null);
          setRefreshKey((k) => k + 1);
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }
  return (
    <div className="space-y-3">
      <button
        onClick={() => setEditing("new")}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90"
      >
        <Icon name="add" className="w-4 h-4" />
        Tạo mã giảm giá
      </button>

      {promos.length === 0 && (
        <p className="text-secondary text-sm">Chưa có mã nào</p>
      )}

      {promos.map((p) => (
        <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <code className="font-bold text-primary bg-primary/5 px-2 py-1 rounded">
              {" "}
              {p.code}
            </code>
            <span className="text-sm font-bold">
              {p.discountType === "percentage"
                ? `Giảm ${p.discountValue}%`
                : `Giảm ${formatPrice(p.discountValue)}`}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
            >
              {p.isActive ? "Đang hoạt động" : "Đã vô hiệu hóa"}
            </span>
            <span className="text-xs text-secondary ml-auto">
              Hết hạn: {formatDate(p.expiresAt)}
            </span>
          </div>
          <div className="mt-2 flex gap-3 text-xs text-secondary flex-wrap">
            <span>
              Đã dùng: {p.usedCount}
              {p.maxUses ? `/${p.maxUses}` : ""}
            </span>
            {p.minPrice && <span>Giá tối thiểu:{formatPrice(p.minPrice)}</span>}
            {p.firstBookingOnly && <span>Khách hàng mới</span>}
            {p.oncePerUser && <span>1 lần/1 user</span>}
            {p.minBookings && <span>≥{p.minBookings} booking</span>}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setEditing(p.id)}
              className="px-3 py-1 text-xs bg-primary/5 text-primary rounded-lg font-bold"
            >
              Sửa
            </button>
            <button
              onClick={() => deletePromo(p.id)}
              className="px-3 py-1 text-xs bg-red-50 text-red-500 rounded-lg font-bold"
            >
              Xóa
            </button>
          </div>
        </div>
      ))}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          label="mã"
          onChange={setPage}
        />
      )}
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
    ? ["Tổng quan", "Người dùng", "Doanh nghiệp", "Tuyến đường", "Báo cáo", "Khuyến mãi"]
    : ["Tổng quan", "Chuyến xe", "Nhân sự", "Xe", "Đặt vé", "Báo cáo"];

  const [tab, setTab] = useState(0);

  return (
    <main className="min-h-screen pt-24 pb-16 bg-surface-container-low">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="admin_panel_settings" className="w-6 h-6 text-primary" />
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
        {!isAdmin && tab === 2 && (
          <HumanResourcesView authFetch={stableAuthFetch} />
        )}
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
        {isAdmin && tab === 5 && <PromosView authFetch={stableAuthFetch} />}
      </div>
    </main>
  );
}
