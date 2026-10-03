import pool from "../config/db.js";

export async function createNotification(userId, message) {
  await pool.query(
    "INSERT INTO notifications (user_id, message) VALUES ($1, $2)",
    [userId, message]
  );
}