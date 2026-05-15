import { useState } from "react";
import { Link } from "react-router-dom";
import iconBus from "../assets/icons/bus.svg";
import iconUser from "../assets/icons/user.svg";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra");
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white sm:bg-surface-container-low flex flex-col items-center justify-center px-6 py-12">
      <div className="bg-white sm:rounded-3xl sm:shadow-lg p-0 sm:p-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0">
              <img src={iconBus} alt="" className="w-7 h-7 brightness-0 invert" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-primary">
              BusGo
            </span>
          </div>
          <h1 className="text-3xl font-bold text-on-surface mb-1">
            Quên mật khẩu?
          </h1>
          <p className="text-secondary text-sm text-center">
            Nhập email để nhận link đặt lại mật khẩu.
          </p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-sm font-medium">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase">
              Email
            </label>
            <div className="relative">
              <img
                src={iconUser}
                alt=""
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40"
              />
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-xl text-on-surface font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-linear-to-br from-primary-container to-primary text-white font-bold rounded-xl shadow-lg hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-60 hover:cursor-pointer mt-2"
          >
            {loading ? "Đang gửi..." : "Gửi link đặt lại"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-secondary">
          <Link to="/login" className="text-primary font-bold hover:opacity-70">
            ← Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
