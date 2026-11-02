
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import leadRoutes from "./routes/leadRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { authenticate } from "./middleware/authMiddleware.js";
import userRoutes from "./routes/userRoutes.js";
import passwordResetRoutes from "./routes/passwordResetRoutes.js";
import followUpRoutes from "./routes/followUpRoutes.js";
import {
  startFollowUpScheduler,
} from "./services/followUpScheduler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const frontendUrl =
  process.env.FRONTEND_URL || "http://localhost:5173";

const isProduction = process.env.NODE_ENV === "production";

// Do not trust proxy headers on localhost.
app.set("trust proxy", false);

// SECURITY HEADERS
app.use(helmet());

// CORS CONFIGURATION
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// REQUEST BODY LIMIT
app.use(express.json({ limit: "20kb" }));

// COOKIE PARSER
app.use(cookieParser());

// API ROUTES
app.use("/api/leads", leadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/password-reset", passwordResetRoutes);
app.use("/api/follow-ups", followUpRoutes);

// AUTHENTICATED USER
app.get("/api/auth/me", authenticate, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "CRM API is running",
  });
});

// MALFORMED JSON ERROR HANDLER
app.use((error, req, res, next) => {
  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    "body" in error
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body",
    });
  }

  next(error);
});

// GLOBAL ERROR HANDLER
app.use((error, req, res, next) => {
  console.error("Unhandled application error:", error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    success: false,
    message: "An internal server error occurred",
  });
});

// START SERVER
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`CRM API running on port ${PORT}`);

      startFollowUpScheduler();
    });
  } catch (error) {
    console.error("Failed to start CRM API:", error);
    process.exit(1);
  }
};

startServer();
