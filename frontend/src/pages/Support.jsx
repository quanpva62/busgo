import { useState } from "react";
import Icon from "../components/Icon.jsx";

const FAQ = [
  {
    q: "Làm sao để đặt vé trên BusGo?",
    a: "Chọn điểm đi, điểm đến, ngày khởi hành ở trang chủ → chọn chuyến phù hợp → chọn ghế → điền thông tin hành khách → thanh toán qua VNPay. Vé điện tử sẽ được gửi đến email của bạn.",
  },
  {
    q: "Tôi có thể thanh toán bằng cách nào?",
    a: "Hiện tại BusGo hỗ trợ thanh toán qua VNPay (thẻ ATM nội địa, Visa/MasterCard, QR code). Vé chỉ được xác nhận sau khi thanh toán thành công. Đơn đặt giữ chỗ tối đa 15 phút.",
  },
  {
    q: "Làm sao để hủy vé và được hoàn tiền?",
    a: "Vào Tài khoản → Lịch sử đặt vé → chọn vé cần hủy → nhấn 'Huỷ đặt vé'. Mức hoàn tiền: hơn 24h trước khởi hành = 100%, 12-24h = 50%, dưới 12h = 0%. Vé chưa thanh toán có thể hủy miễn phí.",
  },
  {
    q: "Tôi quên mã vé, làm sao xem lại?",
    a: "Vào Tài khoản → Lịch sử đặt vé → click vào vé đã thanh toán để xem lại mã vé và mã QR. Bạn cũng có thể tra cứu trong email xác nhận đã gửi.",
  },
  {
    q: "Tôi đến muộn, có được hoàn tiền không?",
    a: "Trường hợp khách đến muộn không lên xe được sẽ không được hoàn tiền. Vui lòng đến điểm đón trước giờ khởi hành ít nhất 15 phút.",
  },
  {
    q: "Tôi cần đổi chuyến đi thì làm thế nào?",
    a: "Hiện chưa hỗ trợ đổi chuyến trực tiếp. Bạn cần hủy vé cũ (theo chính sách hủy) và đặt vé mới cho chuyến muốn đổi.",
  },
  {
    q: "Có thể đặt vé mà không cần đăng ký không?",
    a: "Hiện tại bạn cần đăng ký tài khoản (hoặc đăng nhập bằng Google) để đặt vé, để có thể quản lý lịch sử và nhận thông báo về chuyến đi.",
  },
  {
    q: "Tôi gặp sự cố trên xe, báo cáo ở đâu?",
    a: "Vào Tài khoản → Lịch sử đặt vé → tìm chuyến đã hoàn thành → nhấn 'Báo cáo sự cố'. BusGo sẽ tiếp nhận và xử lý cùng nhà xe.",
  },
];

export default function Support() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <main className="min-h-screen pt-28 pb-16 bg-surface-container-low">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-primary font-semibold text-sm mb-2 block">
            Hỗ trợ khách hàng
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface mb-3">
            Chúng tôi có thể giúp gì?
          </h1>
          <p className="text-secondary">
            Liên hệ trực tiếp hoặc xem các câu hỏi thường gặp bên dưới.
          </p>
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <ContactCard
            icon="call"
            label="Hotline"
            value="1900 6067"
            href="tel:19006067"
            note="7:00 - 22:00 hàng ngày"
          />
          <ContactCard
            icon="mail"
            label="Email"
            value="support@busgo.vn"
            href="mailto:support@busgo.vn"
            note="Phản hồi trong vòng 24h"
          />
          <ContactCard
            icon="chat"
            label="Chat trực tuyến"
            value="BusGo Assistant"
            note="Click icon góc phải"
          />
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-bold text-on-surface mb-6">
            Câu hỏi thường gặp
          </h2>
          <div className="space-y-2">
            {FAQ.map((item, idx) => (
              <details
                key={idx}
                open={openIdx === idx}
                onToggle={(e) => {
                  if (e.target.open) setOpenIdx(idx);
                  else if (openIdx === idx) setOpenIdx(null);
                }}
                className="border-b border-outline-variant/20 last:border-b-0 pb-2"
              >
                <summary className="cursor-pointer py-3 font-bold text-on-surface flex items-center justify-between gap-3 list-none hover:text-primary transition-colors">
                  <span>{item.q}</span>
                  <Icon
                    name={openIdx === idx ? "expand_less" : "expand_more"}
                    className="w-5 h-5 text-secondary transition-transform group-open:rotate-180 shrink-0"
                  />
                </summary>
                <p className="text-secondary text-sm leading-relaxed pb-3 pr-8">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-secondary text-sm mt-8">
          Không tìm thấy câu trả lời? Liên hệ{" "}
          <a
            href="mailto:support@busgo.vn"
            className="text-primary font-semibold hover:opacity-70"
          >
            support@busgo.vn
          </a>{" "}
          để được hỗ trợ.
        </p>
      </div>
    </main>
  );
}

function ContactCard({ icon, label, value, href, note }) {
  const Wrapper = href ? "a" : "div";
  return (
    <Wrapper
      href={href}
      className="bg-white rounded-2xl shadow-sm p-5 text-center hover:shadow-md transition-shadow block"
    >
      <Icon name={icon} className="w-7 h-7 text-primary mx-auto" />
      <p className="text-xs font-medium text-secondary mt-2">
        {label}
      </p>
      <p className="font-bold text-on-surface mt-1">{value}</p>
      <p className="text-secondary text-xs mt-1">{note}</p>
    </Wrapper>
  );
}
