import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="max-w-360 mx-auto px-6 h-20 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="text-2xl font-black tracking-tighter text-blue-700">
          BusGo
        </Link>

        {/* Links — desktop */}
        <div className="hidden md:flex items-center space-x-8">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "text-blue-700 font-bold border-b-2 border-blue-700 pb-1"
                : "text-slate-600 font-medium hover:text-blue-600 transition-colors"
            }
          >
            Trang chủ
          </NavLink>
        </div>

        {/* Auth buttons — desktop */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-xs">
                  {user.fullName?.split(" ").slice(-1)[0]?.[0]?.toUpperCase()}
                </div>
                <span className="text-slate-700 text-sm font-semibold">{user.fullName}</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="px-5 py-2 text-slate-600 font-semibold hover:bg-slate-50 transition-colors rounded-xl">
                Đăng nhập
              </Link>
              <Link to="/register" className="px-6 py-2 bg-linear-to-br from-blue-500 to-blue-700 text-white font-bold rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all">
                Đăng ký
              </Link>
            </>
          )}
        </div>

        {/* Hamburger — mobile */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
        >
          <span className={`block w-6 h-0.5 bg-slate-700 transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-6 h-0.5 bg-slate-700 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-slate-700 transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 flex flex-col gap-4">
          <NavLink
            to="/"
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              isActive ? "text-blue-700 font-bold" : "text-slate-600 font-medium"
            }
          >
            Trang chủ
          </NavLink>
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
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold">
                  Đăng nhập
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2 bg-blue-600 text-white font-bold rounded-xl">
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
