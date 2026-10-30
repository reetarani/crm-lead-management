
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import leadRoutes from "./routes/leadRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { authenticate } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "20kb" }));

// Parse cookies before registering API routes.
app.use(cookieParser());

// API routes
app.use("/api/leads", leadRoutes);
app.use("/api/auth", authRoutes);

app.get("/api/auth/me", authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CRM API is running",
  });
});

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`CRM API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start CRM API:", error);
    process.exit(1);
  }
};

startServer();
