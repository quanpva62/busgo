import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import iconBus from "../assets/icons/bus.svg";
import Icon from "../components/Icon.jsx";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Link xác thực không hợp lệ");
      return;
    }
    // Tránh StrictMode double-call trong dev — chỉ chạy 1 lần
    if (calledRef.current) return;
    calledRef.current = true;

    async function verify() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/verify-email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Xác thực thất bại");
        setStatus("success");
        setMessage(data.message);
      } catch (err) {
        setStatus("error");
        setMessage(err.message);
      }
    }
    verify();
  }, [token]);

  return (
    <main className="min-h-screen bg-white sm:bg-surface-container-low flex flex-col items-center justify-center px-6 py-12">
      <div className="bg-white sm:rounded-xl sm:border sm:border-outline-variant p-0 sm:p-10 w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <img src={iconBus} alt="" className="w-7 h-7 brightness-0 invert" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-primary">
            BusGo
          </span>
        </div>

        {status === "loading" && (
          <>
            <Icon name="progress_activity" className="w-16 h-16 text-primary animate-spin mx-auto" />
            <h1 className="text-2xl font-bold text-on-surface mt-4 mb-2">
              Đang xác thực...
            </h1>
            <p className="text-secondary text-sm">Vui lòng đợi trong giây lát.</p>
          </>
        )}

        {status === "success" && (
          <>
            <Icon name="check_circle" className="w-16 h-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-on-surface mt-4 mb-2">
              Xác thực thành công!
            </h1>
            <p className="text-secondary text-sm mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-container transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <Icon name="error" className="w-16 h-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-on-surface mt-4 mb-2">
              Xác thực thất bại
            </h1>
            <p className="text-secondary text-sm mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <Link
                to="/login"
                className="px-5 py-3 bg-white border border-outline-variant text-on-surface font-bold rounded-lg hover:bg-surface-container-low transition-colors"
              >
                Về đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-5 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-container transition-colors"
              >
                Đăng ký lại
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
