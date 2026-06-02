import { useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "busgo_cookie_consent";

export default function CookieConsent() {
  const [show, setShow] = useState(() => !localStorage.getItem(STORAGE_KEY));

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setShow(false);
  }
  function reject() {
    localStorage.setItem(STORAGE_KEY, "rejected");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-on-surface text-white shadow-2xl">
      <div className="max-w-360 mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="flex-1 text-sm leading-relaxed">
          🍪 BusGo dùng cookie và localStorage để duy trì đăng nhập, ghi nhớ tuỳ
          chọn của bạn.{" "}
          <Link
            to="/privacy"
            className="underline font-bold hover:text-blue-300"
          >
            Xem chính sách bảo mật
          </Link>
          .
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={reject}
            className="px-4 py-2 text-sm font-semibold text-white/80 hover:text-white border border-white/30 rounded-xl transition-colors"
          >
            Từ chối
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:opacity-90 transition-opacity"
          >
            Chấp nhận
          </button>
        </div>
      </div>
    </div>
  );
}
