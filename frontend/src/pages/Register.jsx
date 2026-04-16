import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import iconBus from "../assets/icons/bus.svg";
import iconUser from "../assets/icons/user.svg";
import iconPassword from "../assets/icons/password.svg";
import iconShow from "../assets/icons/show.svg";
import iconArrow from "../assets/icons/right-arrow.svg";

export default function Register() {
  const navigate = useNavigate();
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
      if (!res.ok) throw new Error(data.error || "Register failed");
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full pl-12 pr-4 py-4 bg-surface-container-low rounded-xl text-on-surface font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <main className="min-h-screen bg-white sm:bg-surface-container-low flex flex-col items-center justify-center px-6 py-12">
      {/* Logo ngoài card */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
          <img src={iconBus} alt="" className="w-6 h-6 brightness-0 invert" />
        </div>
        <span className="text-xl font-black tracking-tighter text-primary">BusGo</span>
      </div>
      <p className="text-secondary text-sm mb-8">Join our community of modern travelers</p>

      {/* Card */}
      <div className="bg-white sm:rounded-3xl sm:shadow-lg p-0 sm:p-10 w-full max-w-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-on-surface mb-1">Create an account</h1>
          <p className="text-secondary text-sm">Fill in your details to start booking</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase">
              Full Name
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
              <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase">
                Email Address
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
              <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase">
                Phone Number
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
              <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase">
                Password
              </label>
              <div className="relative">
                <img src={iconPassword} alt="" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-4 bg-surface-container-low rounded-xl text-on-surface font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2">
                  <img src={iconShow} alt="" className={`w-5 h-5 transition-opacity ${showPassword ? "opacity-70" : "opacity-40"}`} />
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold tracking-widest text-secondary uppercase">
                Confirm Password
              </label>
              <div className="relative">
                <img src={iconPassword} alt="" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-4 bg-surface-container-low rounded-xl text-on-surface font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
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
              I agree to the{" "}
              <a href="#" className="text-primary font-semibold hover:opacity-70">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="text-primary font-semibold hover:opacity-70">Privacy Policy</a>
              {" "}of BusGo Vietnam.
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-linear-to-br from-primary-container to-primary text-white font-bold rounded-xl shadow-lg hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 hover:cursor-pointer"
          >
            {loading ? "Creating account..." : (
              <>
                Create Account
                <img src={iconArrow} alt="" className="w-5 h-5 brightness-0 invert" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-outline-variant/30" />
          <span className="text-[10px] font-bold tracking-widest text-secondary uppercase">Or continue with</span>
          <div className="flex-1 h-px bg-outline-variant/30" />
        </div>

        {/* Social buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 py-3 border border-outline-variant/30 rounded-xl font-semibold text-on-surface text-sm hover:bg-surface-container-low transition-colors hover:cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button className="flex items-center justify-center gap-2 py-3 border border-outline-variant/30 rounded-xl font-semibold text-on-surface text-sm hover:bg-surface-container-low transition-colors hover:cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>
        </div>

        <p className="text-center mt-6 text-sm text-secondary">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-bold hover:opacity-70">
            Sign In to Your Account
          </Link>
        </p>
      </div>

      <p className="mt-8 text-[10px] font-bold tracking-widest text-secondary/40 uppercase text-center">
        © 2025 BusGo Vietnam Operations
      </p>
    </main>
  );
}
