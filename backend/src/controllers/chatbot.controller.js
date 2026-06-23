const prisma = require("../lib/prisma");
const aiClient = require("../lib/aiClient");

const tools = [
  {
    name: "searchTrips",
    description: "Tìm kiếm chuyến xe theo điểm đi, điểm đến và ngày",
    input_schema: {
      type: "object",
      properties: {
        from: { type: "string", description: "Thành phố khởi hành" },
        to: { type: "string", description: "Thành phố đến" },
        date: { type: "string", description: "Ngày đi (YYYY-MM-DD)" },
      },
      required: ["from", "to", "date"],
    },
  },
  {
    name: "getTripDetail",
    description: "Lấy thông tin chi tiết của 1 chuyến xe",
    input_schema: {
      type: "object",
      properties: {
        tripId: { type: "string", description: "ID của chuyến xe" },
      },
      required: ["tripId"],
    },
  },
  {
    name: "getAvailableSeats",
    description: "Xem số ghế còn trống của 1 chuyến xe",
    input_schema: {
      type: "object",
      properties: {
        tripId: { type: "string", description: "ID của chuyến xe" },
      },
      required: ["tripId"],
    },
  },
  {
    name: "getPopularRoutes",
    description: "Lấy danh sách các tuyến đường phổ biến nhất",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "checkPromoCode",
    description: "Kiểm tra mã khuyến mãi và trả về chi tiết nếu hợp lệ",
    input_schema: {
      type: "object",
      properties: {
        promoCode: { type: "string", description: "Mã khuyến mãi" },
      },
      required: ["promoCode"],
    },
  },
  {
    name: "getUserBookings",
    description:
      "Lấy danh sách booking của người dùng hiện tại (đã đăng nhập). KHÔNG nhận userId — tự lấy từ context.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

const executeTool = async (toolName, input, context = {}) => {
  switch (toolName) {
    case "searchTrips": {
      const normalize = (s) =>
        String(s || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "") // bỏ dấu tiếng Việt
          .replace(/[^a-z0-9]/g, ""); // bỏ space, chấm, etc

      const fromNorm = normalize(input.from);
      const toNorm = normalize(input.to);

      const routes = await prisma.route.findMany({ where: { isActive: true } });
      const matchedRoutes = routes.filter(
        (r) =>
          normalize(r.fromCity).includes(fromNorm) &&
          normalize(r.toCity).includes(toNorm),
      );
      if (matchedRoutes.length === 0) return [];

      return await prisma.trip.findMany({
        where: {
          routeId: { in: matchedRoutes.map((r) => r.id) },
          departureTime: {
            gte: new Date(input.date),
            lt: new Date(input.date + "T23:59:59"),
          },
          status: "scheduled",
        },
        include: { route: true, bus: true },
      });
    }

    case "getTripDetail":
      return await prisma.trip.findUnique({
        where: { id: input.tripId },
        include: { route: true, bus: true, driver: true },
      });
    case "getAvailableSeats":
      return await prisma.tripSeat.count({
        where: { tripId: input.tripId, status: "available" },
      });
    case "getPopularRoutes": {
      const result = await prisma.$queryRaw`
      SELECT r.id, r."fromCity", r."toCity", r."distanceKm", r."estimatedDuration", r."imageUrl",
             COUNT(b.id) as bookings,
             MIN(t.price) as "minPrice"
      FROM "Booking" b
      JOIN "Trip" t ON t.id = b."tripId"
      JOIN "Route" r ON r.id = t."routeId"
      WHERE b.status = 'paid'
      GROUP BY r.id, r."fromCity", r."toCity", r."distanceKm", r."estimatedDuration", r."imageUrl"
      ORDER BY bookings DESC
      LIMIT 3
    `;
      return result.map((r) => ({
        id: r.id,
        fromCity: r.fromCity,
        toCity: r.toCity,
        distanceKm: r.distanceKm,
        estimatedDuration: parseInt(r.estimatedDuration),
        imageUrl: r.imageUrl,
        bookings: parseInt(r.bookings),
        minPrice: parseInt(r.minPrice),
      }));
    }
    case "checkPromoCode": {
      const promo = await prisma.promotion.findUnique({
        where: { code: input.promoCode },
      });
      if (!promo) return { valid: false, reason: "Mã không tồn tại" };
      if (!promo.isActive) return { valid: false, reason: "Mã đã hết hạn" };
      if (promo.expiresAt < new Date())
        return { valid: false, reason: "Mã đã hết hạn" };
      if (promo.maxUses && promo.usedCount >= promo.maxUses)
        return { valid: false, reason: "Mã đã hết lượt sử dụng." };
      return {
        valid: true,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
      };
    }
    case "getUserBookings":
      if (!context.userId) return { error: "Cần đăng nhập để xem booking!" };
      return await prisma.booking.findMany({
        where: { userId: context.userId },
        include: { trip: { include: { route: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
    default:
      throw new Error(`Tool not found: ${toolName}`);
  }
};

function buildSystemPrompt() {
  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  return `Hôm nay là ${today}.

Bạn là trợ lý đặt vé BusGo.
Chức năng:
- Tìm chuyến xe phù hợp
- Hiển thị thông tin: giờ đi, giá, nhà xe, ghế trống
- Gợi ý lựa chọn tốt nhất nếu có nhiều chuyến
- Hỗ trợ đặt vé

Chính sách hủy vé:
- Hủy trước khởi hành hơn 24 giờ: hoàn 100%
- Hủy trước khởi hành 12-24 giờ: hoàn 50%
- Hủy trước khởi hành dưới 12 giờ: không hoàn tiền
- Vé chưa thanh toán hủy miễn phí

Tên thành phố CHÍNH XÁC trong DB (dùng đúng khi gọi tool searchTrips):
TP.HCM (KHÔNG phải TPHCM, TP HCM, Sài Gòn), Hà Nội, Đà Nẵng, Đà Lạt, Vũng Tàu, Cần Thơ, Huế, Hải Phòng, Nha Trang, Vinh, Quy Nhơn

Nguyên tắc:
- Trả lời ngắn gọn, dễ hiểu
- Luôn hỏi thêm nếu thiếu thông tin (điểm đi, điểm đến, ngày)
- Ưu tiên đề xuất chuyến phù hợp nhất
- Dùng ngôn ngữ theo người dùng (VI/EN)
- KHÔNG hiển thị layout (cấu trúc xếp ghế) — không hữu ích với khách
- Đổi tên tiện ích sang tiếng Việt dễ hiểu khi liệt kê:
  + wifi → Wifi
  + airConditioner → Điều hòa
  + usb → Sạc điện thoại
  + blanket → Chăn
  + water → Nước uống
- Khi liệt kê chuyến xe, luôn thêm link đặt vé ở cuối mỗi chuyến theo đúng định dạng: [Chọn chuyến này →](/trips/TRIP_ID)
- Khi khách hàng muốn đặt vé: [Đặt vé ngay! →](/trips/TRIP_ID)
`;
}

const chat = async (req, res, next) => {
  const { message, history = [] } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Thiếu message" });
  }
  const cleanHistory = history.filter(
    (m) => m && typeof m.content === "string" && m.content.trim().length > 0,
  );
  const messages = [...cleanHistory, { role: "user", content: message }];
  const context = { userId: req.user?.userId };

  try {
    while (true) {
      const response = await aiClient.chat({
        system: buildSystemPrompt(),
        tools,
        messages,
      });

      if (response.stop_reason === "end_turn") {
        return res.json({ reply: response.content[0].text });
      }
      if (response.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: response.content });
        const toolResults = [];
        for (const block of response.content) {
          if (block.type === "tool_use") {
            const result = await executeTool(block.name, block.input, context);
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
          }
        }
        messages.push({ role: "user", content: toolResults });
      }
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chat,
};
