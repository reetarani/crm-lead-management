
import express from "express";

import {
  createFollowUp,
  getFollowUps,
  getFollowUpDashboard,
  getFollowUpById,
  updateFollowUp,
  completeFollowUp,
  cancelFollowUp,
  deleteFollowUp,
} from "../controllers/followUpController.js";

import {
  authenticate,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// All follow-up routes require authentication.
router.use(authenticate);

// Dashboard must be registered before /:id.
router.get(
  "/dashboard",
  authorize("admin", "staff"),
  getFollowUpDashboard
);

router.get(
  "/",
  authorize("admin", "staff"),
  getFollowUps
);

router.post(
  "/",
  authorize("admin", "staff"),
  createFollowUp
);

router.get(
  "/:id",
  authorize("admin", "staff"),
  getFollowUpById
);

router.put(
  "/:id",
  authorize("admin", "staff"),
  updateFollowUp
);

router.patch(
  "/:id/complete",
  authorize("admin", "staff"),
  completeFollowUp
);

router.patch(
  "/:id/cancel",
  authorize("admin", "staff"),
  cancelFollowUp
);

router.delete(
  "/:id",
  authorize("admin", "staff"),
  deleteFollowUp
);

export default router;
