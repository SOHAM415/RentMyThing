import express from "express";
import pool from "../config/db.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { createNotification } from "../utils/notifications.js";

const router = express.Router();

async function getBookingForUser(bookingId, userId) {
  const result = await pool.query(
    `SELECT
       b.id,
       b.user_id,
       b.item_id,
       b.owner_id,
       b.start_date,
       b.end_date,
       b.total_price,
       b.status,
       b.payment_status,
       b.created_at,
       i.title AS item_title,
       i.city AS item_city,
       i.image_url,
       i.owner_id AS item_owner_id,
       owner.name AS owner_name,
       renter.name AS renter_name
     FROM bookings b
     JOIN items i ON i.id = b.item_id
     JOIN users owner ON owner.id = i.owner_id
     JOIN users renter ON renter.id = b.user_id
     WHERE b.id = $1
       AND (b.user_id = $2 OR i.owner_id = $2)`,
    [bookingId, userId]
  );

  return result.rows[0] || null;
}

async function ensureHandoff(bookingId) {
  await pool.query(
    `INSERT INTO booking_handoffs (booking_id, handoff_code)
     VALUES (
       $1,
       LPAD((FLOOR(RANDOM() * 900000) + 100000)::INT::TEXT, 6, '0')
     )
     ON CONFLICT (booking_id) DO NOTHING`,
    [bookingId]
  );

  const result = await pool.query(
    `SELECT
       id,
       booking_id,
       pickup_location,
       pickup_time,
       instructions,
       handoff_code,
       verified_at
     FROM booking_handoffs
     WHERE booking_id = $1`,
    [bookingId]
  );

  return result.rows[0] || null;
}

router.get("/bookings/:id/room", authMiddleware, async (req, res) => {
  try {
    const booking = await getBookingForUser(
      req.params.id,
      req.user.id
    );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found or not authorized",
      });
    }

    const handoff = await ensureHandoff(booking.id);

    res.json({
      booking: {
        ...booking,
        owner_id: booking.item_owner_id,
      },
      handoff,
    });
  } catch (error) {
    console.error("BOOKING ROOM ERROR:", error);
    res.status(500).json({
      message: "Unable to load booking room",
    });
  }
});

router.get("/bookings/:id/messages", authMiddleware, async (req, res) => {
  try {
    const booking = await getBookingForUser(
      req.params.id,
      req.user.id
    );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found or not authorized",
      });
    }

    const result = await pool.query(
      `SELECT
         m.id,
         m.booking_id,
         m.sender_id,
         m.message,
         m.created_at,
         u.name AS sender_name
       FROM booking_messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.booking_id = $1
       ORDER BY m.created_at ASC, m.id ASC`,
      [booking.id]
    );

    res.json({
      messages: result.rows,
    });
  } catch (error) {
    console.error("BOOKING MESSAGES ERROR:", error);
    res.status(500).json({
      message: "Unable to load booking messages",
    });
  }
});

router.post("/bookings/:id/messages", authMiddleware, async (req, res) => {
  try {
    const booking = await getBookingForUser(
      req.params.id,
      req.user.id
    );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found or not authorized",
      });
    }

    const message = String(req.body.message || "").trim();

    if (!message) {
      return res.status(400).json({
        message: "Message cannot be empty",
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        message: "Message must be 2000 characters or less",
      });
    }

    const result = await pool.query(
      `INSERT INTO booking_messages
       (booking_id, sender_id, message)
       VALUES ($1, $2, $3)
       RETURNING id, booking_id, sender_id, message, created_at`,
      [booking.id, req.user.id, message]
    );

    const sender = await pool.query(
      "SELECT name FROM users WHERE id = $1",
      [req.user.id]
    );

    const recipientId =
      Number(booking.user_id) === Number(req.user.id)
        ? Number(booking.item_owner_id)
        : Number(booking.user_id);

    await createNotification(
      recipientId,
      `${sender.rows[0]?.name || "User"} sent you a booking message for ${booking.item_title}`
    );

    res.status(201).json({
      message: {
        ...result.rows[0],
        sender_name: sender.rows[0]?.name || "User",
      },
    });
  } catch (error) {
    console.error("SEND BOOKING MESSAGE ERROR:", error);
    res.status(500).json({
      message: "Unable to send message",
    });
  }
});

router.patch("/bookings/:id/handoff", authMiddleware, async (req, res) => {
  try {
    const booking = await getBookingForUser(
      req.params.id,
      req.user.id
    );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found or not authorized",
      });
    }

    if (Number(booking.item_owner_id) !== Number(req.user.id)) {
      return res.status(403).json({
        message: "Only the owner can update handoff details",
      });
    }

    const pickupLocation = String(
      req.body.pickup_location || ""
    ).trim();
    const pickupTime = String(
      req.body.pickup_time || ""
    ).trim();
    const instructions = String(
      req.body.instructions || ""
    ).trim();

    if (!pickupLocation) {
      return res.status(400).json({
        message: "Pickup location is required",
      });
    }

    if (pickupLocation.length > 500) {
      return res.status(400).json({
        message: "Pickup location is too long",
      });
    }

    if (instructions.length > 2000) {
      return res.status(400).json({
        message: "Instructions must be 2000 characters or less",
      });
    }

    await ensureHandoff(booking.id);

    const result = await pool.query(
      `UPDATE booking_handoffs
       SET pickup_location = $1,
           pickup_time = $2,
           instructions = $3
       WHERE booking_id = $4
       RETURNING
         id,
         booking_id,
         pickup_location,
         pickup_time,
         instructions,
         handoff_code,
         verified_at`,
      [pickupLocation, pickupTime || null, instructions, booking.id]
    );

    await createNotification(
      Number(booking.user_id),
      `${booking.item_title} pickup details were updated`
    );

    res.json({
      message: "Handoff details updated",
      handoff: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE HANDOFF ERROR:", error);
    res.status(500).json({
      message: "Unable to update handoff details",
    });
  }
});

router.post("/bookings/:id/handoff/verify", authMiddleware, async (req, res) => {
  try {
    const booking = await getBookingForUser(
      req.params.id,
      req.user.id
    );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found or not authorized",
      });
    }

    if (Number(booking.user_id) !== Number(req.user.id)) {
      return res.status(403).json({
        message: "Only the renter can verify the handoff",
      });
    }

    const code = String(req.body.code || "").trim();

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        message: "Enter the 6-digit handoff code",
      });
    }

    const handoff = await ensureHandoff(booking.id);

    if (code !== handoff.handoff_code) {
      return res.status(400).json({
        message: "Incorrect handoff code",
      });
    }

    const result = await pool.query(
      `UPDATE booking_handoffs
       SET verified_at = COALESCE(verified_at, CURRENT_TIMESTAMP)
       WHERE booking_id = $1
       RETURNING
         id,
         booking_id,
         pickup_location,
         pickup_time,
         instructions,
         handoff_code,
         verified_at`,
      [booking.id]
    );

    await createNotification(
      Number(booking.item_owner_id),
      `Handoff verified for ${booking.item_title}`
    );

    res.json({
      message: "Handoff verified successfully",
      handoff: result.rows[0],
    });
  } catch (error) {
    console.error("VERIFY HANDOFF ERROR:", error);
    res.status(500).json({
      message: "Unable to verify handoff",
    });
  }
});

export default router;
