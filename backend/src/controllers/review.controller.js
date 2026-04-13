const prisma = require("../lib/prisma");

const createReview = async (req, res) => {
  try {
    const { bookingId, tripId, rating, comment } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking không tồn tại" });
    }
    if (booking.userId !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền đánh giá booking này" });
    }
    if (booking.tripId !== tripId) {
      return res
        .status(400)
        .json({ error: "Booking này không thuộc trip được đánh giá" });
    }
    if (booking.status !== "paid") {
      return res.status(400).json({
        error: "Chỉ có thể đánh giá cho booking đã hoàn thành",
      });
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      return res.status(404).json({ error: "Trip không tồn tại" });
    }
    if (trip.status !== "completed") {
      return res.status(400).json({
        error: "Chỉ có thể đánh giá cho trip đã hoàn thành",
      });
    }

    const review = await prisma.review.create({
      data: {
        bookingId,
        tripId,
        userId: req.user.userId,
        rating,
        comment,
      },
    });
    res.status(201).json({ message: "Đánh giá đã được tạo", review });
  } catch (error) {
    console.error("Error creating review:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Bạn đã đánh giá booking này rồi" });
    }
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

const getReviewsByTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { tripId, isVisible: true },
      include: { user: { select: { id: true, fullName: true } } },
    });

    res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await prisma.review.findUnique({
      where: { id },
    });
    if (!review) {
      return res.status(404).json({ error: "Review không tồn tại" });
    }
    if (review.userId !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền sửa review này" });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { rating, comment },
    });
    res.json({ message: "Review đã được cập nhật", review: updated });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
};

module.exports = {
  createReview,
  getReviewsByTrip,
  updateReview,
};
