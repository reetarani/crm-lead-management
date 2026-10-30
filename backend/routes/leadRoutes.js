
import express from "express";

import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  getTrashLeads,
  restoreLead,
  permanentlyDeleteLead,
} from "../controllers/leadController.js";

import {
  authenticate,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// All lead routes require a valid JWT.
router.use(authenticate);

// Active leads: Admin and Staff
router.get("/", authorize("admin", "staff"), getLeads);
router.post("/", authorize("admin", "staff"), createLead);

// Trash: Admin only
router.get("/trash", authorize("admin"), getTrashLeads);
router.patch("/:id/restore", authorize("admin"), restoreLead);
router.delete("/:id/permanent", authorize("admin"), permanentlyDeleteLead);

// Individual lead operations
router.get("/:id", authorize("admin", "staff"), getLeadById);

// Admin only
router.put("/:id", authorize("admin"), updateLead);
router.delete("/:id", authorize("admin", "staff"), deleteLead);

export default router;
