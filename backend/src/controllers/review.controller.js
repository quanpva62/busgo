const prisma = require("../lib/prisma");

const createReview = async (req, res) => {
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
      return res.status(404).json({ error: "Booking not found!" });
    }
    if (booking.userId !== req.user.userId) {
      return res.status(403).json({ error: "You can't review this booking!" });
    }
    if (booking.status !== "paid") {
      return res
        .status(400)
        .json({ error: "You can only review paid bookings!" });
    }
    if (booking.trip.status !== "completed") {
      return res
        .status(400)
        .json({ error: "You can only review completed trips!" });
    }

    if (booking.review) {
      return res
        .status(400)
        .json({ error: "You have already reviewed this booking!" });
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
    res.status(201).json({ message: "Review created successfully", review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) {
      return res.status(404).json({ error: "Review not found!" });
    }
    if (review.userId === req.user.userId) {
      const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: { rating, comment },
      });
      res.json({
        message: "Review updated successfully",
        review: updatedReview,
      });
    } else {
      return res.status(403).json({ error: "You can't update this review!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getTripReviews = async (req, res) => {
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
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createReview,
  updateReview,
  getTripReviews,
};
