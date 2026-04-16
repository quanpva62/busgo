import { useState, useEffect, useRef } from "react";
import RouteCard from "./RouteCard.jsx";
import iconArrow from "../assets/icons/right-arrow.svg";

const routes = [
  { from: "Sài Gòn", to: "Đà Lạt",    hours: 7,  price: "280.000đ", badge: "Bán chạy" },
  { from: "Sài Gòn", to: "Đà Nẵng",   hours: 16, price: "450.000đ" },
  { from: "Sài Gòn", to: "Nha Trang",  hours: 8,  price: "320.000đ" },
  { from: "Sài Gòn", to: "Vũng Tàu",  hours: 4,  price: "150.000đ" },
  { from: "Hà Nội",  to: "Đà Nẵng",   hours: 12, price: "380.000đ" },
  { from: "Hà Nội",  to: "Huế",        hours: 10, price: "280.000đ" },
  { from: "Đà Nẵng", to: "Hội An",    hours: 1,  price: "80.000đ",  badge: "Hot" },
];

const GAP = 24;

// Số card hiển thị theo màn hình
function getVisible() {
  if (window.innerWidth >= 1024) return 4; // desktop
  if (window.innerWidth >= 640)  return 2; // tablet
  return 1;                                 // mobile
}

export default function RouteCarousel() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(getVisible);
  const [cardWidth, setCardWidth] = useState(0);
  const containerRef = useRef(null);

  const maxIndex = Math.max(0, routes.length - visible);
  const step = cardWidth + GAP;

  // Cập nhật visible + cardWidth khi resize
  useEffect(() => {
    const update = () => {
      const v = getVisible();
      const newMaxIndex = Math.max(0, routes.length - v);
      setVisible(v);
      setIndex((i) => Math.min(i, newMaxIndex)); // reset index trong cùng callback
      if (containerRef.current) {
        const w = (containerRef.current.offsetWidth - GAP * (v - 1)) / v;
        setCardWidth(w);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const prev = () => setIndex((i) => (i <= 0 ? maxIndex : i - 1));
  const next = () => setIndex((i) => (i >= maxIndex ? 0 : i + 1));

  // Auto scroll mỗi 3 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 3000);
    return () => clearInterval(timer);
  }, [maxIndex]);

  return (
    <div className="relative px-12">
      {/* Nút prev */}
      <button
        onClick={prev}
        className="absolute left-0 top-[45%] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-low transition-colors"
      >
        <img src={iconArrow} alt="prev" className="w-5 h-5 rotate-180" />
      </button>

      {/* Track */}
      <div ref={containerRef} style={{ overflowX: "clip" }} className="py-4 -my-4">
        <div
          className="flex gap-6 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${index * step}px)` }}
        >
          {routes.map((route) => (
            <div
              key={`${route.from}-${route.to}`}
              className="shrink-0"
              style={{ width: cardWidth || "auto" }}
            >
              <RouteCard {...route} />
            </div>
          ))}
        </div>
      </div>

      {/* Nút next */}
      <button
        onClick={next}
        className="absolute right-0 top-[45%] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-low transition-colors"
      >
        <img src={iconArrow} alt="next" className="w-5 h-5" />
      </button>

      {/* Dots indicator */}
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
