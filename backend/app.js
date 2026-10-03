import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import express from "express";
import authRoutes from "./routes/authRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import cors from "cors";
import paymentRoutes from "./routes/paymentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import limiter from "./middleware/rateLimiter.js";
import helmet from "helmet";
import reviewRoutes from "./routes/reviewRoutes.js";
import handoffRoutes from "./routes/handoffRoutes.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(limiter)

app.get("/", (req, res) => {
    res.send("API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api", itemRoutes);
app.use("/api", bookingRoutes);
app.use("/api", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", reviewRoutes);
app.use("/api", handoffRoutes);
export default app;
