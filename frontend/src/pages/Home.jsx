import heroImg from "../assets/img/hero-img.png";
import { useState } from "react";
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

export default function Home() {
  const navigate = useNavigate();
  const [openFrom, setOpenFrom] = useState(false);
  const [selectedFrom, setSelectedFrom] = useState("TP. Hồ Chí Minh");
  const [openTo, setOpenTo] = useState(false);
  const [selectedTo, setSelectedTo] = useState("Đà Lạt");
  const [date, setDate] = useState("");

  return (
    <main>
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen lg:min-h-150 flex items-center justify-center mt-20 py-12 lg:py-0">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImg}
            alt="hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 " />
        </div>

        <div className="relative z-10 max-w-360 w-full mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <h1 className="text-white text-4xl sm:text-5xl lg:text-[72px] font-normal mb-4 lg:mb-6 leading-normal">
              Hành trình <br />
              Thông minh
            </h1>
            <p className="text-white/90 text-base lg:text-xl font-medium max-w-lg">
              Trải nghiệm dịch vụ đặt vé xe khách hiện đại hàng đầu Việt Nam.
              Nhanh chóng, tin cậy và tận tâm.
            </p>
          </div>

          {/* Form tìm kiếm */}
          <div className="bg-white/95 backdrop-blur-md px-6 py-6 rounded-3xl shadow-2xl border border-outline-variant/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Điểm đi */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase px-1">
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
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-xl text-left font-semibold text-on-surface flex items-center justify-between hover:cursor-pointer"
                  >
                    {selectedFrom}
                    <img src={iconDropdown} alt="" className="w-5 h-5" />
                  </button>
                  {openFrom && (
                    <ul className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-outline-variant/30 z-50 overflow-hidden ">
                      {["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ"].map(
                        (city) => (
                          <li
                            key={city}
                            onClick={() => {
                              setSelectedFrom(city);
                              setOpenFrom(false);
                            }}
                            className="px-4 py-3 hover:bg-surface-container-low font-medium text-on-surface cursor-pointer transition-colors z-40"
                          >
                            {city}
                          </li>
                        ),
                      )}
                    </ul>
                  )}
                </div>
              </div>

              {/* Điểm đến */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase px-1">
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
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-xl text-left font-semibold text-on-surface flex items-center justify-between hover:cursor-pointer"
                  >
                    {selectedTo}
                    <img src={iconDropdown} alt="" className="w-5 h-5" />
                  </button>
                  {openTo && (
                    <ul className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-outline-variant/30 z-50 overflow-hidden">
                      {["Đà Lạt", "Nha Trang", "Vũng Tàu", "Đà Nẵng"].map(
                        (city) => (
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
                        ),
                      )}
                    </ul>
                  )}
                </div>
              </div>

              {/* Ngày đi */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase px-1">
                  NGÀY ĐI
                </label>
                <div className="relative">
                  <img
                    src={iconCalendar}
                    alt=""
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  />
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    max="2028-12-31"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-fixed font-semibold text-on-surface hover:cursor-pointer"
                  />
                </div>
              </div>

              {/* Button tìm */}
              <div className="flex items-end">
                <button
                  onClick={() =>
                    navigate(`/search?from=${encodeURIComponent(selectedFrom)}&to=${encodeURIComponent(selectedTo)}&date=${date}`)
                  }
                  className="w-full py-4 bg-linear-to-br from-primary-container to-primary text-white font-bold rounded-xl shadow-lg hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:cursor-pointer"
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 lg:mb-12 gap-3">
          <div>
            <span className="text-primary font-bold tracking-widest text-xs uppercase mb-2 block">
              KHÁM PHÁ VIỆT NAM
            </span>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-on-surface tracking-tight">
              Tuyến đường phổ biến
            </h2>
          </div>
          <button className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all self-start sm:self-auto">
            Xem tất cả
            <img src={iconArrow} alt="" className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              from: "Sài Gòn",
              to: "Đà Lạt",
              hours: 7,
              price: "280.000đ",
              badge: "Bán chạy",
            },
            { from: "Sài Gòn", to: "Đà Nẵng", hours: 16, price: "450.000đ" },
            { from: "Sài Gòn", to: "Nha Trang", hours: 8, price: "320.000đ" },
          ].map((route, i) => (
            <div key={route.to} className={i === 2 ? "sm:hidden lg:block" : ""}>
              <RouteCard {...route} />
            </div>
          ))}
        </div>

        {/* Carousel thêm tuyến */}
        <div className="mt-16">
          <RouteCarousel />
        </div>
      </section>

      {/* ===== TẠI SAO CHỌN BUSGO ===== */}
      <section className="py-12 lg:py-24 bg-surface-container-low">
        <div className="max-w-360 mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="relative">
            <div className="aspect-square bg-primary/5 rounded-[3rem] absolute -top-8 -left-8 w-full h-full -z-10" />
            <div className="rounded-[2.5rem] bg-surface-container-high h-125 w-full" />
          </div>
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-8">
              Tại sao chọn BusGo?
            </h2>
            <div className="space-y-8">
              {[
                {
                  icon: iconVerified,
                  title: "Đối tác uy tín",
                  desc: "Kết nối với hơn 500 nhà xe chất lượng cao trên toàn quốc.",
                },
                {
                  icon: iconPayments,
                  title: "Thanh toán an toàn",
                  desc: "Đa dạng phương thức thanh toán bảo mật tuyệt đối thông tin khách hàng.",
                },
                {
                  icon: iconSupport,
                  title: "Hỗ trợ 24/7",
                  desc: "Đội ngũ CSKH chuyên nghiệp luôn sẵn sàng giải quyết mọi vấn đề của bạn.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <img src={item.icon} alt="" className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                    <p className="text-secondary leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
