import express from "express";

import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
} from "../controllers/userController.js";

import {
  authenticate,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require login.
router.use(authenticate);

// My Profile routes - Admin and Staff.
router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);
router.patch("/me/password", changeMyPassword);

// User Management routes - Admin only.
router.use(authorize("admin"));

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id/status", updateUserStatus);
router.delete("/:id", deleteUser);

export default router;