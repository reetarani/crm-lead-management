
import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Store only the SHA-256 hash of the refresh token.
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    // Token expiration. MongoDB automatically removes expired documents.
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },

    // Null means the session is currently active.
    revokedAt: {
      type: Date,
      default: null,
    },

    // Hash of the replacement refresh token after rotation.
    replacedByTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    // Whether the user selected Remember Me.
    rememberMe: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Improves queries for active and revoked sessions belonging to a user.
refreshTokenSchema.index({
  user: 1,
  revokedAt: 1,
});

const RefreshToken = mongoose.model(
  "RefreshToken",
  refreshTokenSchema
);

export default RefreshToken;
