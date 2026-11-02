
import bcrypt from "bcrypt";
import { z } from "zod";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";

const createUserSchema = z.object({
  username: z.string().trim().min(2).max(50),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
}).strict();

const updateUserSchema = z.object({
  username: z.string().trim().min(2).max(50).optional(),
  email: z.string().trim().email().max(254).optional(),
  password: z.string().min(8).max(72).optional(),
  isActive: z.boolean().optional(),
}).strict();

const safeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// GET ALL STAFF USERS
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "staff" })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users: users.map(safeUser),
    });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve users",
    });
  }
};

// GET SINGLE STAFF USER
export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      role: "staff",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Staff user not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }
};

// CREATE STAFF USER
export const createUser = async (req, res) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid user details",
        errors: parsed.error.issues,
      });
    }

    const { username, password } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email address is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      email,
      password: passwordHash,
      role: "staff",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Staff user created successfully",
      user: safeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email address is already registered",
      });
    }

    console.error("Create user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create user",
    });
  }
};

// UPDATE STAFF USER
export const updateUser = async (req, res) => {
  try {
    const parsed = updateUserSchema.safeParse(req.body);

    if (!parsed.success || Object.keys(parsed.data || {}).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid update details",
        errors: parsed.success ? [] : parsed.error.issues,
      });
    }

    const user = await User.findOne({
      _id: req.params.id,
      role: "staff",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Staff user not found",
      });
    }

    const updates = parsed.data;

    if (updates.email) {
      updates.email = updates.email.toLowerCase();

      const existingUser = await User.findOne({
        email: updates.email,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email address is already registered",
        });
      }
    }

    if (updates.password) {
      user.password = await bcrypt.hash(updates.password, 12);
      user.passwordChangedAt = new Date();
      user.tokenVersion += 1;
      delete updates.password;
    }

    Object.assign(user, updates);

    await user.save();

    // Revoke all refresh sessions when password or account status changes.
    if (
      parsed.data.password ||
      parsed.data.isActive === false
    ) {
      await RefreshToken.updateMany(
        { user: user._id, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Staff user updated successfully",
      user: safeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email address is already registered",
      });
    }

    console.error("Update user error:", error);

    return res.status(400).json({
      success: false,
      message: "Unable to update user",
    });
  }
};

// ACTIVATE / DEACTIVATE STAFF USER
export const updateUserStatus = async (req, res) => {
  try {
    const parsed = z.object({
      isActive: z.boolean(),
    }).strict().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "A valid isActive value is required",
      });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: "staff",
      },
      {
        $set: { isActive: parsed.data.isActive },
      },
      { returnDocument: "after", runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Staff user not found",
      });
    }

    if (!parsed.data.isActive) {
      await RefreshToken.updateMany(
        { user: user._id, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );

      await User.updateOne(
        { _id: user._id },
        { $inc: { tokenVersion: 1 } }
      );

      user.tokenVersion += 1;
    }

    return res.status(200).json({
      success: true,
      message: parsed.data.isActive
        ? "Staff user activated successfully"
        : "Staff user deactivated successfully",
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Update user status error:", error);

    return res.status(400).json({
      success: false,
      message: "Unable to update user status",
    });
  }
};

// DELETE STAFF USER
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      role: "staff",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Staff user not found",
      });
    }

    await RefreshToken.updateMany(
      { user: user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      message: "Staff user deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(400).json({
      success: false,
      message: "Unable to delete user",
    });
  }
};

// GET LOGGED-IN USER'S OWN PROFILE
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User not found or account is inactive",
      });
    }

    return res.status(200).json({
      success: true,
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Get my profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve profile",
    });
  }
};

// UPDATE LOGGED-IN USER'S OWN PROFILE
export const updateMyProfile = async (req, res) => {
  try {
    const schema = z.object({
      username: z.string().trim().min(2).max(50).optional(),
      email: z.string().trim().email().max(254).optional(),
    }).strict().refine(
      (data) => Object.keys(data).length > 0,
      { message: "At least one field is required" }
    );

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile details",
        errors: parsed.error.issues,
      });
    }

    const user = await User.findById(req.user.id);

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User not found or account is inactive",
      });
    }

    const updates = parsed.data;

    if (updates.email) {
      updates.email = updates.email.toLowerCase();

      const existingUser = await User.findOne({
        email: updates.email,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email address is already registered",
        });
      }
    }

    Object.assign(user, updates);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: safeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email address is already registered",
      });
    }

    console.error("Update my profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
};

// CHANGE LOGGED-IN USER'S OWN PASSWORD
export const changeMyPassword = async (req, res) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1).max(72),
      newPassword: z.string().min(8).max(72),
    }).strict();

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid current and new password",
        errors: parsed.error.issues,
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User not found or account is inactive",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      parsed.data.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const isSamePassword = await bcrypt.compare(
      parsed.data.newPassword,
      user.password
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    user.password = await bcrypt.hash(parsed.data.newPassword, 12);
    user.passwordChangedAt = new Date();
    user.tokenVersion += 1;

    await user.save();

    // Revoke all existing refresh-token sessions.
    await RefreshToken.updateMany(
      { user: user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Change my password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change password",
    });
  }
};