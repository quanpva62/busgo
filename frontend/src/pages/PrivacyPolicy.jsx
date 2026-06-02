export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen pt-28 pb-16 bg-surface-container-low">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 space-y-6">
          <header>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface mb-2">
              Chính sách bảo mật
            </h1>
            <p className="text-secondary text-sm">
              Cập nhật lần cuối: 11/05/2026
            </p>
          </header>

          <Section title="1. Thông tin chúng tôi thu thập">
            <p>BusGo thu thập các thông tin sau khi bạn sử dụng dịch vụ:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Họ tên, email, số điện thoại khi đăng ký tài khoản</li>
              <li>Thông tin chuyến đi, lịch sử đặt vé</li>
              <li>
                Thông tin thanh toán (qua VNPay, không lưu trữ thông tin thẻ)
              </li>
              <li>Dữ liệu sử dụng (cookies, IP, loại trình duyệt)</li>
            </ul>
          </Section>

          <Section title="2. Mục đích sử dụng">
            <ul className="list-disc pl-6 space-y-1">
              <li>Xử lý đơn đặt vé và giao dịch thanh toán</li>
              <li>
                Liên hệ khi cần thiết về chuyến đi (thay đổi lịch, hủy
                chuyến...)
              </li>
              <li>Gửi email xác nhận, vé điện tử, thông báo khuyến mãi</li>
              <li>Cải thiện chất lượng dịch vụ và trải nghiệm người dùng</li>
            </ul>
          </Section>

          <Section title="3. Chia sẻ thông tin">
            <p>
              BusGo cam kết <strong>không bán</strong> thông tin cá nhân cho bên
              thứ ba. Thông tin chỉ được chia sẻ với:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Nhà xe (đối tác) để phục vụ chuyến đi của bạn</li>
              <li>Cổng thanh toán VNPay khi xử lý giao dịch</li>
              <li>Cơ quan pháp luật khi có yêu cầu hợp pháp</li>
            </ul>
          </Section>

          <Section title="4. Cookie & Dữ liệu trên trình duyệt">
            <p className="mb-3">
              Để mang lại trải nghiệm tốt nhất, chúng tôi chỉ lưu trữ những dữ
              liệu thực sự cần thiết trên thiết bị của bạn, bao gồm:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>
                <strong>Duy trì đăng nhập:</strong> Giúp bạn giữ trạng thái đăng
                nhập an toàn mà không cần nhập lại mật khẩu liên tục.
              </li>
              <li>
                <strong>Cá nhân hóa giao diện:</strong> Ghi nhớ tên và ảnh đại
                diện của bạn để trang web hiển thị nhanh và mượt mà hơn.
              </li>
              <li>
                <strong>Ghi nhớ cài đặt:</strong> Lưu lại các tùy chọn của bạn
                (như việc đồng ý với chính sách này) để không làm phiền bạn ở
                những lần truy cập sau.
              </li>
            </ul>
            <p className="text-green-600 font-medium">
              ✓ Cam kết: Chúng tôi hoàn toàn KHÔNG sử dụng cookie theo dõi
              (tracking) hay quảng cáo từ bên thứ ba.
            </p>
          </Section>

          <Section title="4. Bảo mật dữ liệu">
            <p>
              Chúng tôi sử dụng các biện pháp kỹ thuật như mã hóa SSL, băm mật
              khẩu (bcrypt), JWT token, và truy cập database qua kết nối an toàn
              để bảo vệ thông tin của bạn.
            </p>
          </Section>

          <Section title="5. Quyền của bạn">
            <ul className="list-disc pl-6 space-y-1">
              <li>Truy cập, chỉnh sửa thông tin cá nhân tại trang Tài khoản</li>
              <li>Yêu cầu xóa tài khoản bằng cách liên hệ hỗ trợ</li>
              <li>Từ chối nhận email khuyến mãi</li>
            </ul>
          </Section>

          <Section title="6. Liên hệ">
            <p>
              Mọi thắc mắc về chính sách bảo mật, vui lòng liên hệ:{" "}
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
