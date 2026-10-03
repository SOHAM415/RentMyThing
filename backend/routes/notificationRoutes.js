import express from "express";
import pool from "../config/db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query( "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESc", [req.user.id]);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Error fetching notifications"});
    }
});

export default router;