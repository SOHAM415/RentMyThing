import "../config/env.js";
import express from "express";
import pool from "../config/db.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import authMiddleware from "../middleware/authMiddleware.js";
import { createNotification } from "../utils/notifications.js";
import { paymentSchema } from "../validations/paymentValidation.js";

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post("/create-order", authMiddleware, async (req, res) => {
   try {
    

    const validation = paymentSchema.safeParse(req.body);
    if(!validation.success){
        return res.status(400).json({
            errors :validation.error.issues
        });
    }
    const { bookingId } = req.body;
    

    const booking = await pool.query( "SELECT * FROM bookings WHERE id = $1 AND user_id =$2", [bookingId, req.user.id]);

    if(booking.rows.length === 0){
        return res.status(404).json({message: "Booking not found"});
    }

    if(booking.rows[0].status !== "pending"){
        return res.status(400).json({message: "Invalid booking status"});
    }

    const amount = booking.rows[0].total_price;

    const order = await razorpay.orders.create({
        amount: amount * 100,
        currency: "INR",
        receipt: "booking_" + bookingId,
    });

    await pool.query( `UPDATE bookings SET payment_order_id = $1, payment_status = 'created' WHERE id = $2`, [order.id, bookingId]);

    res.json(order);

   } catch (error) {
    console.error(error);
    res.status(500).json({message: "create-order failed"});
   }
});



router.post("/verify-payment", authMiddleware, async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment details are required"
            });
        }

        // Generate expected Razorpay signature
        const body =
            razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }

        // Find booking belonging to the logged-in customer
        const bookingResult = await pool.query(
            `SELECT *
             FROM bookings
             WHERE payment_order_id = $1
             AND user_id = $2`,
            [razorpay_order_id, req.user.id]
        );

        if (bookingResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        const booking = bookingResult.rows[0];

        await client.query("BEGIN");

        // Make sure owner_id exists for older bookings too
        const ownerResult = await client.query(
            `SELECT owner_id
             FROM items
             WHERE id = $1`,
            [booking.item_id]
        );

        const ownerId = ownerResult.rows[0]?.owner_id;

        // Update booking
        const updatedBooking = await client.query(
            `UPDATE bookings
             SET status = 'confirmed',
                 payment_id = $1,
                 payment_status = 'paid',
                 owner_id = COALESCE(owner_id, $2)
             WHERE id = $3
             RETURNING *`,
            [
                razorpay_payment_id,
                ownerId,
                booking.id
            ]
        );

        // Save payment record
        await client.query(
            `INSERT INTO payments
             (
                booking_id,
                razorpay_order_id,
                razorpay_payment_id,
                amount,
                currency,
                status
             )
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (razorpay_order_id)
             DO UPDATE SET
                razorpay_payment_id = EXCLUDED.razorpay_payment_id,
                status = EXCLUDED.status`,
            [
                booking.id,
                razorpay_order_id,
                razorpay_payment_id,
                booking.total_price,
                "INR",
                "paid"
            ]
        );

        await client.query("COMMIT");

        // Notifications
        await createNotification(
            booking.user_id,
            "Payment successful. Booking confirmed"
        );

        if (ownerId) {
            await createNotification(
                ownerId,
                "Your item has been confirmed"
            );
        }

        res.json({
            success: true,
            message: "Payment verified and booking confirmed"
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Payment verification error:", error);

        res.status(500).json({
            success: false,
            message: "verify-payment failed"
        });

    } finally {
        client.release();
    }
});
export default router;