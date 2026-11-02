
import mongoose from "mongoose";
import { z } from "zod";

import FollowUp from "../models/FollowUp.js";
import Lead from "../models/Lead.js";

// Validation schemas
const objectIdSchema = z.string().refine(
  (value) => mongoose.isValidObjectId(value),
  "Invalid ID"
);

const createFollowUpSchema = z.object({
  leadId: objectIdSchema,
  scheduledAt: z.string().datetime({ offset: true }),
  note: z.string().trim().min(1).max(1000),
}).strict();

const updateFollowUpSchema = z.object({
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  note: z.string().trim().min(1).max(1000).optional(),
}).strict();

// Populate common follow-up information
const populateFollowUp = (query) =>
  query
    .populate("lead", "name email phone company source status")
    .populate("createdBy", "username email role");

// CREATE FOLLOW-UP
export const createFollowUp = async (req, res) => {
  try {
    const parsed = createFollowUpSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid follow-up data",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { leadId, scheduledAt, note } = parsed.data;

    const lead = await Lead.findOne({
      _id: leadId,
      isDeleted: { $ne: true },
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Active lead not found",
      });
    }

    const followUp = await FollowUp.create({
      lead: leadId,
      createdBy: req.user.id,
      scheduledAt: new Date(scheduledAt),
      note,
    });

    const populatedFollowUp = await populateFollowUp(
      FollowUp.findById(followUp._id)
    );

    return res.status(201).json({
      success: true,
      message: "Follow-up scheduled successfully",
      data: populatedFollowUp,
    });
  } catch (error) {
    console.error("Create follow-up error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to schedule follow-up",
    });
  }
};

// GET ALL FOLLOW-UPS
export const getFollowUps = async (req, res) => {
  try {
    const { status, leadId } = req.query;

    const filter = {};

    if (status) {
      if (!["pending", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid follow-up status",
        });
      }

      filter.status = status;
    }

    if (leadId) {
      if (!mongoose.isValidObjectId(leadId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid lead ID",
        });
      }

      filter.lead = leadId;
    }

    const followUps = await populateFollowUp(
      FollowUp.find(filter).sort({ scheduledAt: 1 })
    );

    return res.status(200).json({
      success: true,
      count: followUps.length,
      data: followUps,
    });
  } catch (error) {
    console.error("Get follow-ups error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch follow-ups",
    });
  }
};

// GET FOLLOW-UP DASHBOARD
export const getFollowUpDashboard = async (req, res) => {
  try {
    const now = new Date();

    // Today's boundaries use the backend server's local timezone.
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const upcomingEnd = new Date(tomorrowStart);
    upcomingEnd.setDate(upcomingEnd.getDate() + 7);

    const baseFilter = { status: "pending" };

    const [today, upcoming, overdue] = await Promise.all([
      populateFollowUp(
        FollowUp.find({
          ...baseFilter,
          scheduledAt: {
            $gte: todayStart,
            $lt: tomorrowStart,
          },
        }).sort({ scheduledAt: 1 })
      ),

      populateFollowUp(
        FollowUp.find({
          ...baseFilter,
          scheduledAt: {
            $gte: tomorrowStart,
            $lt: upcomingEnd,
          },
        }).sort({ scheduledAt: 1 })
      ),

      populateFollowUp(
        FollowUp.find({
          ...baseFilter,
          scheduledAt: { $lt: todayStart },
        }).sort({ scheduledAt: 1 })
      ),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        today,
        upcoming,
        overdue,
        counts: {
          today: today.length,
          upcoming: upcoming.length,
          overdue: overdue.length,
        },
      },
    });
  } catch (error) {
    console.error("Follow-up dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch follow-up dashboard",
    });
  }
};

// GET SINGLE FOLLOW-UP
export const getFollowUpById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid follow-up ID",
      });
    }

    const followUp = await populateFollowUp(
      FollowUp.findById(id)
    );

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: "Follow-up not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: followUp,
    });
  } catch (error) {
    console.error("Get follow-up error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch follow-up",
    });
  }
};

// UPDATE FOLLOW-UP
export const updateFollowUp = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid follow-up ID",
      });
    }

    const parsed = updateFollowUpSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid follow-up update data",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const updates = parsed.data;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const existing = await FollowUp.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Follow-up not found",
      });
    }

    if (existing.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending follow-ups can be edited",
      });
    }

    if (updates.scheduledAt) {
      updates.scheduledAt = new Date(updates.scheduledAt);

      // A changed schedule requires a new reminder.
      existing.reminderSentAt = null;
    }

    Object.assign(existing, updates);

    await existing.save();

    const updatedFollowUp = await populateFollowUp(
      FollowUp.findById(id)
    );

    return res.status(200).json({
      success: true,
      message: "Follow-up updated successfully",
      data: updatedFollowUp,
    });
  } catch (error) {
    console.error("Update follow-up error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update follow-up",
    });
  }
};

// COMPLETE FOLLOW-UP
export const completeFollowUp = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid follow-up ID",
      });
    }

    const followUp = await FollowUp.findOneAndUpdate(
      {
        _id: id,
        status: "pending",
      },
      {
        $set: {
          status: "completed",
          completedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: "Pending follow-up not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Follow-up completed successfully",
      data: followUp,
    });
  } catch (error) {
    console.error("Complete follow-up error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete follow-up",
    });
  }
};

// CANCEL FOLLOW-UP
export const cancelFollowUp = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid follow-up ID",
      });
    }

    const followUp = await FollowUp.findOneAndUpdate(
      {
        _id: id,
        status: "pending",
      },
      {
        $set: {
          status: "cancelled",
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: "Pending follow-up not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Follow-up cancelled successfully",
      data: followUp,
    });
  } catch (error) {
    console.error("Cancel follow-up error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel follow-up",
    });
  }
};

// DELETE FOLLOW-UP
export const deleteFollowUp = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid follow-up ID",
      });
    }

    const followUp = await FollowUp.findByIdAndDelete(id);

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: "Follow-up not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Follow-up deleted successfully",
    });
  } catch (error) {
    console.error("Delete follow-up error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete follow-up",
    });
  }
};
