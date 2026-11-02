
import Lead from "../models/Lead.js";
import mongoose from "mongoose";
import { z } from "zod";

// Allowed values from Lead.js model.
const leadSources = [
  "Website",
  "Referral",
  "Social Media",
  "Cold Call",
  "Other",
];

const leadStatuses = [
  "New",
  "Contacted",
  "Qualified",
  "Converted",
  "Lost",
];

// Reusable field validation.
const nameSchema = z.string().trim().min(1).max(100);

const emailSchema = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());

const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(20)
  .regex(
    /^\+?[\d\s().-]+$/,
    "Please provide a valid phone number"
  );

const companySchema = z.string().trim().max(100);

const sourceSchema = z.enum(leadSources);
const statusSchema = z.enum(leadStatuses);

// CREATE validation.
const createLeadSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  company: companySchema.optional(),
  source: sourceSchema.optional(),
  status: statusSchema.optional(),
}).strict();

// UPDATE validation.
const updateLeadSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  company: companySchema.optional(),
  source: sourceSchema.optional(),
  status: statusSchema.optional(),
}).strict();

// Helper: Validate MongoDB ID.
const isValidId = (id) => mongoose.isValidObjectId(id);

// Helper: Handle Mongoose validation errors.
const isValidationError = (error) =>
  error.name === "ValidationError" ||
  error.name === "CastError";

// CREATE LEAD
export const createLead = async (req, res) => {
  try {
    const parsed = createLeadSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead data",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const lead = await Lead.create(parsed.data);

    return res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead data",
      });
    }

    console.error("Create lead error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create lead",
    });
  }
};

// GET ACTIVE LEADS
export const getLeads = async (req, res) => {
  try {
    const leads = await Lead.find({
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leads.length,
      data: leads,
    });
  } catch (error) {
    console.error("Get leads error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
    });
  }
};

// GET SINGLE ACTIVE LEAD
export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID",
      });
    }

    const lead = await Lead.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error("Get lead by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch lead",
    });
  }
};

// UPDATE ACTIVE LEAD
export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID",
      });
    }

    const parsed = updateLeadSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead update data",
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
        message: "Please provide at least one valid field to update",
      });
    }

    const lead = await Lead.findOneAndUpdate(
      {
        _id: id,
        isDeleted: { $ne: true },
      },
      {
        $set: updates,
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: lead,
    });
  } catch (error) {
    if (isValidationError(error)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead update data",
      });
    }

    console.error("Update lead error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update lead",
    });
  }
};

// TEMPORARY DELETE (MOVE TO TRASH)
export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID",
      });
    }

    const lead = await Lead.findOneAndUpdate(
      {
        _id: id,
        isDeleted: { $ne: true },
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Active lead not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lead moved to Trash successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Move lead to Trash error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to move lead to Trash",
    });
  }
};

// GET TRASH LEADS
export const getTrashLeads = async (req, res) => {
  try {
    const leads = await Lead.find({
      isDeleted: true,
    }).sort({ deletedAt: -1 });

    return res.status(200).json({
      success: true,
      count: leads.length,
      data: leads,
    });
  } catch (error) {
    console.error("Get Trash leads error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Trash leads",
    });
  }
};

// RESTORE LEAD FROM TRASH
export const restoreLead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID",
      });
    }

    const lead = await Lead.findOneAndUpdate(
      {
        _id: id,
        isDeleted: true,
      },
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Deleted lead not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lead restored successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Restore lead error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to restore lead",
    });
  }
};

// PERMANENTLY DELETE LEAD
export const permanentlyDeleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID",
      });
    }

    const lead = await Lead.findOneAndDelete({
      _id: id,
      isDeleted: true,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Deleted lead not found in Trash",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lead permanently deleted",
    });
  } catch (error) {
    console.error("Permanently delete lead error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to permanently delete lead",
    });
  }
};

// GET DASHBOARD STATISTICS
export const getDashboardStats = async (req, res) => {
  try {
    const result = await Lead.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
        },
      },
      {
        $facet: {
          totalLeads: [
            { $count: "count" },
          ],
          statusCounts: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          sourceCounts: [
            {
              $group: {
                _id: "$source",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]);

    const stats = result[0];

    const statuses = [
      "New",
      "Contacted",
      "Qualified",
      "Converted",
      "Lost",
    ];

    const statusCounts = statuses.map((status) => ({
      status,
      count:
        stats.statusCounts.find((item) => item._id === status)?.count || 0,
    }));

    const sourceCounts = stats.sourceCounts.map((item) => ({
      source: item._id,
      count: item.count,
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalLeads: stats.totalLeads[0]?.count || 0,
        statusCounts,
        sourceCounts,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};