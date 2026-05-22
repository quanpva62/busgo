const prisma = require("../lib/prisma");

const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: true,
        review: true,
      },
    });
    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy booking" });
    }
    if (booking.userId !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền đánh giá booking này" });
    }
    if (booking.status !== "paid") {
      return res
        .status(400)
        .json({ error: "Chỉ có thể đánh giá vé đã thanh toán" });
    }
    if (booking.trip.status !== "completed") {
      return res
        .status(400)
        .json({ error: "Chỉ có thể đánh giá chuyến đã hoàn thành" });
    }

    if (booking.review) {
      return res.status(400).json({ error: "Bạn đã đánh giá booking này rồi" });
    }
    let seriesId = booking.trip.seriesId;
    if (!seriesId) {
      seriesId = booking.trip.id;
      await prisma.trip.update({
        where: { id: booking.trip.id },
        data: { seriesId },
      });
    }

    const review = await prisma.review.create({
      data: {
        userId: req.user.userId,
        bookingId,
        seriesId,
        rating,
        comment,
      },
    });
    res.status(201).json({ message: "Đánh giá thành công", review });
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) {
      return res.status(404).json({ error: "Không tìm thấy đánh giá" });
    }
    if (review.userId === req.user.userId) {
      const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: { rating, comment },
      });
      res.json({
        message: "Cập nhật đánh giá thành công",
        review: updatedReview,
      });
    } else {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền sửa đánh giá này" });
    }
  } catch (error) {
    next(error);
  }
};

const getTripReviews = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { seriesId: true },
    });
    if (!trip || !trip.seriesId) {
      return res.json({ avgRating: 0, count: 0, reviews: [] });
    }
    const seriesId = trip.seriesId;

    const [count, reviews, agg] = await Promise.all([
      prisma.review.count({ where: { seriesId, isVisible: true } }),
      prisma.review.findMany({
        where: { seriesId, isVisible: true },
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.review.aggregate({
        where: { seriesId, isVisible: true },
        _avg: { rating: true },
      }),
    ]);
    res.json({ avgRating: agg._avg.rating ?? 0, count, reviews });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  updateReview,
  getTripReviews,
};
