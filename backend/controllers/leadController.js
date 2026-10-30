
import Lead from "../models/Lead.js";
import mongoose from "mongoose";

// CREATE LEAD
export const createLead = async (req, res) => {
  try {
    const { name, email, phone, company, source, status } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof phone !== "string" ||
      !phone.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and phone are required.",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const lead = await Lead.create({
      name,
      email,
      phone,
      company,
      source,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid lead data.",
      });
    }

    console.error("Create lead error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create lead.",
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
      message: "Failed to fetch leads.",
    });
  }
};

// GET SINGLE ACTIVE LEAD
export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
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
      message: "Failed to fetch lead.",
    });
  }
};

// UPDATE ACTIVE LEAD
export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID",
      });
    }

    const allowedFields = [
      "name",
      "email",
      "phone",
      "company",
      "source",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.hasOwn(req.body ?? {}, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    if (updates.email !== undefined) {
      if (
        typeof updates.email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
      }

      updates.email = updates.email.trim().toLowerCase();
    }

    const lead = await Lead.findOneAndUpdate(
      {
        _id: id,
        isDeleted: { $ne: true },
      },
      updates,
      {
        new: true,
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
    console.error("Update lead error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update lead",
    });
  }
};

// STEP 1: TEMPORARY DELETE (MOVE TO TRASH)
export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
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
        new: true,
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

// STEP 2: GET TRASH LEADS
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

    if (!mongoose.isValidObjectId(id)) {
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
        new: true,
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

    if (!mongoose.isValidObjectId(id)) {
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
