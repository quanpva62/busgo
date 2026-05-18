import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import iconBus from "../assets/icons/bus.svg";
import iconPassword from "../assets/icons/password.svg";
import iconShow from "../assets/icons/show.svg";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Đặt lại mật khẩu thất bại");
      toast.success(data.message);
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <span className="material-symbols-outlined text-red-500 text-6xl">error</span>
          <h2 className="text-xl font-bold mt-4">Link không hợp lệ</h2>
          <p className="text-secondary mt-2 mb-6">Vui lòng request link mới từ trang quên mật khẩu.</p>
          <Link
            to="/forgot-password"
            className="inline-block px-6 py-3 bg-primary text-white font-bold rounded-xl"
          >
            Quên mật khẩu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white sm:bg-surface-container-low flex flex-col items-center justify-center px-6 py-12">
      <div className="bg-white sm:rounded-3xl sm:shadow-lg p-0 sm:p-10 w-full max-w-md">
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
            Đặt mật khẩu mới
          </h1>
          <p className="text-secondary text-sm text-center">
            Mật khẩu phải có ít nhất 8 ký tự.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField
            label="Mật khẩu mới"
            value={newPassword}
            onChange={setNewPassword}
            show={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
          />
          <PasswordField
            label="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-linear-to-br from-primary-container to-primary text-white font-bold rounded-xl shadow-lg hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-60 hover:cursor-pointer mt-2"
          >
            {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
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

function PasswordField({ label, value, onChange, show, onToggle }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase">
        {label}
      </label>
      <div className="relative">
        <img
          src={iconPassword}
          alt=""
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40"
        />
        <input
          type={show ? "text" : "password"}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={8}
          className="w-full pl-12 pr-12 py-4 bg-surface-container-low rounded-xl text-on-surface font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
        >
          <img
            src={iconShow}
            alt=""
            className={`w-5 h-5 transition-opacity ${show ? "opacity-70" : "opacity-40"}`}
          />
        </button>
      </div>
    </div>
  );
}
