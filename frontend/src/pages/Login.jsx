import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Link, useNavigate } from "react-router-dom";
import iconBus from "../assets/icons/bus.svg";
import iconUser from "../assets/icons/user.svg";
import iconPassword from "../assets/icons/password.svg";
import iconShow from "../assets/icons/show.svg";
import iconArrow from "../assets/icons/right-arrow.svg";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  // login và navigate sẽ dùng khi wire API
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needVerification, setNeedVerification] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNeedVerification(false);
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        if (data.needVerification) setNeedVerification(true);
        throw new Error(data.error || "Đăng nhập thất bại");
      }
      login(data.user, data.accessToken, data.refreshToken); // Lưu token vào context
      navigate("/"); // Điều hướng về trang chủ sau khi login thành công
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/resend-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không gửi được");
      toast.success(data.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResending(false);
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
      if (!res.ok) throw new Error(data.error || "Đăng nhập Google thất bại");
      login(data.user, data.accessToken, data.refreshToken);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white sm:bg-surface-container-low flex flex-col items-center justify-center px-6 py-12">
      {/* Card */}
      <div className="bg-white sm:rounded-3xl sm:shadow-lg p-0 sm:p-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0">
              <img
                src={iconBus}
                alt=""
                className="w-7 h-7 brightness-0 invert"
              />
            </div>
            <span className="text-2xl font-black tracking-tighter text-primary">
              BusGo
            </span>
          </div>
          <h1 className="text-3xl font-bold text-on-surface mb-1">
            Chào mừng trở lại
          </h1>
          <p className="text-secondary text-sm">
            Mạng lưới di chuyển hàng đầu Việt Nam
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
            {error}
            {needVerification && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="block mt-2 text-primary font-bold underline hover:opacity-70 disabled:opacity-50 cursor-pointer"
              >
                {resending ? "Đang gửi..." : "Gửi lại email xác thực"}
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase">
              Email hoặc số điện thoại
            </label>
            <div className="relative">
              <img
                src={iconUser}
                alt=""
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40"
              />
              <input
                type="text"
                placeholder="name@busgo.com hoặc 0901234567"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-xl text-on-surface font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase">
                Mật khẩu
              </label>
              <Link
                to="/forgot-password"
                className="text-[10px] font-bold tracking-widest text-primary uppercase hover:opacity-70"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <img
                src={iconPassword}
                alt=""
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40"
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-12 py-4 bg-surface-container-low rounded-xl text-on-surface font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/50 hover:text-secondary transition-colors"
              >
                <img
                  src={iconShow}
                  alt=""
                  className={`w-5 h-5 transition-opacity ${showPassword ? "opacity-70" : "opacity-40"}`}
                />
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-linear-to-br from-primary-container to-primary text-white font-bold rounded-xl shadow-lg hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 hover:cursor-pointer mt-2"
          >
            {loading ? (
              "Đang đăng nhập..."
            ) : (
              <>
                Đăng nhập
                <img
                  src={iconArrow}
                  alt=""
                  className="w-5 h-5 brightness-0 invert"
                />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-outline-variant/30" />
          <span className="text-[10px] font-bold tracking-widest text-secondary uppercase">
            Hoặc đăng nhập bằng
          </span>
          <div className="flex-1 h-px bg-outline-variant/30" />
        </div>

        {/* Google sign-in */}
        <div className="flex justify-center overflow-hidden rounded-2xl">
          <GoogleLogin
            onSuccess={handleGoogleSubmit}
            onError={() => setError("Đăng nhập Google thất bại")}
            size="large"
            shape="rectangular"
            text="signin_with"
            width="150"
            locale="en"
          />
        </div>

        {/* Register link */}
        <p className="text-center mt-6 text-sm text-secondary">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="text-primary font-bold hover:opacity-70"
          >
            Đăng ký
          </Link>
        </p>
      </div>

      {/* Bottom links */}
      <div className="flex items-center gap-6 mt-8">
        <Link
          to="/privacy"
          className="text-[10px] font-bold tracking-widest text-secondary/60 uppercase hover:text-secondary transition-colors"
        >
          Chính sách bảo mật
        </Link>
        <Link
          to="/terms"
          className="text-[10px] font-bold tracking-widest text-secondary/60 uppercase hover:text-secondary transition-colors"
        >
          Điều khoản dịch vụ
        </Link>
        <Link
          to="/support"
          className="text-[10px] font-bold tracking-widest text-secondary/60 uppercase hover:text-secondary transition-colors"
        >
          Hỗ trợ
        </Link>
      </div>
      <p className="mt-3 text-[10px] font-bold tracking-widest text-secondary/40 uppercase text-center">
        © 2026 BusGo • Đặt vé xe khách hàng đầu Việt Nam
      </p>
    </main>
  );
}
