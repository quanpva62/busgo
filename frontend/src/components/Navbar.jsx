import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Link, NavLink } from "react-router-dom";
import NotificationBell from "./NotificationBell.jsx";
import Icon from "./Icon.jsx";

export default function Navbar() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isStaffOrAdmin =
    user &&
    (user.role === "admin" ||
      user.role === "company_admin" ||
      user.role === "staff");

  const navLinkClass = ({ isActive }) =>
    isActive
      ? "text-blue-700 font-bold border-b-2 border-blue-700 pb-1"
      : "text-slate-600 font-medium hover:text-blue-600 transition-colors";

  const navLinks = (
    <>
      <NavLink to="/" className={navLinkClass}>
        Trang chủ
      </NavLink>
      <NavLink to="/search" className={navLinkClass}>
        Tìm chuyến
      </NavLink>
      <NavLink to="/routes" className={navLinkClass}>
        Tuyến đường
      </NavLink>
    </>
  );

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="max-w-360 mx-auto px-6 h-20 flex items-center justify-between">
        {/* Left: Logo + (admin/staff) links sát logo */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="text-2xl font-black tracking-tighter text-blue-700"
          >
            BusGo
          </Link>
          {isStaffOrAdmin && (
            <div className="hidden min-[890px]:flex items-center space-x-8">
              {navLinks}
            </div>
          )}
        </div>

        {/* Center: chỉ với user thường + khách — căn giữa tuyệt đối */}
        {!isStaffOrAdmin && (
          <div className="hidden md:flex items-center space-x-8 absolute left-1/2 -translate-x-1/2">
            {navLinks}
          </div>
        )}

        {/* Auth buttons — desktop */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              {(user.role === "admin" || user.role === "company_admin") && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5 rounded-xl transition-colors"
                >
                  <Icon name="admin_panel_settings" className="w-5 h-5" />
                  Quản lý
                </Link>
              )}
              {(user.role === "admin" ||
                user.role === "company_admin" ||
                user.role === "staff") && (
                <Link
                  to="/checkin"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5 rounded-xl transition-colors"
                >
                  <Icon name="qr_code_scanner" className="w-5 h-5" />
                  Check-in
                </Link>
              )}
              <NotificationBell />
              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 rounded-xl transition-colors"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-xs">
                    {user.fullName?.split(" ").slice(-1)[0]?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="hidden xl:inline text-slate-700 text-sm font-semibold">
                  {user.fullName}
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-5 py-2 text-slate-600 font-semibold hover:bg-slate-50 transition-colors rounded-xl"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-6 py-2 bg-linear-to-br from-blue-500 to-blue-700 text-white font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>

        {/* Mobile: Bell + Hamburger */}
        <div className="md:hidden flex items-center gap-2">
          {user && <NotificationBell />}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col gap-1.5 p-2"
          >
            <span
              className={`block w-6 h-0.5 bg-slate-700 transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`block w-6 h-0.5 bg-slate-700 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block w-6 h-0.5 bg-slate-700 transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 flex flex-col gap-4">
          <NavLink to="/" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "text-blue-700 font-bold" : "text-slate-600 font-medium"}>
            Trang chủ
          </NavLink>
          <NavLink to="/search" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "text-blue-700 font-bold" : "text-slate-600 font-medium"}>
            Tìm chuyến
          </NavLink>
          <NavLink to="/routes" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "text-blue-700 font-bold" : "text-slate-600 font-medium"}>
            Tuyến đường
          </NavLink>
          {(user?.role === "admin" || user?.role === "company_admin") && (
            <NavLink to="/admin" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "text-primary font-bold flex items-center gap-2" : "text-primary/80 font-semibold flex items-center gap-2"}>
              <Icon name="admin_panel_settings" className="w-5 h-5" />
              Quản lý
            </NavLink>
          )}
          {(user?.role === "admin" || user?.role === "company_admin" || user?.role === "staff") && (
            <NavLink to="/checkin" onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "text-primary font-bold flex items-center gap-2" : "text-primary/80 font-semibold flex items-center gap-2"}>
              <Icon name="qr_code_scanner" className="w-5 h-5" />
              Check-in
            </NavLink>
          )}
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            {user ? (
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="text-slate-600 font-semibold"
              >
                Tài khoản
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 text-center py-2 bg-blue-600 text-white font-bold rounded-xl"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
