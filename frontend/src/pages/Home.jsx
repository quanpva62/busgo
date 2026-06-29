import heroImg from "../assets/img/hero-img.webp";
import { useState, useEffect, useRef } from "react";
import Icon from "../components/Icon.jsx";
import iconLocation from "../assets/icons/location_on.svg";
import iconFlag from "../assets/icons/flag.svg";
import iconCalendar from "../assets/icons/calendar.svg";
import iconDropdown from "../assets/icons/dropdown.svg";
import iconSearch from "../assets/icons/search_icon.svg";
import iconArrow from "../assets/icons/right-arrow.svg";
import iconVerified from "../assets/icons/verified.svg";
import RouteCard from "../components/RouteCard.jsx";
import RouteCarousel from "../components/RouteCarousel.jsx";
import iconPayments from "../assets/icons/payments.svg";
import iconSupport from "../assets/icons/support.svg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const API = import.meta.env.VITE_API_URL;

function localDateStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openFrom, setOpenFrom] = useState(false);
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/trips/popular`)
      .then((r) => r.json())
      .then((d) => setPopularRoutes(Array.isArray(d) ? d : []));
    fetch(`${API}/api/trips/routes`)
      .then((r) => r.json())
      .then((d) => setRoutes(Array.isArray(d) ? d : []));
  }, []);
  const [selectedFrom, setSelectedFrom] = useState("Hà Nội");
  const [openTo, setOpenTo] = useState(false);
  const [selectedTo, setSelectedTo] = useState("TP.HCM");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [date, setDate] = useState(localDateStr(tomorrow));
  const dateInputRef = useRef(null);

  // Cities phụ thuộc vào routes thực tế trong DB
  const fromCities = [...new Set(routes.map((r) => r.fromCity))].sort();
  const toCities = [
    ...new Set(
      routes.filter((r) => r.fromCity === selectedFrom).map((r) => r.toCity),
    ),
  ].sort();

  function handleSelectFrom(city) {
    setSelectedFrom(city);
    setOpenFrom(false);
    // Reset điểm đến nếu không còn hợp lệ
    const validTo = routes
      .filter((r) => r.fromCity === city)
      .map((r) => r.toCity);
    if (validTo.length > 0 && !validTo.includes(selectedTo)) {
      setSelectedTo(validTo.sort()[0]);
    }
  }

  return (
    <main>
      {/* Phone collection prompt — chỉ hiện cho user đã login mà chưa có sđt */}
      {user && !user.phone && (
        <div className="fixed top-20 left-0 right-0 z-40 bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-360 mx-auto px-6 py-3 flex items-center gap-3">
            <Icon name="info" className="w-5 h-5 text-yellow-600 shrink-0" />
            <p className="flex-1 text-yellow-900 text-sm">
              <span className="font-bold">Cần cập nhật số điện thoại</span> để
              nhà xe có thể liên hệ khi cần thiết.
            </p>
            <button
              onClick={() => navigate("/profile")}
              className="text-sm text-yellow-900 font-bold hover:opacity-70 underline shrink-0"
            >
              Cập nhật ngay
            </button>
          </div>
        </div>
      )}

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen lg:min-h-150 flex items-center justify-center mt-20 py-12 lg:py-0">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImg}
            alt="hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-on-surface/40" />
        </div>

        <div className="relative z-10 max-w-360 w-full mx-auto px-6">
          <div className="max-w-2xl mb-10">
            <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 leading-[1.1] tracking-tight">
              Đặt vé xe khách,
              <br />
              nhanh và rõ ràng
            </h1>
            <p className="text-white/85 text-base lg:text-lg max-w-xl">
              Tìm chuyến, chọn ghế và thanh toán trực tuyến. So sánh giá giữa
              các nhà xe trên cùng một tuyến.
            </p>
          </div>

          {/* Form tìm kiếm */}
          <div className="bg-white p-5 rounded-xl border border-outline-variant shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Điểm đi */}
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-secondary px-1">
                  Điểm đi
                </label>
                <div className="relative">
                  <img
                    src={iconLocation}
                    alt=""
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10"
                  />
                  <button
                    type="button"
                    onClick={() => setOpenFrom(!openFrom)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-lg text-left font-semibold text-on-surface flex items-center justify-between hover:cursor-pointer"
                  >
                    {selectedFrom}
                    <img src={iconDropdown} alt="" className="w-5 h-5" />
                  </button>
                  {openFrom && (
                    <ul className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-sm border border-outline-variant z-50 overflow-hidden max-h-72 overflow-y-auto">
                      {fromCities.map((city) => (
                        <li
                          key={city}
                          onClick={() => handleSelectFrom(city)}
                          className="px-4 py-3 hover:bg-surface-container-low font-medium text-on-surface cursor-pointer transition-colors z-40"
                        >
                          {city}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Điểm đến */}
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-secondary px-1">
                  Điểm đến
                </label>
                <div className="relative">
                  <img
                    src={iconFlag}
                    alt=""
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10"
                  />
                  <button
                    type="button"
                    onClick={() => setOpenTo(!openTo)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-lg text-left font-semibold text-on-surface flex items-center justify-between hover:cursor-pointer"
                  >
                    {selectedTo}
                    <img src={iconDropdown} alt="" className="w-5 h-5" />
                  </button>
                  {openTo && (
                    <ul className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-sm border border-outline-variant z-50 overflow-hidden max-h-72 overflow-y-auto">
                      {toCities.map((city) => (
                        <li
                          key={city}
                          onClick={() => {
                            setSelectedTo(city);
                            setOpenTo(false);
                          }}
                          className="px-4 py-3 hover:bg-surface-container-low font-medium text-on-surface cursor-pointer transition-colors z-40"
                        >
                          {city}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Ngày đi */}
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-secondary px-1">
                  NGÀY ĐI
                </label>
                <div
                  onClick={() => dateInputRef.current?.showPicker?.()}
                  className="relative cursor-pointer"
                >
                  <img
                    src={iconCalendar}
                    alt=""
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                  />
                  <div className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-lg font-semibold text-on-surface">
                    {date
                      ? new Date(date + "T00:00:00").toLocaleDateString(
                          "vi-VN",
                          { day: "2-digit", month: "2-digit", year: "numeric" },
                        )
                      : "Chọn ngày"}
                  </div>
                  <input
                    ref={dateInputRef}
                    type="date"
                    min={localDateStr()}
                    max="2028-12-31"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="sr-only"
                  />
                </div>
              </div>

              {/* Button tìm */}
              <div className="flex items-end">
                <button
                  onClick={() =>
                    navigate(
                      `/search?from=${encodeURIComponent(selectedFrom)}&to=${encodeURIComponent(selectedTo)}&date=${date}`,
                    )
                  }
                  className="w-full py-4 bg-primary text-white font-bold rounded-lg hover:bg-primary-container transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <img
                    src={iconSearch}
                    alt=""
                    className="w-5 h-5 brightness-0 invert"
                  />
                  Tìm chuyến
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TUYẾN PHỔ BIẾN ===== */}
      <section className="py-12 lg:py-24 max-w-360 mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight">
            Tuyến đường phổ biến
          </h2>
          <button
            onClick={() => navigate("/routes")}
            className="flex items-center gap-2 text-primary font-semibold hover:text-primary-container transition-colors self-start sm:self-auto"
          >
            Xem tất cả
            <img src={iconArrow} alt="" className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularRoutes.map((r, i) => (
            <div
              key={r.id}
              className={`cursor-pointer ${i === 2 ? "sm:hidden lg:block" : ""}`}
              onClick={() =>
                navigate(
                  `/search?from=${encodeURIComponent(r.fromCity)}&to=${encodeURIComponent(r.toCity)}`,
                )
              }
            >
              <RouteCard
                from={r.fromCity}
                to={r.toCity}
                hours={Math.round(r.estimatedDuration / 60)}
                price={r.minPrice.toLocaleString("vi-VN") + "đ"}
                badge={i === 0 ? "Phổ biến nhất" : null}
                img={r.imageUrl}
              />
            </div>
          ))}
        </div>

        {/* Chuyến sắp khởi hành */}
        <div className="mt-16">
          <div className="mb-8">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight">
              Chuyến sắp khởi hành
            </h2>
            <p className="text-secondary mt-1">Khởi hành trong 24 giờ tới</p>
          </div>
          <RouteCarousel />
        </div>
      </section>

      {/* ===== TẠI SAO CHỌN BUSGO ===== */}
      <section className="py-12 lg:py-24 bg-surface-container-low border-t border-outline-variant">
        <div className="max-w-360 mx-auto px-6">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight mb-10">
            Tại sao chọn BusGo?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: iconVerified,
                title: "So sánh nhiều nhà xe",
                desc: "Nhiều nhà xe trên cùng một tuyến, hiển thị cạnh nhau để bạn so giá và giờ chạy.",
              },
              {
                icon: iconPayments,
                title: "Thanh toán trực tuyến",
                desc: "Thanh toán qua VNPay, vé điện tử kèm mã QR gửi về email ngay sau khi đặt.",
              },
              {
                icon: iconSupport,
                title: "Trợ lý ảo AI",
                desc: "Hỏi đáp về tuyến, giá vé và lịch chạy. Trợ lý gợi ý chuyến phù hợp tức thì.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white border border-outline-variant rounded-xl p-6"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <img src={item.icon} alt="" className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold mb-2">{item.title}</h4>
                <p className="text-secondary leading-relaxed text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
