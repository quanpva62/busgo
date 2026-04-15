import heroImg from "../assets/img/hero-img.png";
import { useState } from "react";

export default function Home() {
  const [openFrom, setOpenFrom] = useState(false);
  const [selectedFrom, setSelectedFrom] = useState("TP. Hồ Chí Minh");
  const [openTo, setOpenTo] = useState(false);
  const [selectedTo, setSelectedTo] = useState("Đà Lạt");

  return (
    <main>
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-150 flex items-center justify-center px-6 mt-20">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImg}
            alt="hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-r from-on-surface/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl w-full">
          <div className="max-w-2xl mb-12">
            <h1 className="text-white text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              Hành trình <br />
              <span className="text-primary-fixed">Thông minh</span>
            </h1>
            <p className="text-white/90 text-xl font-medium max-w-lg">
              Trải nghiệm dịch vụ đặt vé xe khách hiện đại hàng đầu Việt Nam.
              Nhanh chóng, tin cậy và tận tâm.
            </p>
          </div>

          {/* Form tìm kiếm */}
          <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-outline-variant/20">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Điểm đi */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase px-1">
                  Điểm đi
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary z-10">
                    location_on
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenFrom(!openFrom)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-xl text-left font-semibold text-on-surface flex items-center justify-between"
                  >
                    {selectedFrom}
                    <span className="material-symbols-outlined text-secondary">
                      expand_more
                    </span>
                  </button>
                  {openFrom && (
                    <ul className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-outline-variant/30 z-50 overflow-hidden">
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
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary z-10">
                    flag
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenTo(!openTo)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-xl text-left font-semibold text-on-surface flex items-center justify-between"
                  >
                    {selectedTo}
                    <span className="material-symbols-outlined text-secondary">
                      expand_more
                    </span>
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
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                    calendar_month
                  </span>
                  <input
                    type="date"
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-fixed font-semibold text-on-surface"
                  />
                </div>
              </div>

              {/* Button tìm */}
              <div className="flex items-end">
                <button className="w-full py-4 bg-linear-to-br from-primary-container to-primary text-white font-bold rounded-xl shadow-lg hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">search</span>
                  Tìm vé
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TUYẾN PHỔ BIẾN ===== */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-primary font-bold tracking-widest text-xs uppercase mb-3 block">
              KHÁM PHÁ VIỆT NAM
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight">
              Tuyến đường phổ biến
            </h2>
          </div>
          <button className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all">
            Xem tất cả{" "}
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
          ].map((route) => (
            <div
              key={route.to}
              className="group bg-surface-container-lowest rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-500 border border-transparent hover:border-outline-variant/20"
            >
              <div className="relative h-64 overflow-hidden bg-surface-container-high">
                {route.badge && (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-primary uppercase z-10">
                    {route.badge}
                  </div>
                )}
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-on-surface mb-1">
                  {route.from} → {route.to}
                </h3>
                <p className="text-secondary text-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    schedule
                  </span>
                  {route.hours} giờ di chuyển
                </p>
                <div className="flex items-center justify-between mt-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-secondary tracking-widest uppercase">
                      CHỈ TỪ
                    </span>
                    <span className="text-2xl font-black text-primary">
                      {route.price}
                    </span>
                  </div>
                  <button className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <span className="material-symbols-outlined">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TẠI SAO CHỌN BUSGO ===== */}
      <section className="py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="aspect-square bg-primary/5 rounded-[3rem] absolute -top-8 -left-8 w-full h-full -z-10" />
            <div className="rounded-[2.5rem] bg-surface-container-high h-125 w-full" />
          </div>
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-8">
              Tại sao chọn <br />
              BusGo Vietnam?
            </h2>
            <div className="space-y-8">
              {[
                {
                  icon: "verified",
                  title: "Đối tác uy tín",
                  desc: "Kết nối với hơn 500 nhà xe chất lượng cao trên toàn quốc.",
                },
                {
                  icon: "payments",
                  title: "Thanh toán an toàn",
                  desc: "Đa dạng phương thức thanh toán bảo mật tuyệt đối thông tin khách hàng.",
                },
                {
                  icon: "support_agent",
                  title: "Hỗ trợ 24/7",
                  desc: "Đội ngũ CSKH chuyên nghiệp luôn sẵn sàng giải quyết mọi vấn đề của bạn.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-3xl">
                      {item.icon}
                    </span>
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
