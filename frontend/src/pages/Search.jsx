import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Pagination from "../components/Pagination.jsx";
import Icon from "../components/Icon.jsx";

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatPrice(price) {
  return price.toLocaleString("vi-VN") + "đ";
}

function localDateStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const BUS_TYPE_LABELS = {
  sleeper: "Sleeper (Giường nằm)",
  standard: "Standard (Ghế ngồi)",
  minibus: "Minibus (Limousine)",
};

const AMENITY_MAP = {
  wifi: { label: "Wifi", icon: "wifi" },
  airConditioner: { label: "Điều hòa", icon: "ac_unit" },
  usb: { label: "Sạc USB", icon: "usb" },
  blanket: { label: "Chăn", icon: "airline_seat_flat" },
  water: { label: "Nước uống", icon: "water_drop" },
};

const CANCEL_POLICY = [
  { when: "Trước khởi hành hơn 24 giờ", refund: "Hoàn 100% giá vé" },
  { when: "Trước khởi hành 12 – 24 giờ", refund: "Hoàn 50% giá vé" },
  { when: "Trước khởi hành dưới 12 giờ", refund: "Không hoàn tiền (0%)" },
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const dateParam = searchParams.get("date") || "";

  const [routes, setRoutes] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterDate, setFilterDate] = useState(dateParam);
  const dateInputRef = useRef(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 10;

  const [selectedTypes, setSelectedTypes] = useState([]);
  const [maxPrice, setMaxPrice] = useState(10000000);

  // Danh sách thành phố lấy từ các tuyến thực tế trong DB
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/trips/routes`)
      .then((r) => r.json())
      .then((d) => setRoutes(Array.isArray(d) ? d : []))
      .catch(() => setRoutes([]));
  }, []);

  const fromCities = [...new Set(routes.map((r) => r.fromCity))].sort();
  const toCities = [
    ...new Set(
      routes
        .filter((r) => !from || r.fromCity === from)
        .map((r) => r.toCity),
    ),
  ].sort();

  function updateLocation(nextFrom, nextTo) {
    const params = new URLSearchParams(searchParams);
    if (nextFrom) params.set("from", nextFrom);
    else params.delete("from");
    if (nextTo) params.set("to", nextTo);
    else params.delete("to");
    setSearchParams(params);
  }

  // Reset về trang 1 khi đổi bất kỳ filter nào
  useEffect(() => {
    setPage(1);
  }, [from, to, filterDate, selectedTypes, maxPrice]);

  useEffect(() => {
    async function fetchTrips() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (filterDate) params.set("date", filterDate);
        if (selectedTypes.length > 0)
          params.set("busType", selectedTypes.join(","));
        if (maxPrice < 10000000) params.set("maxPrice", String(maxPrice));
        params.set("page", String(page));
        params.set("limit", String(PAGE_SIZE));
        const url = `${import.meta.env.VITE_API_URL}/api/trips?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setTrips(data.trips || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTrips();
  }, [from, to, filterDate, selectedTypes, maxPrice, page]);

  function toggleType(type) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  return (
    <main>
      {/* Header */}
      <header className="pt-28 pb-8 bg-surface-container-low">
        <div className="max-w-360 mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">
                {from && to ? `${from} → ${to}` : "Tất cả chuyến xe"}
              </h1>
              <p className="text-secondary font-medium">
                {filterDate ? formatDate(filterDate) : "Tất cả chuyến sắp tới"}
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-outline-variant/20 rounded-xl font-bold text-primary hover:shadow-lg transition-all hover:cursor-pointer"
            >
              Thay đổi tìm kiếm
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-360 mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-20 pt-6 lg:pt-8">
        {/* Mobile/tablet filter toggle */}
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="lg:hidden flex items-center justify-between w-full px-4 py-3 bg-white rounded-xl shadow-sm font-bold text-on-surface"
        >
          <span className="flex items-center gap-2">
            <Icon name="tune" className="w-5 h-5" />
            Bộ lọc
          </span>
          <Icon name={filtersOpen ? "expand_less" : "expand_more"} className="w-5 h-5" />
        </button>

        {/* Sidebar */}
        <aside
          className={`lg:col-span-3 space-y-6 ${filtersOpen ? "block" : "hidden lg:block"}`}
        >
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-8">
            {/* Điểm đi / Điểm đến */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-secondary mb-2">
                  Điểm đi
                </h3>
                <select
                  value={from}
                  onChange={(e) => {
                    const nf = e.target.value;
                    const validTo = routes
                      .filter((r) => r.fromCity === nf)
                      .map((r) => r.toCity);
                    updateLocation(
                      nf,
                      nf && to && !validTo.includes(to) ? "" : to,
                    );
                  }}
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-white cursor-pointer hover:border-primary focus:outline-none focus:border-primary"
                >
                  <option value="">Tất cả điểm đi</option>
                  {fromCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-secondary mb-2">
                  Điểm đến
                </h3>
                <select
                  value={to}
                  onChange={(e) => updateLocation(from, e.target.value)}
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-white cursor-pointer hover:border-primary focus:outline-none focus:border-primary"
                >
                  <option value="">Tất cả điểm đến</option>
                  {toCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ngày đi */}
            <div>
              <h3 className="text-xs font-semibold text-secondary mb-4">
                Ngày đi
              </h3>
              <div className="flex items-center gap-2">
                <div
                  onClick={() => dateInputRef.current?.showPicker?.()}
                  className="flex-1 border border-outline-variant rounded-lg px-3 py-2 text-sm bg-white cursor-pointer hover:border-primary"
                >
                  {filterDate
                    ? new Date(filterDate + "T00:00:00").toLocaleDateString(
                        "vi-VN",
                        { day: "2-digit", month: "2-digit", year: "numeric" },
                      )
                    : "Chọn ngày"}
                </div>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={filterDate}
                  min={localDateStr()}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="sr-only"
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate("")}
                    className="text-xs font-bold text-secondary hover:text-on-surface"
                  >
                    Xoá
                  </button>
                )}
              </div>
            </div>

            {/* Loại xe */}
            <div>
              <h3 className="text-xs font-semibold text-secondary mb-4">
                Loại xe
              </h3>
              <div className="space-y-3">
                {Object.entries(BUS_TYPE_LABELS).map(([type, label]) => (
                  <label
                    key={type}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => toggleType(type)}
                      className="w-5 h-5 rounded accent-primary"
                    />
                    <span className="text-on-surface font-medium group-hover:text-primary transition-colors">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Khoảng giá */}
            <div>
              <h3 className="text-xs font-semibold text-secondary mb-4">
                Khoảng giá (VNĐ)
              </h3>
              <input
                type="range"
                min={100000}
                max={10000000}
                step={50000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #003fb1 ${((maxPrice - 100000) / 9000000) * 100}%, #e1e3e4 ${((maxPrice - 100000) / 9000000) * 100}%)`,
                }}
              />
              <div className="flex justify-between mt-2 text-sm font-bold text-on-surface">
                <span>100.000đ</span>
                <span>{formatPrice(maxPrice)}</span>
              </div>
            </div>

          </div>

          {/* Promo banner */}
          <div className="rounded-xl h-48 bg-primary p-6 flex flex-col justify-end">
            <span className="text-xs font-bold text-white/70 bg-white/20 px-2 py-1 rounded mb-2 inline-block w-fit">
              PROMO
            </span>
            <h4 className="text-white font-bold text-lg leading-tight">
              Giảm 15% cho lần đầu đặt vé qua App
            </h4>
          </div>
        </aside>

        {/* Results */}
        <section className="lg:col-span-9 space-y-6">
          {loading && (
            <div className="text-center py-20 text-secondary font-medium">
              Đang tìm chuyến...
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium">
              {error}
            </div>
          )}

          {!loading && !error && trips.length === 0 && (
            <div className="text-center py-20 text-secondary font-medium">
              Không tìm thấy chuyến phù hợp.
            </div>
          )}

          {!loading &&
            trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onSelect={() => navigate(`/trips/${trip.id}`)}
              />
            ))}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              label="chuyến"
              onChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function TripCard({ trip, onSelect }) {
  const [expanded, setExpanded] = useState(null); // "amenities" | "policy" | null

  const amenities = Object.entries(trip.bus.amenities ?? {})
    .filter(([, v]) => v)
    .map(([k]) => AMENITY_MAP[k])
    .filter(Boolean);

  return (
    <div className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="p-5 lg:p-8 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
        {/* Operator */}
        <div className="lg:w-44 lg:shrink-0 flex lg:flex-col lg:justify-center lg:border-r border-outline-variant/10 lg:pr-6 gap-2 lg:gap-1 items-center lg:items-start justify-between">
          <h2 className="text-base md:text-lg font-black text-on-surface leading-tight">
            {trip.bus.company?.name}
          </h2>
          <span className="inline-block w-fit px-2 py-0.5 bg-surface-container-low text-secondary text-[10px] font-bold rounded-full uppercase tracking-wider">
            {BUS_TYPE_LABELS[trip.bus.busType]} · {trip.bus.totalSeats} chỗ
          </span>
        </div>

        {/* Journey */}
        <div className="flex-1 flex items-center gap-2 sm:gap-3">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-black text-on-surface">
              {formatTime(trip.departureTime)}
            </p>
            <p className="text-secondary text-xs sm:text-sm font-medium">
              {trip.route.fromCity}
            </p>
            <p className="text-secondary text-xs mt-0.5">
              {new Date(trip.departureTime).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[10px] sm:text-xs font-bold text-secondary mb-1">
              {formatDuration(trip.route.estimatedDuration)}
            </span>
            <div className="w-full flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <div className="flex-1 h-px border-t border-dashed border-outline-variant" />
              <div className="w-2 h-2 rounded-full border-2 border-primary shrink-0" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-black text-on-surface">
              {formatTime(trip.arrivalTime)}
            </p>
            <p className="text-secondary text-xs sm:text-sm font-medium">
              {trip.route.toCity}
            </p>
            <p className="text-secondary text-xs mt-0.5">
              {new Date(trip.arrivalTime).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Price & Action */}
        <div className="shrink-0 flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-outline-variant/10">
          <p className="text-2xl lg:text-3xl font-black text-primary">
            {formatPrice(trip.price)}
          </p>
          <button
            onClick={onSelect}
            className="px-6 sm:px-8 py-2.5 lg:py-3 bg-primary text-white text-sm lg:text-base font-bold rounded-lg hover:bg-primary-container transition-colors cursor-pointer"
          >
            Chọn chuyến
          </button>
        </div>
      </div>

      <div className="px-6 lg:px-8 py-3 bg-surface-container-low/50 flex gap-6">
        <button
          onClick={() => setExpanded(expanded === "policy" ? null : "policy")}
          className="text-xs font-bold text-primary hover:opacity-70 cursor-pointer"
        >
          Chính sách hủy vé
        </button>
        {amenities.length > 0 && (
          <button
            onClick={() =>
              setExpanded(expanded === "amenities" ? null : "amenities")
            }
            className="text-xs font-bold text-primary hover:opacity-70 cursor-pointer"
          >
            Tiện ích
          </button>
        )}
      </div>

      {expanded === "policy" && (
        <div className="px-6 lg:px-8 py-4 border-t border-surface-container-low">
          <p className="text-xs font-semibold text-secondary mb-3">
            Chính sách hủy vé
          </p>
          <div className="space-y-2">
            {CANCEL_POLICY.map((p) => (
              <div key={p.when} className="flex justify-between text-sm">
                <span className="text-secondary">{p.when}</span>
                <span className="font-bold text-on-surface">{p.refund}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {expanded === "amenities" && (
        <div className="px-6 lg:px-8 py-4 border-t border-surface-container-low">
          <p className="text-xs font-semibold text-secondary mb-3">
            Tiện ích trên xe
          </p>
          <div className="flex flex-wrap gap-4">
            {amenities.map((a) => (
              <div key={a.label} className="group relative">
                <Icon name={a.icon} className="w-6 h-6 text-primary" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-on-surface text-white text-xs px-2 py-1 rounded shadow-lg z-10">
                  {a.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

