import { useSearchParams, useNavigate } from "react-router-dom";

export default function PaymentResult() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get("status");
  const bookingId = params.get("bookingId");

  const isSuccess = status === "success";

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-container-low px-6">
      <div className="bg-white rounded-2xl shadow-sm p-10 max-w-md w-full text-center space-y-5">
        <span className={`material-symbols-outlined text-6xl ${isSuccess ? "text-green-500" : "text-red-500"}`}>
          {isSuccess ? "check_circle" : "cancel"}
        </span>

        <div>
          <h1 className="text-2xl font-black text-on-surface mb-2">
            {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}
          </h1>
          <p className="text-secondary text-sm">
            {isSuccess
              ? "Vé của bạn đã được xác nhận. Kiểm tra lịch sử đặt vé để xem chi tiết."
              : "Giao dịch không thành công. Vui lòng thử lại."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {isSuccess && bookingId && (
            <button
              onClick={() => navigate(`/booking/${bookingId}`)}
              className="w-full py-3 bg-linear-to-br from-primary-container to-primary text-white font-bold rounded-xl hover:opacity-95 transition-all hover:cursor-pointer"
            >
              Xem chi tiết đơn vé
            </button>
          )}
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 bg-white border border-outline-variant/30 text-on-surface font-bold rounded-xl hover:bg-surface-container-low transition-all hover:cursor-pointer"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </main>
  );
}
