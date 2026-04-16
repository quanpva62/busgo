import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
  });
}

function formatPrice(price) {
  return price.toLocaleString("vi-VN") + "đ";
}

const BUS_TYPE_LABELS = {
  sleeper: "Sleeper",
  standard: "Standard",
  minibus: "Minibus",
};

const SEAT_STATUS = {
  available: { label: "Trống", bg: "bg-white border-outline-variant/40 hover:border-primary hover:bg-primary/5 cursor-pointer" },
  selected: { label: "Đang chọn", bg: "bg-primary border-primary text-white cursor-pointer" },
  held: { label: "Đã đặt", bg: "bg-surface-container-highest border-transparent text-secondary cursor-not-allowed" },
  booked: { label: "Đã đặt", bg: "bg-surface-container-highest border-transparent text-secondary cursor-not-allowed" },
};

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [tripSeats, setTripSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const [tripRes, seatsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/trips/${id}`),
          fetch(`${import.meta.env.VITE_API_URL}/api/trips/${id}/seats`),
        ]);
        const [tripData, seatsData] = await Promise.all([
          tripRes.json(),
          seatsRes.json(),
        ]);
        if (tripData.error) throw new Error(tripData.error);
        if (seatsData.error) throw new Error(seatsData.error);
        setTrip(tripData);
        setTripSeats(seatsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  function toggleSeat(tripSeat) {
    if (tripSeat.status !== "available" && !selectedIds.includes(tripSeat.id))
      return;
    setSelectedIds((prev) =>
      prev.includes(tripSeat.id)
        ? prev.filter((s) => s !== tripSeat.id)
        : [...prev, tripSeat.id]
    );
  }

  function getSeatStatus(tripSeat) {
    if (selectedIds.includes(tripSeat.id)) return "selected";
    return tripSeat.status;
  }

  const selectedSeats = tripSeats.filter((ts) => selectedIds.includes(ts.id));
  const totalPrice = trip ? trip.price * selectedIds.length : 0;

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

  if (!trip) return null;

  const isSleeper = trip.bus.busType === "sleeper";
  const upperSeats = tripSeats
    .filter((ts) => ts.seat.level === "upper")
    .sort((a, b) => a.seat.rowNum - b.seat.rowNum || a.seat.colNum - b.seat.colNum);
  const lowerSeats = tripSeats
    .filter((ts) => ts.seat.level === "lower")
    .sort((a, b) => a.seat.rowNum - b.seat.rowNum || a.seat.colNum - b.seat.colNum);
  const allSeats = tripSeats.sort(
    (a, b) => a.seat.rowNum - b.seat.rowNum || a.seat.colNum - b.seat.colNum
  );

  return (
    <main className="min-h-screen pt-24 pb-32 bg-surface-container-low">
      <div className="max-w-360 mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-secondary text-sm font-medium mb-1">
              {trip.bus.typeName} · {BUS_TYPE_LABELS[trip.bus.busType]}{" "}
              {trip.bus.totalSeats} Ghế
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface">
              {trip.route.fromCity}{" "}
              <span className="text-primary">→</span>{" "}
              {trip.route.toCity}
            </h1>
          </div>
          <div className="text-right shrink-0">
            <p className="text-secondary text-sm font-medium">Giá vé từ</p>
            <p className="text-3xl font-black text-primary">
              {formatPrice(trip.price)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left — Trip Info */}
          <aside className="lg:col-span-4 space-y-4">
            {/* Driver */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">
                Tài xế chuyến này
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                  {trip.driver.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-on-surface">
                    {trip.driver.fullName}
                  </p>
                  <p className="text-secondary text-sm">
                    ⭐ {trip.driver.rating.toFixed(1)} · {trip.driver.totalTrips} chuyến
                  </p>
                </div>
              </div>
            </div>

            {/* Trip info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">
                    Khởi hành
                  </p>
                  <p className="text-xl font-black text-on-surface">
                    {formatTime(trip.departureTime)}
                  </p>
                  <p className="text-secondary text-sm">
                    {formatDate(trip.departureTime)}
                  </p>
                  <p className="text-secondary text-xs mt-1">
                    {trip.pickupAddress}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">
                    Dự kiến đến
                  </p>
                  <p className="text-xl font-black text-on-surface">
                    {formatTime(trip.arrivalTime)}
                  </p>
                  <p className="text-secondary text-sm">
                    {formatDate(trip.arrivalTime)}
                  </p>
                  <p className="text-secondary text-xs mt-1">
                    {trip.dropoffAddress}
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-outline-variant/20">
                <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">
                  Biển số xe
                </p>
                <p className="font-bold text-on-surface">
                  {trip.bus.licensePlate}
                </p>
              </div>
            </div>

            {/* Amenities */}
            {trip.bus.amenities && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">
                  Tiện ích
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(trip.bus.amenities).map(([key, val]) =>
                    val ? (
                      <span
                        key={key}
                        className="px-3 py-1 bg-primary/5 text-primary text-xs font-semibold rounded-full"
                      >
                        {key}
                      </span>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </aside>

          {/* Right — Seat map */}
          <section className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-on-surface">
                Chọn vị trí ngồi
              </h2>
              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-semibold text-secondary">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded border border-outline-variant/40 bg-white inline-block" />
                  Trống
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded border border-primary bg-primary inline-block" />
                  Đang chọn
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-surface-container-highest inline-block" />
                  Đã đặt
                </span>
              </div>
            </div>

            {isSleeper ? (
              <div className="grid grid-cols-2 gap-6">
                <SeatGrid
                  label="Tầng trên (Upper)"
                  seats={upperSeats}
                  selectedIds={selectedIds}
                  onToggle={toggleSeat}
                  getSeatStatus={getSeatStatus}
                />
                <SeatGrid
                  label="Tầng dưới (Lower)"
                  seats={lowerSeats}
                  selectedIds={selectedIds}
                  onToggle={toggleSeat}
                  getSeatStatus={getSeatStatus}
                />
              </div>
            ) : (
              <SeatGrid
                seats={allSeats}
                selectedIds={selectedIds}
                onToggle={toggleSeat}
                getSeatStatus={getSeatStatus}
              />
            )}
          </section>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant/20 shadow-lg z-40">
        <div className="max-w-360 mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs font-bold text-secondary uppercase tracking-widest">
                Ghế đã chọn
              </p>
              <p className="font-bold text-primary">
                {selectedSeats.length > 0
                  ? selectedSeats.map((ts) => ts.seat.seatLabel).join(", ")
                  : "Chưa chọn ghế"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-secondary uppercase tracking-widest">
                Tổng cộng
              </p>
              <p className="text-xl font-black text-on-surface">
                {formatPrice(totalPrice)}
              </p>
            </div>
          </div>
          <button
            disabled={selectedIds.length === 0}
            onClick={() =>
              navigate(`/checkout/${id}`, {
                state: { selectedIds, totalPrice },
              })
            }
            className="px-8 py-3 bg-linear-to-br from-primary-container to-primary text-white font-bold rounded-xl shadow-lg hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:cursor-pointer"
          >
            Đặt vé ngay →
          </button>
        </div>
      </div>
    </main>
  );
}

function SeatGrid({ label, seats, onToggle, getSeatStatus }) {
  // Build 2D grid from rowNum/colNum
  const maxRow = Math.max(...seats.map((s) => s.seat.rowNum), 0);
  const maxCol = Math.max(...seats.map((s) => s.seat.colNum), 0);

  const grid = [];
  for (let r = 1; r <= maxRow; r++) {
    const row = [];
    for (let c = 1; c <= maxCol; c++) {
      const ts = seats.find(
        (s) => s.seat.rowNum === r && s.seat.colNum === c
      );
      row.push(ts || null);
    }
    grid.push(row);
  }

  return (
    <div>
      {label && (
        <p className="text-xs font-bold text-secondary uppercase tracking-widest text-center mb-4">
          {label}
        </p>
      )}
      <div className="space-y-2">
        {grid.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-2 justify-center">
            {row.map((ts, cIdx) =>
              ts ? (
                <button
                  key={ts.id}
                  onClick={() => onToggle(ts)}
                  className={`w-12 h-12 rounded-xl border-2 text-xs font-bold transition-all ${
                    SEAT_STATUS[getSeatStatus(ts)]?.bg
                  }`}
                >
                  {ts.seat.seatLabel}
                </button>
              ) : (
                <div key={cIdx} className="w-12 h-12" />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
