import express from "express";
import pool from "../config/db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/*
 * GET reviews for an item
 */
router.get("/items/:id/reviews", async (req, res) => {
  try {
    const itemId = Number(req.params.id);

    const result = await pool.query(
      `
      SELECT
        reviews.id,
        reviews.rating,
        reviews.comment,
        reviews.created_at,
        users.name AS user_name
      FROM reviews
      JOIN users
        ON users.id = reviews.user_id
      WHERE reviews.item_id = $1
      ORDER BY reviews.created_at DESC
      `,
      [itemId]
    );

    const summary = await pool.query(
      `
      SELECT
        COUNT(*)::int AS count,
        COALESCE(ROUND(AVG(rating), 1), 0) AS average
      FROM reviews
      WHERE item_id = $1
      `,
      [itemId]
    );

    res.json({
      reviews: result.rows,
      average: Number(summary.rows[0].average),
      count: summary.rows[0].count,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error fetching reviews",
    });
  }
});


/*
 * POST a review
 */
router.post(
  "/items/:id/reviews",
  authMiddleware,
  async (req, res) => {
    try {
      const itemId = Number(req.params.id);
      const { rating, comment } = req.body;

      const numericRating = Number(rating);

      if (
        !Number.isInteger(numericRating) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        return res.status(400).json({
          message: "Rating must be between 1 and 5",
        });
      }

      /*
       * Find a completed, paid booking made by this user
       * for this item.
       *
       * The rental must also have ended before a review
       * can be submitted.
       */
      const bookingResult = await pool.query(
        `
        SELECT id, start_date, end_date
        FROM bookings
        WHERE item_id = $1
          AND user_id = $2
          AND status = 'confirmed'
          AND payment_status = 'paid'
          AND end_date <= CURRENT_DATE
        ORDER BY end_date DESC
        LIMIT 1
        `,
        [itemId, req.user.id]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(403).json({
          message:
            "You can review this item after completing a paid rental.",
        });
      }

      const booking = bookingResult.rows[0];

      /*
       * Make sure this booking has not already been reviewed.
       */
      const existingReview = await pool.query(
        `
        SELECT id
        FROM reviews
        WHERE booking_id = $1
        `,
        [booking.id]
      );

      if (existingReview.rows.length > 0) {
        return res.status(400).json({
          message:
            "You have already reviewed this rental.",
        });
      }

      const result = await pool.query(
        `
        INSERT INTO reviews
          (booking_id, item_id, user_id, rating, comment)
        VALUES
          ($1, $2, $3, $4, $5)
        RETURNING id, rating, comment, created_at
        `,
        [
          booking.id,
          itemId,
          req.user.id,
          numericRating,
          comment?.trim() || null,
        ]
      );

      res.status(201).json({
        message: "Review submitted",
        review: {
          ...result.rows[0],
          user_name: req.user.name || "User",
        },
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Error creating review",
      });
    }
  }
);

export default router;