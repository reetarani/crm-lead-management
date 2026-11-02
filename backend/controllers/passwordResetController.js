
import bcrypt from "bcrypt";
import crypto from "crypto";
import { z } from "zod";

import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().trim().email().max(254),
    }).strict();

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const email = parsed.data.email.toLowerCase();

    const genericResponse = {
      success: true,
      message:
        "If an account exists with this email, a password reset link will be sent.",
    };

    const user = await User.findOne({
      email,
      isActive: true,
    });

    // Do not reveal whether an email is registered.
    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Generate a cryptographically secure reset token.
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.passwordResetTokenHash = hashToken(resetToken);
    user.passwordResetExpiresAt = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await user.save();

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      throw new Error("FRONTEND_URL is not configured");
    }

    const resetUrl =
      `${frontendUrl}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailError) {
      // Remove the reset token if email delivery fails.
      user.passwordResetTokenHash = null;
      user.passwordResetExpiresAt = null;
      await user.save();

      throw emailError;
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process password reset request",
    });
  }
};

// RESET PASSWORD

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const schema = z.object({
      password: z.string().min(8).max(72),
    }).strict();

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Password must contain between 8 and 72 characters",
      });
    }

    const { token } = req.params;

    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/i.test(token)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link",
      });
    }

    const tokenHash = hashToken(token);

    // Find the user with a valid, unexpired reset token.
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
      isActive: true,
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link",
      });
    }

    // Prevent resetting to the same password.
    const samePassword = await bcrypt.compare(
      parsed.data.password,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password",
      });
    }

    // Hash the new password before the atomic database operation.
    const hashedPassword = await bcrypt.hash(
      parsed.data.password,
      12
    );

    const now = new Date();

    // Atomically consume the reset token and update the password.
    // Only one concurrent request can match the still-valid token.
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { $gt: now },
        isActive: true,
      },
      {
        $set: {
          password: hashedPassword,
          passwordChangedAt: now,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        },
        $inc: {
          tokenVersion: 1,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    // No document means the token was already consumed,
    // expired or otherwise invalidated.
    if (!updatedUser) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link",
      });
    }

    // Revoke all existing refresh sessions.
    await RefreshToken.updateMany(
      {
        user: updatedUser._id,
        revokedAt: null,
      },
      {
        $set: { revokedAt: now },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password",
    });
  }
};

