import { Link } from "react-router-dom";

const links = {
  "Công ty": ["Về chúng tôi", "Tuyển dụng", "Tin tức"],
  "Hỗ trợ": ["Điều khoản sử dụng", "Chính sách bảo mật", "Liên hệ"],
  "Dịch vụ": [
    { label: "Đặt vé xe", to: "/search" },
    { label: "Tra cứu vé", to: "/bookings" },
    { label: "Khuyến mãi", to: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-on-surface text-white">
      {/* Main footer */}
      <div className="max-w-360 mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="md:col-span-1">
          <Link
            to="/"
            className="text-2xl font-black tracking-tighter text-white"
          >
            BusGo
          </Link>
          <p className="mt-4 text-white/50 text-sm leading-relaxed">
            Nền tảng đặt vé xe khách trực tuyến hàng đầu Việt Nam. Nhanh chóng,
            tin cậy và tận tâm.
          </p>
          {/* Stats nhỏ */}
          <div className="mt-6 flex gap-6">
            <div>
              <div className="text-xl font-black text-white">500+</div>
              <div className="text-white/40 text-xs mt-0.5">Nhà xe</div>
            </div>
            <div>
              <div className="text-xl font-black text-white">50+</div>
              <div className="text-white/40 text-xs mt-0.5">Tỉnh thành</div>
            </div>
            <div>
              <div className="text-xl font-black text-white">1M+</div>
              <div className="text-white/40 text-xs mt-0.5">Khách hàng</div>
            </div>
          </div>
        </div>

        {/* Links */}
        {Object.entries(links).map(([group, items]) => (
          <div key={group}>
            <h4 className="text-sm font-bold tracking-widest uppercase text-white/40 mb-4">
              {group}
            </h4>
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.label || item}>
                  <Link
                    to={item.to}
                    className="text-white/70 text-sm hover:text-white transition-colors"
                  >
                    {item.label || item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-360 mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-white/30 text-sm">
            © 2024 BusGo. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-white/30 text-sm hover:text-white/60 transition-colors"
            >
              Điều khoản
            </a>
            <a
              href="#"
              className="text-white/30 text-sm hover:text-white/60 transition-colors"
            >
              Bảo mật
            </a>
            <a
              href="#"
              className="text-white/30 text-sm hover:text-white/60 transition-colors"
            >
              Cookie
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
