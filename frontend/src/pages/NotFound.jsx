import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 pt-24">
      <div className="text-center max-w-md">
        <Icon
          name="directions_bus"
          className="w-24 h-24 text-primary/30 mx-auto mb-6"
        />
        <h1 className="text-6xl font-black text-on-surface mb-2">404</h1>
        <p className="text-xl font-bold text-on-surface mb-3">
          Chuyến xe này không tồn tại
        </p>
        <p className="text-secondary mb-8">
          Có vẻ bạn đã đi nhầm tuyến. Hãy quay về trang chủ để tìm chuyến phù
          hợp.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          Về trang chủ
        </Link>
      </div>
    </main>
  );
}
