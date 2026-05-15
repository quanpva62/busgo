export default function TermsOfService() {
  return (
    <main className="min-h-screen pt-28 pb-16 bg-surface-container-low">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 space-y-6">
          <header>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface mb-2">
              Điều khoản dịch vụ
            </h1>
            <p className="text-secondary text-sm">
              Cập nhật lần cuối: 11/05/2026
            </p>
          </header>

          <Section title="1. Chấp nhận điều khoản">
            <p>
              Bằng việc sử dụng BusGo, bạn đồng ý tuân thủ các điều khoản dưới
              đây. Nếu không đồng ý, vui lòng không sử dụng dịch vụ.
            </p>
          </Section>

          <Section title="2. Dịch vụ">
            <p>
              BusGo là nền tảng kết nối giữa khách hàng và các nhà xe, hỗ trợ
              đặt vé, thanh toán và quản lý chuyến đi. BusGo{" "}
              <strong>không trực tiếp</strong> vận hành phương tiện vận tải.
            </p>
          </Section>

          <Section title="3. Tài khoản người dùng">
            <ul className="list-disc pl-6 space-y-1">
              <li>Bạn phải cung cấp thông tin chính xác khi đăng ký</li>
              <li>
                Tự bảo mật mật khẩu, không chia sẻ tài khoản cho người khác
              </li>
              <li>BusGo có quyền khóa tài khoản nếu phát hiện vi phạm</li>
            </ul>
          </Section>

          <Section title="4. Đặt vé và thanh toán">
            <ul className="list-disc pl-6 space-y-1">
              <li>Vé được giữ chỗ tối đa 15 phút sau khi đặt</li>
              <li>Thanh toán qua VNPay</li>
              <li>Vé điện tử được gửi qua email và hiển thị trong tài khoản</li>
            </ul>
          </Section>

          <Section title="5. Chính sách hủy vé và hoàn tiền">
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Hủy trước khởi hành <strong>hơn 24 giờ</strong>: hoàn 100% giá
                vé
              </li>
              <li>
                Hủy trước khởi hành <strong>12 – 24 giờ</strong>: hoàn 50% giá
                vé
              </li>
              <li>
                Hủy trước khởi hành <strong>dưới 12 giờ</strong>: không hoàn
                tiền
              </li>
              <li>Vé chưa thanh toán có thể hủy miễn phí</li>
            </ul>
          </Section>

          <Section title="6. Trách nhiệm">
            <ul className="list-disc pl-6 space-y-1">
              <li>BusGo chịu trách nhiệm về quy trình đặt vé và thanh toán</li>
              <li>Nhà xe chịu trách nhiệm trực tiếp về chất lượng chuyến đi</li>
              <li>
                Khiếu nại về chuyến đi có thể gửi qua chức năng "Báo cáo sự cố"
              </li>
            </ul>
          </Section>

          <Section title="7. Thay đổi điều khoản">
            <p>
              BusGo có quyền sửa đổi các điều khoản này. Bạn sẽ được thông báo
              về các thay đổi quan trọng qua email hoặc thông báo trên trang
              chủ.
            </p>
          </Section>

          <Section title="8. Liên hệ">
            <p>
              Mọi thắc mắc về điều khoản, vui lòng liên hệ:{" "}
              <a
                href="mailto:support@busgo.vn"
                className="text-primary font-semibold hover:opacity-70"
              >
                support@busgo.vn
              </a>
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-on-surface">{title}</h2>
      <div className="text-secondary text-sm leading-relaxed">{children}</div>
    </section>
  );
}
