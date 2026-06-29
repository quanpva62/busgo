import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import iconBus from "../assets/icons/bus.svg";
import iconUser from "../assets/icons/user.svg";
import iconPassword from "../assets/icons/password.svg";
import iconShow from "../assets/icons/show.svg";
import iconArrow from "../assets/icons/right-arrow.svg";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, email, password, phone }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Đăng ký thất bại");
      toast.success(
        data.message || "Đăng ký thành công! Vui lòng kiểm tra email để xác thực.",
        6000,
      );
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async (credentialResponse) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/google`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: credentialResponse.credential }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Đăng ký Google thất bại");
      login(data.user, data.accessToken, data.refreshToken);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-lg text-on-surface font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <main className="min-h-screen bg-white sm:bg-surface-container-low flex flex-col items-center justify-center px-6 py-12">
      {/* Logo ngoài card */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
          <img src={iconBus} alt="" className="w-6 h-6 brightness-0 invert" />
        </div>
        <span className="text-xl font-extrabold tracking-tight text-primary">BusGo</span>
      </div>
      <p className="text-secondary text-sm mb-8">Tạo tài khoản để đặt vé và quản lý chuyến đi</p>

      {/* Card */}
      <div className="bg-white sm:rounded-lg sm:border sm:border-outline-variant p-0 sm:p-10 w-full max-w-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-on-surface mb-1">Tạo tài khoản</h1>
          <p className="text-secondary text-sm">Điền thông tin để bắt đầu đặt vé</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Họ và tên */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-secondary">
              Họ và tên
            </label>
            <div className="relative">
              <img src={iconUser} alt="" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-secondary">
                Địa chỉ Email
              </label>
              <div className="relative">
                <img src={iconUser} alt="" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-secondary">
                Số điện thoại
              </label>
              <div className="relative">
                <img src={iconUser} alt="" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                <input
                  type="tel"
                  placeholder="+84 000 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Password + Confirm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-secondary">
                Mật khẩu
              </label>
              <div className="relative">
                <img src={iconPassword} alt="" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-4 bg-surface-container-low rounded-lg text-on-surface font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2">
                  <img src={iconShow} alt="" className={`w-5 h-5 transition-opacity ${showPassword ? "opacity-70" : "opacity-40"}`} />
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-secondary">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <img src={iconPassword} alt="" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-4 bg-surface-container-low rounded-lg text-on-surface font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2">
                  <img src={iconShow} alt="" className={`w-5 h-5 transition-opacity ${showConfirm ? "opacity-70" : "opacity-40"}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
              className="mt-1 accent-primary w-4 h-4 shrink-0"
            />
            <span className="text-sm text-secondary leading-relaxed">
              Tôi đồng ý với{" "}
              <Link to="/terms" className="text-primary font-semibold hover:opacity-70">Điều khoản dịch vụ</Link>
              {" "}và{" "}
              <Link to="/privacy" className="text-primary font-semibold hover:opacity-70">Chính sách bảo mật</Link>
              {" "}của BusGo Việt Nam.
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-white font-bold rounded-lg hover:bg-primary-container transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Đang tạo tài khoản..." : (
              <>
                Tạo tài khoản
                <img src={iconArrow} alt="" className="w-5 h-5 brightness-0 invert" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-outline-variant/30" />
          <span className="text-xs font-semibold text-secondary">Hoặc đăng ký bằng</span>
          <div className="flex-1 h-px bg-outline-variant/30" />
        </div>

        {/* Google sign-in */}
        <div className="flex justify-center overflow-hidden rounded-lg">
          <GoogleLogin
            onSuccess={handleGoogleSubmit}
            onError={() => setError("Đăng ký Google thất bại")}
            size="large"
            shape="rectangular"
            text="signup_with"
            width="350"
            locale="en"
          />
        </div>

        <p className="text-center mt-6 text-sm text-secondary">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-primary font-bold hover:opacity-70">
            Đăng nhập ngay
          </Link>
        </p>
      </div>

      <p className="mt-8 text-xs text-secondary/60 text-center">
        © 2026 BusGo
      </p>
    </main>
  );
}
