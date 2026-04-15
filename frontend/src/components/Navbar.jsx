import { useAuth } from "../context/AuthContext.jsx";
import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="text-2xl font-black tracking-tighter text-blue-700">
          BusGo Vietnam
        </Link>

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

          {user && (
            <NavLink
              to="/bookings"
              className={({ isActive }) =>
                isActive
                  ? "text-blue-700 font-bold border-b-2 border-blue-700 pb-1"
                  : "text-slate-600 font-medium hover:text-blue-600 transition-colors"
              }
            >
              Lịch sử đặt vé
            </NavLink>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-slate-700 text-sm font-medium">{user.fullName}</span>
              <button
                onClick={logout}
                className="px-5 py-2 text-slate-600 font-semibold hover:bg-slate-50 transition-colors rounded-xl"
              >
                Đăng xuất
              </button>
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
      </div>
    </nav>
  );
}
