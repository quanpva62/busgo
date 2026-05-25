const prisma = require("../lib/prisma");
const ExcelJS = require("exceljs");

const ROLE_LABEL = {
  user: "Khách hàng",
  admin: "Quản trị viên",
  company_admin: "Quản lý nhà xe",
};

const STATUS_LABEL = {
  pending: "Chờ xử lý",
  paid: "Đã thanh toán",
  cancelled: "Đã huỷ",
  refunded: "Đã hoàn tiền",
  resolved: "Đã xử lý",
  dismissed: "Bỏ qua",
};

const CATEGORY_LABEL = {
  dangerous_driving: "Lái xe nguy hiểm",
  phone_while_driving: "Dùng điện thoại khi lái",
  wrong_vehicle: "Sai phương tiện",
  dirty_vehicle: "Xe bẩn",
  wrong_stop: "Đón/trả sai điểm",
  late_departure: "Khởi hành trễ",
  overcharge: "Thu thêm tiền",
  other: "Khác",
};

const sendXlsx = async (wb, res, filename) => {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}-${Date.now()}.xlsx"`,
  );
  await wb.xlsx.write(res);
  res.end();
};

const styleHeader = (ws) => {
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E40AF" },
  };
};

const exportUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Người dùng");
    ws.columns = [
      { header: "ID", key: "id", width: 38 },
      { header: "Họ tên", key: "fullName", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Điện thoại", key: "phone", width: 15 },
      { header: "Vai trò", key: "role", width: 18 },
      { header: "Trạng thái", key: "status", width: 14 },
      { header: "Xác minh email", key: "verified", width: 16 },
      { header: "Ngày tạo", key: "createdAt", width: 20 },
    ];
    users.forEach((u) =>
      ws.addRow({
        id: u.id,
        fullName: u.fullName ?? "",
        email: u.email,
        phone: u.phone ?? "",
        role: ROLE_LABEL[u.role] ?? u.role,
        status: u.isActive ? "Hoạt động" : "Vô hiệu",
        verified: u.emailVerified ? "Có" : "Không",
        createdAt: u.createdAt.toLocaleString("vi-VN"),
      }),
    );
    styleHeader(ws);
    await sendXlsx(wb, res, "users");
  } catch (error) {
    next(error);
  }
};

const exportBookings = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    if (!user) return res.status(404).json({ error: "Không tìm thấy người dùng" });

    const where =
      user.role === "admin" ? {} : { trip: { bus: { companyId: user.companyId } } };

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        trip: { include: { route: true, bus: true } },
        user: { select: { fullName: true, email: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Bookings");
    ws.columns = [
      { header: "Mã booking", key: "id", width: 38 },
      { header: "Khách", key: "customer", width: 25 },
      { header: "Email", key: "email", width: 28 },
      { header: "SĐT", key: "phone", width: 14 },
      { header: "Tuyến", key: "route", width: 30 },
      { header: "Khởi hành", key: "departureTime", width: 20 },
      { header: "Biển số xe", key: "bus", width: 14 },
      { header: "Giảm giá", key: "discount", width: 12 },
      { header: "Tổng tiền", key: "totalPrice", width: 14 },
      { header: "Trạng thái", key: "status", width: 16 },
      { header: "Thanh toán", key: "paidAt", width: 20 },
      { header: "Ngày tạo", key: "createdAt", width: 20 },
    ];
    bookings.forEach((b) =>
      ws.addRow({
        id: b.id,
        customer: b.passengerName,
        email: b.passengerEmail ?? b.user?.email ?? "",
        phone: b.passengerPhone,
        route: `${b.trip.route.fromCity} → ${b.trip.route.toCity}`,
        departureTime: b.trip.departureTime.toLocaleString("vi-VN"),
        bus: b.trip.bus?.licensePlate ?? "",
        discount: b.discountAmount,
        totalPrice: b.totalPrice,
        status: STATUS_LABEL[b.status] ?? b.status,
        paidAt: b.payment?.paidAt
          ? b.payment.paidAt.toLocaleString("vi-VN")
          : "",
        createdAt: b.createdAt.toLocaleString("vi-VN"),
      }),
    );
    ws.getColumn("discount").numFmt = "#,##0";
    ws.getColumn("totalPrice").numFmt = "#,##0";
    styleHeader(ws);
    await sendXlsx(wb, res, "bookings");
  } catch (error) {
    next(error);
  }
};

const exportReports = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    if (!user) return res.status(404).json({ error: "Không tìm thấy người dùng" });

    const where =
      user.role === "admin"
        ? {}
        : { driver: { companyId: user.companyId } };

    const reports = await prisma.report.findMany({
      where,
      include: {
        user: { select: { fullName: true, email: true } },
        driver: { select: { fullName: true } },
        booking: { include: { trip: { include: { route: true } } } },
        resolveBy: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Khiếu nại");
    ws.columns = [
      { header: "ID", key: "id", width: 38 },
      { header: "Người báo cáo", key: "reporter", width: 25 },
      { header: "Tài xế", key: "driver", width: 22 },
      { header: "Tuyến", key: "route", width: 30 },
      { header: "Loại", key: "category", width: 22 },
      { header: "Mức độ", key: "severity", width: 12 },
      { header: "Chi tiết", key: "details", width: 50 },
      { header: "Trạng thái", key: "status", width: 14 },
      { header: "Ghi chú admin", key: "adminNote", width: 40 },
      { header: "Người xử lý", key: "resolver", width: 22 },
      { header: "Ngày xử lý", key: "resolvedAt", width: 20 },
      { header: "Ngày báo cáo", key: "createdAt", width: 20 },
    ];
    reports.forEach((r) =>
      ws.addRow({
        id: r.id,
        reporter: r.user?.fullName ?? "",
        driver: r.driver?.fullName ?? "",
        route: r.booking?.trip?.route
          ? `${r.booking.trip.route.fromCity} → ${r.booking.trip.route.toCity}`
          : "",
        category: CATEGORY_LABEL[r.category] ?? r.category,
        severity: r.severity,
        details: r.details,
        status: STATUS_LABEL[r.status] ?? r.status,
        adminNote: r.adminNote ?? "",
        resolver: r.resolveBy?.fullName ?? "",
        resolvedAt: r.resolvedAt
          ? r.resolvedAt.toLocaleString("vi-VN")
          : "",
        createdAt: r.createdAt.toLocaleString("vi-VN"),
      }),
    );
    styleHeader(ws);
    await sendXlsx(wb, res, "reports");
  } catch (error) {
    next(error);
  }
};

module.exports = { exportUsers, exportBookings, exportReports };
