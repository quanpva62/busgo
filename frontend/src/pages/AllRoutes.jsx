import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import heroImg from "../assets/img/hero-img.webp";
import Icon from "../components/Icon.jsx";

const API = import.meta.env.VITE_API_URL;

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}p` : `${h}h`;
}

export default function AllRoutes() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${API}/api/trips/routes`)
      .then((r) => r.json())
      .then((d) => setRoutes(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = routes.filter(
    (r) =>
      r.fromCity.toLowerCase().includes(search.toLowerCase()) ||
      r.toCity.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="min-h-screen pt-24 pb-16 bg-surface-container-low">
      <div className="max-w-360 mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <span className="text-primary font-semibold text-sm mb-2 block">
            KHÁM PHÁ VIỆT NAM
          </span>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <h1 className="text-3xl lg:text-5xl font-extrabold text-on-surface tracking-tight">
              Tất cả tuyến đường
            </h1>
            <input
              type="text"
              placeholder="Tìm thành phố..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary w-full sm:w-64"
            />
          </div>
        </div>

        {loading && <p className="text-secondary text-sm">Đang tải...</p>}

        {!loading && filtered.length === 0 && (
          <p className="text-secondary text-sm">
            Không tìm thấy tuyến phù hợp.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((r) => (
            <div
              key={r.id}
              onClick={() =>
                navigate(
                  `/search?from=${encodeURIComponent(r.fromCity)}&to=${encodeURIComponent(r.toCity)}`,
                )
              }
              className="group bg-white rounded-xl overflow-hidden cursor-pointer border border-outline-variant hover:border-primary transition-colors"
            >
              <div className="relative h-48 overflow-hidden bg-surface-container-high">
                <img
                  src={r.imageUrl || heroImg}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-black text-on-surface mb-1">
                  {r.fromCity} → {r.toCity}
                </h3>
                <p className="text-secondary text-sm flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Icon name="straighten" className="w-4 h-4" />
                    {r.distanceKm} km
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="schedule" className="w-4 h-4" />
                    {formatDuration(r.estimatedDuration)}
                  </span>
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">
                    Xem chuyến
                  </span>
                  <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                    <Icon
                      name="arrow_forward"
                      className="w-4 h-4 group-hover:text-white transition-colors duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
