const prisma = require("../lib/prisma");
const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic();

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
];

const executeTool = async (toolName, input) => {
  switch (toolName) {
    case "searchTrips":
      return await prisma.trip.findMany({
        where: {
          route: {
            fromCity: { contains: input.from, mode: "insensitive" },
            toCity: { contains: input.to, mode: "insensitive" },
          },
          departureTime: {
            gte: new Date(input.date),
            lt: new Date(input.date + "T23:59:59"),
          },
          status: "scheduled",
        },
        include: { route: true, bus: true },
      });

    case "getTripDetail":
      return await prisma.trip.findUnique({
        where: { id: input.tripId },
        include: { route: true, bus: true, driver: true },
      });
    case "getAvailableSeats":
      return await prisma.tripSeat.count({
        where: { tripId: input.tripId, status: "available" },
      });
    default:
      throw new Error(`Tool not found: ${toolName}`);
  }
};

const chat = async (req, res) => {
  const { message, history = [] } = req.body;
  // history: [{ role: "user"|"assistant", content: string }, ...]
  const messages = [...history, { role: "user", content: message }];

  try {
    while (true) {
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: `Hôm nay là ${new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" })}.

            Bạn là trợ lý đặt vé BusGo.
                Chức năng:
                - Tìm chuyến xe phù hợp
                - Hiển thị thông tin: giờ đi, giá, nhà xe, ghế trống
                - Gợi ý lựa chọn tốt nhất nếu có nhiều chuyến
                - Hỗ trợ đặt vé

                Nguyên tắc:
                - Trả lời ngắn gọn, dễ hiểu
                - Luôn hỏi thêm nếu thiếu thông tin (điểm đi, điểm đến, ngày)
                - Ưu tiên đề xuất chuyến phù hợp nhất
                - Dùng ngôn ngữ theo người dùng (VI/EN)
                - Khi liệt kê chuyến xe, luôn thêm link đặt vé ở cuối mỗi chuyến theo đúng định dạng: [Chọn chuyến này →](/trips/TRIP_ID) (thay TRIP_ID bằng id thật của chuyến)
                - Khi khách hàng muốn đặt vé, hãy gửi theo định dạng: [Đặt vé ngay! →](/trips/TRIP_ID) (thay TRIP_ID bằng id thật của chuyến)
            `,
        tools,
        messages: messages,
      });

      if (response.stop_reason === "end_turn") {
        return res.json({ reply: response.content[0].text });
      }

      if (response.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: response.content });

        const toolResults = [];

        for (const block of response.content) {
          if (block.type === "tool_use") {
            const result = await executeTool(block.name, block.input);
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
    console.error("Error in chatbot:", error);
    return res.status(500).json({ error: "Lỗi chatbot" });
  }
};
module.exports = {
  chat,
};
