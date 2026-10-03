import express from "express";
import pool from "../config/db.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { bookingSchema } from "../validations/bookingValidation.js";
import { createNotification } from "../utils/notifications.js";

const router = express.Router();

router.post("/bookings", authMiddleware, async (req, res) => {
  try {


    const validation = bookingSchema.safeParse(req.body);

    if(!validation.success){
      return res.status(400).json({
        errors: validation.error.issues,
      });
    }


    const { item_id, start_date, end_date } = req.body;

    if (!item_id || !start_date || !end_date) {
      return res.status(400).json({ message: "All fields required" });
    }

 const start = new Date(start_date);
const end = new Date(end_date);

if (isNaN(start) || isNaN(end)) {
  return res.status(400).json({ message: "Invalid date format" });
}

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    const item = await pool.query(
      "SELECT * FROM items WHERE id = $1",
      [item_id]
    );

    if (item.rows.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    //  prevent self booking
    if (item.rows[0].owner_id === req.user.id) {
      return res.status(400).json({ message: "You cannot book your own item" });
    }

    const overlap = await pool.query(
  `SELECT * FROM bookings 
   WHERE item_id = $1 
   AND status IN ('pending', 'confirmed')
   AND (start_date <= $3 AND end_date >= $2)`,
  [item_id, start_date, end_date]
);

    if (overlap.rows.length > 0) {
      return res.status(400).json({
        message: "Item already booked for these dates"
      });
    }

    const price = item.rows[0].price_per_day;

    const days =
      Math.ceil(
        (new Date(end_date) - new Date(start_date)) /
        (1000 * 60 * 60 * 24)
      ) + 1;

    const total_price = price * days;

    const result = await pool.query(
  `INSERT INTO bookings 
   (user_id, item_id, owner_id, start_date, end_date, total_price) 
   VALUES ($1, $2, $3, $4, $5, $6) 
   RETURNING *`,
  [
    req.user.id,
    item_id,
    item.rows[0].owner_id,
    start_date,
    end_date,
    total_price
  ]
);

    await createNotification(
    item.rows[0].owner_id,
    `${req.user.email} booked your item ${item.rows[0].title}`
);

    res.json({
      message: "Booking created",
      booking: result.rows[0],
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error creating booking" });
  }
});

router.get("/my-bookings", authMiddleware, async (req,res) => {
  try {
    const result = await pool.query(`SELECT bookings.*, items.title, items.city FROM bookings JOIN items ON bookings.item_id = items.id WHERE bookings.user_id = $1`, [req.user.id]);

    res.json({
      bookings: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Error fetching bookings"});
  }
});

router.patch("/bookings/:id/cancel", authMiddleware, async (req, res) =>
{
  try {
    const bookingId = req.params.id;

    const booking = await pool.query(
      "SELECT * FROM bookings WHERE id = $1", [bookingId]
    );

    if(booking.rows.length === 0){
      return res.status(404).json({message: "Booking not found"});
    }

    if(booking.rows[0].user_id != req.user.id){
      return res.status(403).json({message:"Not authorized"});
    }

    const updated = await pool.query(
      "UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING *", [bookingId]
    );

    res.json({message: "Booking cancelled",
      booking: updated.rows[0],
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Error cancelling booking"});
  }
});

router.get("/owner-bookings", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         bookings.id,
         bookings.item_id,
         bookings.user_id,
         bookings.owner_id,
         bookings.start_date,
         bookings.end_date,
         bookings.total_price,
         bookings.status,
         bookings.payment_status,
         items.title AS item_title
       FROM bookings
       JOIN items ON bookings.item_id = items.id
       WHERE items.owner_id = $1
       ORDER BY bookings.start_date DESC`,
      [req.user.id]
    );

    res.json({
      bookings: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching owner bookings",
    });
  }
});

router.get("/items/:id/bookings", async (req, res) => {
  try {
    const itemId = req.params.id;
    const result = await pool.query(
      `SELECT start_date, end_date FROM bookings WHERE item_id =$1`, [itemId]
    );
    res.json({
      booked_dates:result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Error fetching booked dates"});
  }
  
});

router.patch("/bookings/:id/confirm", authMiddleware, async (req, res) => {
  try {
    const bookingId = req.params.id;

    const booking = await pool.query("SELECT * FROM bookings WHERE id = $1", [bookingId]);

    if(booking.rows.length === 0){
      return res.status(404).json({message: "Booking not found"});
    }

    const item = await pool.query("SELECT * FROM items WHERE id = $1", [booking.rows[0].item_id]);

    if(item.rows[0].owner_id !== req.user.id){
      return res.status(403).json({message: "Not authorized"});
    }

    const updated = await pool.query("UPDATE bookings SET status = 'confirmed' WHERE id = $1 RETURNING *", [bookingId]);

    res.json({message:"Booking confirmed",
      booking: updated.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Error confirming booking"});
  }
  });
export default router;
