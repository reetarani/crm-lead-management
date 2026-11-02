
import express from "express";

import {
  forgotPassword,
  resetPassword,
} from "../controllers/passwordResetController.js";

const router = express.Router();

// Request password reset email
router.post("/forgot", forgotPassword);

// Reset password using email token
router.post("/reset/:token", resetPassword);

export default router;
