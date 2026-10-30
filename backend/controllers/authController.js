
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";

import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";

const registerSchema = z.object({
  username: z.string().trim().min(2).max(50),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
}).strict();

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
  rememberMe: z.boolean().optional().default(false),
}).strict();

const ACCESS_TOKEN_EXPIRY = "15m";
const SHORT_SESSION_MS = 8 * 60 * 60 * 1000;
const REMEMBER_SESSION_MS = 30 * 24 * 60 * 60 * 1000;

const COOKIE_NAME = "crm_refresh_token";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/api/auth",
};

const clearRefreshCookie = (res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
};

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const createAccessToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      ver: user.tokenVersion,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    }
  );
};

const safeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
});

const createSession = async (user, rememberMe, res) => {
  const refreshToken = crypto.randomBytes(64).toString("hex");
  const tokenHash = hashToken(refreshToken);

  const sessionDuration = rememberMe
    ? REMEMBER_SESSION_MS
    : SHORT_SESSION_MS;

  const expiresAt = new Date(Date.now() + sessionDuration);

  await RefreshToken.create({
    user: user._id,
    tokenHash,
    expiresAt,
    rememberMe,
  });

  const cookieSettings = { ...cookieOptions };

  // Persistent cookie only when Remember Me is selected.
  if (rememberMe) {
    cookieSettings.maxAge = sessionDuration;
  }

  res.cookie(COOKIE_NAME, refreshToken, cookieSettings);

  return createAccessToken(user);
};

// REGISTER
export const register = async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration data",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { username, password } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Public registration can only create staff accounts.
    const user = await User.create({
      username,
      email,
      password: passwordHash,
      role: "staff",
    });

    const token = await createSession(user, false, res);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: safeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email and password",
      });
    }

    const email = parsed.data.email.toLowerCase();
    const { password, rememberMe } = parsed.data;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = await createSession(user, rememberMe, res);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// REFRESH ACCESS TOKEN

  export const refresh = async (req, res) => {
  try {
    console.log("REFRESH COOKIE DEBUG:", {
      cookieHeaderReceived: Boolean(req.headers.cookie),
      cookiesAvailable: Boolean(req.cookies),
      parsedCookieNames: Object.keys(req.cookies || {}),
      refreshCookieReceived: Boolean(req.cookies?.[COOKIE_NAME]),
    });

    const refreshToken = req.cookies?.[COOKIE_NAME];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const tokenHash = hashToken(refreshToken);

    const existingSession = await RefreshToken.findOne({
      tokenHash,
    }).select("+tokenHash");

    if (!existingSession) {
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message: "Invalid refresh session",
      });
    }

    // A previously rotated token was reused.
    if (existingSession.revokedAt) {
      await RefreshToken.updateMany(
        { user: existingSession.user, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );

      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message: "Session is no longer valid. Please log in again.",
      });
    }

    if (existingSession.expiresAt <= new Date()) {
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    // Atomically consume the old refresh token.
    const consumedSession = await RefreshToken.findOneAndUpdate(
      {
        _id: existingSession._id,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      },
      {
        $set: { revokedAt: new Date() },
      },
      { returnDocument: "after" }
    );

    if (!consumedSession) {
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message: "Session is no longer valid",
      });
    }

    const user = await User.findById(existingSession.user);

    if (!user || !user.isActive) {
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message: "Account is unavailable",
      });
    }

    const newRefreshToken = crypto.randomBytes(64).toString("hex");
    const newTokenHash = hashToken(newRefreshToken);

    const remainingDuration =
      existingSession.expiresAt.getTime() - Date.now();

    const newExpiresAt = new Date(
      Date.now() + remainingDuration
    );

    await RefreshToken.create({
      user: user._id,
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
      rememberMe: existingSession.rememberMe,
    });

    await RefreshToken.updateOne(
      { _id: existingSession._id },
      { $set: { replacedByTokenHash: newTokenHash } }
    );

    const cookieSettings = { ...cookieOptions };

    if (existingSession.rememberMe) {
      cookieSettings.maxAge = remainingDuration;
    }

    res.cookie(COOKIE_NAME, newRefreshToken, cookieSettings);

    const accessToken = createAccessToken(user);

    return res.status(200).json({
      success: true,
      token: accessToken,
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Token refresh error:", error);

    clearRefreshCookie(res);

    return res.status(500).json({
      success: false,
      message: "Unable to refresh session",
    });
  }
};

// LOGOUT
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.[COOKIE_NAME];

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);

      await RefreshToken.updateOne(
        {
          tokenHash,
          revokedAt: null,
        },
        {
          $set: { revokedAt: new Date() },
        }
      );
    }

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    clearRefreshCookie(res);

    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
