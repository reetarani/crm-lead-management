
import mongoose from "mongoose";

const followUpSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },

    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // Tracks whether due reminders have been emailed.
    reminderSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Useful for finding pending reminders efficiently.
followUpSchema.index({
  status: 1,
  scheduledAt: 1,
  reminderSentAt: 1,
});

const FollowUp = mongoose.model("FollowUp", followUpSchema);

export default FollowUp;
