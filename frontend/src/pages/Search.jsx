import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

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

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const BUS_TYPE_LABELS = {
  sleeper: "Sleeper (Giường nằm)",
  standard: "Standard (Ghế ngồi)",
  minibus: "Minibus (Limousine)",
};

const TIME_SLOTS = [
  { label: "Sáng sớm", start: 4, end: 11 },
  { label: "Buổi trưa", start: 11, end: 14 },
  { label: "Buổi chiều", start: 14, end: 18 },
  { label: "Ban đêm", start: 18, end: 4, overnight: true },
];

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedTypes, setSelectedTypes] = useState([]);
  const [maxPrice, setMaxPrice] = useState(10000000);
  const [selectedSlots, setSelectedSlots] = useState([]);

  useEffect(() => {
    if (!from || !to || !date) return;

    async function fetchTrips() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/trips?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`,
        );
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setTrips(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTrips();
  }, [from, to, date]);

  const filtered = trips.filter((trip) => {
    if (selectedTypes.length > 0 && !selectedTypes.includes(trip.bus.busType))
      return false;
    if (trip.price > maxPrice) return false;
    if (selectedSlots.length > 0) {
      const hour = new Date(trip.departureTime).getHours();
      const inSlot = selectedSlots.some((idx) => {
        const s = TIME_SLOTS[idx];
        return s.overnight
          ? hour >= s.start || hour < s.end
          : hour >= s.start && hour < s.end;
      });
      if (!inSlot) return false;
    }
    return true;
  });

  function toggleType(type) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  function toggleSlot(idx) {
    setSelectedSlots((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
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
                {from} → {to}
              </h1>
              <p className="text-secondary font-medium">
                {date ? formatDate(date) : ""}
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
      <div className="max-w-360 mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 pb-20 pt-8">
        {/* Sidebar */}
        <aside className="md:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-8">
            {/* Loại xe */}
            <div>
              <h3 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">
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
              <h3 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">
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

            {/* Giờ khởi hành */}
            <div>
              <h3 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">
                Giờ khởi hành
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOTS.map((slot, idx) => (
                  <button
                    key={slot.label}
                    onClick={() => toggleSlot(idx)}
                    className={`py-2 text-sm font-bold border rounded-lg transition-colors hover:cursor-pointer ${
                      selectedSlots.includes(idx)
                        ? "bg-primary text-white border-primary"
                        : "border-outline-variant/30 hover:bg-surface-container-low"
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
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
        <section className="md:col-span-9 space-y-6">
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

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-20 text-secondary font-medium">
              Không tìm thấy chuyến phù hợp.
            </div>
          )}

          {filtered.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onSelect={() => navigate(`/trips/${trip.id}`)}
            />
          ))}
        </section>
      </div>
    </main>
  );
}

function TripCard({ trip, onSelect }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="p-5 md:p-8 flex flex-row items-center gap-4 md:gap-6">
        {/* Operator */}
        <div className="w-36 md:w-44 shrink-0 flex flex-col justify-center border-r border-outline-variant/10 pr-4 md:pr-6 gap-1">
          <h2 className="text-base md:text-lg font-black text-on-surface leading-tight">
            {trip.bus.company?.name}
          </h2>
          <span className="inline-block w-fit px-2 py-0.5 bg-surface-container-low text-secondary text-[10px] font-bold rounded-full uppercase tracking-wider">
            {BUS_TYPE_LABELS[trip.bus.busType]} · {trip.bus.totalSeats} chỗ
          </span>
        </div>

        {/* Journey */}
        <div className="flex-1 flex items-center gap-3">
          <div className="text-center">
            <p className="text-2xl font-black text-on-surface">
              {formatTime(trip.departureTime)}
            </p>
            <p className="text-secondary text-sm font-medium">
              {trip.route.fromCity}
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <span className="text-xs font-bold text-secondary mb-1">
              {formatDuration(trip.route.estimatedDuration)}
            </span>
            <div className="w-full flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <div className="flex-1 h-px border-t border-dashed border-outline-variant" />
              <div className="w-2 h-2 rounded-full border-2 border-primary shrink-0" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-on-surface">
              {formatTime(trip.arrivalTime)}
            </p>
            <p className="text-secondary text-sm font-medium">
              {trip.route.toCity}
            </p>
          </div>
        </div>

        {/* Price & Action */}
        <div className="shrink-0 flex flex-col items-end gap-3">
          <p className="text-3xl font-black text-primary">
            {formatPrice(trip.price)}
          </p>
          <button
            onClick={onSelect}
            className="w-full md:w-auto px-8 py-3 bg-linear-to-br from-primary-container to-primary text-white font-bold rounded-xl shadow-lg hover:opacity-95 active:scale-[0.98] transition-all hover:cursor-pointer"
          >
            Chọn chuyến
          </button>
        </div>
      </div>

      <div className="px-6 md:px-8 py-3 bg-surface-container-low/50 flex gap-6">
        <button className="text-xs font-bold text-primary hover:opacity-70">
          Chính sách hủy vé
        </button>
        <button className="text-xs font-bold text-primary hover:opacity-70">
          Tiện ích
        </button>
      </div>
    </div>
  );
}
