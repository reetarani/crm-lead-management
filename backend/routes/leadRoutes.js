
import express from "express";

import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
} from "../controllers/leadController.js";

import {
  authenticate,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// All lead routes require a valid JWT.
router.use(authenticate);

// Admin and staff can view the list and create leads.
router.get("/", authorize("admin", "staff"), getLeads);

// Admin and staff can view an individual lead.
router.get("/:id", authorize("admin", "staff"), getLeadById);

router.post("/", authorize("admin", "staff"), createLead);

// Only admins can update or delete leads.
router.put("/:id", authorize("admin"), updateLead);
router.delete("/:id", authorize("admin"), deleteLead);

export default router;
