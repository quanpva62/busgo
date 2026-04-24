import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import heroImg from "../assets/img/hero-img.png";
import steeringWheelIcon from "../assets/icons/steering-wheel.svg";
import { useAuth } from "../context/AuthContext";

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

const AMENITY_MAP = {
  wifi: { label: "Wifi", icon: "wifi" },
  airConditioner: { label: "Điều hòa", icon: "ac_unit" },
  usb: { label: "Sạc USB", icon: "usb" },
  blanket: { label: "Chăn", icon: "airline_seat_flat" },
  water: { label: "Nước uống", icon: "water_drop" },
};

const SEAT_STATUS = {
  available: {
    label: "Trống",
    bg: "bg-white border-outline-variant/40 hover:border-primary hover:bg-primary/5 cursor-pointer",
  },
  selected: {
    label: "Đang chọn",
    bg: "bg-primary border-primary text-white cursor-pointer",
  },
  held: {
    label: "Đã đặt",
    bg: "bg-surface-container-highest border-transparent text-secondary cursor-not-allowed",
  },
  booked: {
    label: "Đã đặt",
    bg: "bg-surface-container-highest border-transparent text-secondary cursor-not-allowed",
  },
  myBooked: {
    label: "Bạn đã đặt",
    bg: "bg-green-100 border-green-500 text-green-700 cursor-not-allowed",
  },
};

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
    setSelectedIds((prev) => {
      if (prev.includes(tripSeat.id))
        return prev.filter((s) => s !== tripSeat.id);
      if (prev.length >= 4) return prev;
      return [...prev, tripSeat.id];
    });
  }

  function getSeatStatus(tripSeat) {
    if (selectedIds.includes(tripSeat.id)) return "selected";
    if (
      (tripSeat.status === "booked" || tripSeat.status === "held") &&
      tripSeat.booking?.userId &&
      user?.id &&
      tripSeat.booking.userId === user.id
    ) {
      return "myBooked";
    }
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
    .sort(
      (a, b) => a.seat.rowNum - b.seat.rowNum || a.seat.colNum - b.seat.colNum,
    );
  const lowerSeats = tripSeats
    .filter((ts) => ts.seat.level === "lower")
    .sort(
      (a, b) => a.seat.rowNum - b.seat.rowNum || a.seat.colNum - b.seat.colNum,
    );
  const allSeats = tripSeats.sort(
    (a, b) => a.seat.rowNum - b.seat.rowNum || a.seat.colNum - b.seat.colNum,
  );

  return (
    <main className="min-h-screen pt-24 pb-32 bg-surface-container-low">
      <div className="max-w-360 mx-auto px-6">
        {/* Banner */}
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden mb-6 md:mb-8 min-h-56 md:h-72">
          <img
            src={trip.route.imageUrl || heroImg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 " />
          <div className="relative h-full p-5 md:p-8 flex flex-col justify-between gap-6">
            <span className="inline-flex self-start items-center gap-1 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full tracking-widest uppercase">
              <span className="material-symbols-outlined text-sm">bolt</span>
              Tuyến thẳng
            </span>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="text-white min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight wrap-break-word">
                  {trip.route.fromCity} → {trip.route.toCity}
                </h1>
                <p className="text-white/90 text-sm font-semibold mt-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">
                    directions_bus
                  </span>
                  {trip.bus.company?.name}
                </p>
                <p className="text-white/70 text-xs mt-0.5">
                  {
                    {
                      sleeper: "Giường nằm",
                      standard: "Ghế ngồi",
                      minibus: "Limousine",
                    }[trip.bus.busType]
                  }{" "}
                  · {trip.bus.totalSeats} ghế
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0 bg-white/1 backdrop-blur-xs rounded-2xl px-4 py-3 md:px-7 md:py-5 self-start sm:self-auto">
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                  Giá vé từ
                </p>
                <p className="text-white text-xl md:text-4xl font-black">
                  {formatPrice(trip.price)}
                </p>
              </div>
            </div>
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
                    ⭐ {trip.driver.rating.toFixed(1)} ·{" "}
                    {trip.driver.totalTrips} chuyến
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
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(trip.bus.amenities).map(([key, val]) => {
                    if (!val) return null;
                    const item = AMENITY_MAP[key];
                    if (!item) return null;
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2 text-secondary"
                      >
                        <span className="material-symbols-outlined text-primary text-xl">
                          {item.icon}
                        </span>
                        <span className="text-sm font-medium text-on-surface">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          {/* Right — Seat map */}
          <section className="lg:col-span-8 bg-white rounded-2xl p-4 md:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-lg font-bold text-on-surface">
                Chọn ghế ngồi
              </h2>
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-secondary">
                <span className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-full">
                  <span className="w-3.5 h-3.5 rounded-md border-2 border-outline-variant/50 bg-white inline-block" />
                  Trống
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-full">
                  <span className="w-3.5 h-3.5 rounded-md bg-primary inline-block" />
                  Đang chọn
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-full">
                  <span className="w-3.5 h-3.5 rounded-md bg-surface-container-highest inline-block" />
                  Đã đặt
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-full">
                  <span className="w-3.5 h-3.5 rounded-md bg-green-100 border border-green-500 inline-block" />
                  Bạn đã đặt
                </span>
              </div>
            </div>

            {isSleeper ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <SeatGrid
                  label="Tầng dưới"
                  seats={lowerSeats}
                  selectedIds={selectedIds}
                  onToggle={toggleSeat}
                  getSeatStatus={getSeatStatus}
                  isSleeper
                />
                <SeatGrid
                  label="Tầng trên"
                  seats={upperSeats}
                  selectedIds={selectedIds}
                  onToggle={toggleSeat}
                  getSeatStatus={getSeatStatus}
                  isSleeper
                />
              </div>
            ) : (
              <SeatGrid
                seats={allSeats}
                selectedIds={selectedIds}
                onToggle={toggleSeat}
                getSeatStatus={getSeatStatus}
                noAisle={trip.bus.busType === "minibus"}
              />
            )}
          </section>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant/20 shadow-lg z-40">
        <div className="max-w-360 mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3 md:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 min-w-0 flex-1">
            <div className="min-w-0 hidden sm:block">
              <p className="text-xs font-bold text-secondary uppercase tracking-widest">
                Ghế đã chọn
              </p>
              <p className="font-bold text-primary truncate">
                {selectedSeats.length > 0
                  ? selectedSeats.map((ts) => ts.seat.seatLabel).join(", ")
                  : "Chưa chọn ghế"}
              </p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-widest">
                {selectedSeats.length > 0
                  ? `${selectedSeats.length} ghế · Tổng cộng`
                  : "Tổng cộng"}
              </p>
              <p className="text-lg md:text-xl font-black text-on-surface">
                {formatPrice(totalPrice)}
              </p>
            </div>
          </div>
          <button
            disabled={selectedIds.length === 0}
            onClick={() =>
              navigate(`/checkout/${id}`, {
                state: { selectedSeats, totalPrice },
              })
            }
            className="shrink-0 px-5 md:px-8 py-3 bg-linear-to-br from-primary-container to-primary text-white text-sm md:text-base font-bold rounded-xl shadow-lg hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:cursor-pointer"
          >
            <span className="hidden sm:inline">Đặt vé ngay →</span>
            <span className="sm:hidden">Đặt vé →</span>
          </button>
        </div>
      </div>
    </main>
  );
}

function SeatGrid({
  label,
  seats,
  onToggle,
  getSeatStatus,
  noAisle = false,
  isSleeper = false,
}) {
  const maxRow = Math.max(...seats.map((s) => s.seat.rowNum), 0);
  const maxCol = Math.max(...seats.map((s) => s.seat.colNum), 0);

  const grid = [];
  for (let r = 1; r <= maxRow; r++) {
    const row = [];
    for (let c = 1; c <= maxCol; c++) {
      const ts = seats.find((s) => s.seat.rowNum === r && s.seat.colNum === c);
      row.push(ts || null);
    }
    grid.push(row);
  }

  const sleeperW = maxCol <= 2 ? "w-16" : "w-12";
  const seatClass = isSleeper ? `${sleeperW} h-22` : "w-13 h-13";
  const emptyClass = isSleeper ? `${sleeperW} h-22` : "w-13 h-13";

  const renderSeat = (ts, cIdx) =>
    ts ? (
      <button
        key={ts.id}
        onClick={() => onToggle(ts)}
        className={`${seatClass} rounded-xl border-2 text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
          SEAT_STATUS[getSeatStatus(ts)]?.bg
        }`}
      >
        {isSleeper ? (
          <div className="flex flex-col items-center justify-between h-full w-full px-1.5 py-2">
            <span className="text-[10px] font-bold">{ts.seat.seatLabel}</span>
            <div className="w-full h-3 rounded-sm border-2 border-current opacity-40" />
          </div>
        ) : (
          ts.seat.seatLabel
        )}
      </button>
    ) : (
      <div key={`empty-${cIdx}`} className={emptyClass} />
    );

  return (
    <div>
      {label && (
        <p className="text-xs font-bold text-secondary uppercase tracking-widest text-center mb-4">
          {label}
        </p>
      )}
      <div className="space-y-2">
        {grid.map((row, rIdx) => {
          const seatsInRow = row.filter(Boolean);
          const hasAisle =
            !noAisle && !isSleeper && maxCol >= 4 && seatsInRow.length <= 4;
          const left = hasAisle ? seatsInRow.slice(0, 2) : seatsInRow;
          const right = hasAisle ? seatsInRow.slice(2) : [];
          const isFirstRow = rIdx === 0;

          if (isSleeper) {
            return (
              <div
                key={rIdx}
                className="flex justify-center"
                style={{ gap: "20px" }}
              >
                {seatsInRow.map(renderSeat)}
              </div>
            );
          }

          if (noAisle) {
            return (
              <div key={rIdx} className="flex gap-1.5 justify-center">
                {row.map((ts, cIdx) => {
                  if (isFirstRow && cIdx === 0) {
                    return (
                      <div
                        key="driver"
                        className={`${seatClass} rounded-xl border-2 border-outline-variant/20 bg-surface-container-low flex flex-col items-center justify-center gap-0.5 text-secondary`}
                      >
                        <img
                          src={steeringWheelIcon}
                          alt="Driver"
                          className="w-8 h-8"
                        />
                      </div>
                    );
                  }
                  return renderSeat(ts, cIdx);
                })}
              </div>
            );
          }

          return (
            <div key={rIdx} className="flex gap-1.5 justify-center">
              {left.map(renderSeat)}
              {hasAisle && <div className="w-13" />}
              {right.map(renderSeat)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
