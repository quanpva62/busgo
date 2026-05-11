import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import iconArrow from "../assets/icons/right-arrow.svg";

const API = import.meta.env.VITE_API_URL;

const BUS_TYPE_LABELS = {
  sleeper: "Giường nằm",
  standard: "Ghế ngồi",
  minibus: "Limousine",
};

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "numeric",
  });
}

function formatPrice(p) {
  return p.toLocaleString("vi-VN") + "đ";
}

function UpcomingTripCard({ trip, onClick }) {
  const low = trip.availableSeats <= 5;
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-5 shadow-sm border border-transparent hover:border-primary/20 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <p className="font-black text-on-surface text-base leading-tight">
          {trip.fromCity} → {trip.toCity}
        </p>
        <span className="text-xs font-bold text-secondary bg-surface-container-low px-2 py-0.5 rounded-full">
          {BUS_TYPE_LABELS[trip.busType]}
        </span>
      </div>

      <p className="text-xs text-secondary font-medium truncate">{trip.companyName}</p>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-black text-on-surface">{formatTime(trip.departureTime)}</p>
          <p className="text-xs text-secondary">{formatDate(trip.departureTime)}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-primary">{formatPrice(trip.price)}</p>
          <p className={`text-xs font-bold ${low ? "text-red-500" : "text-green-600"}`}>
            {low ? `Còn ${trip.availableSeats} chỗ!` : `${trip.availableSeats} chỗ trống`}
          </p>
        </div>
      </div>
    </div>
  );
}

const GAP = 24;

function getVisible() {
  if (window.innerWidth >= 1024) return 3;
  if (window.innerWidth >= 640) return 2;
  return 1;
}

export default function RouteCarousel() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(getVisible);
  const [cardWidth, setCardWidth] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/trips/upcoming`)
      .then((r) => r.json())
      .then((d) => setTrips(Array.isArray(d) ? d : []));
  }, []);

  const maxIndex = Math.max(0, trips.length - visible);
  const step = cardWidth + GAP;

  useEffect(() => {
    const update = () => {
      const v = getVisible();
      setVisible(v);
      setIndex((i) => Math.min(i, Math.max(0, trips.length - v)));
      if (containerRef.current) {
        const w = (containerRef.current.offsetWidth - GAP * (v - 1)) / v;
        setCardWidth(w);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [trips.length]);

  useEffect(() => {
    if (trips.length === 0) return;
    const timer = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 3500);
    return () => clearInterval(timer);
  }, [maxIndex, trips.length]);

  if (trips.length === 0) return null;

  return (
    <div className="relative sm:px-12">
      <button
        onClick={() => setIndex((i) => (i <= 0 ? maxIndex : i - 1))}
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-outline-variant/30 items-center justify-center hover:bg-surface-container-low transition-colors"
      >
        <img src={iconArrow} alt="prev" className="w-5 h-5 rotate-180" />
      </button>

      <div ref={containerRef} style={{ overflowX: "clip" }} className="py-4 -my-4">
        <div
          className="flex gap-6 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${index * step}px)` }}
        >
          {trips.map((trip) => (
            <div key={trip.id} className="shrink-0" style={{ width: cardWidth || "auto" }}>
              <UpcomingTripCard
                trip={trip}
                onClick={() => navigate(`/trips/${trip.id}`)}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setIndex((i) => (i >= maxIndex ? 0 : i + 1))}
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-outline-variant/30 items-center justify-center hover:bg-surface-container-low transition-colors"
      >
        <img src={iconArrow} alt="next" className="w-5 h-5" />
      </button>

      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-primary" : "w-2 bg-outline-variant"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
