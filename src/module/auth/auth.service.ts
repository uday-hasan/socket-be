import bcrypt from "bcryptjs";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  getExpiryDate,
} from "../../utils/jwt";
import { env } from "../../config/env";
import type {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from "./auth.validation";
import { CommonStatus } from "../../generated/prisma/enums";

// ================================
// AUTH SERVICE
// Contains all the business logic for authentication.
// Controllers call these functions — they don't contain any
// business logic themselves, only HTTP handling.
// ================================

export const authService = {
  // ---- REGISTER ----
  async register(data: RegisterInput) {
    const { name, email, password } = data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError("An account with this email already exists", 409);
    }

    // Hash the password (cost factor 12 = good balance of security vs speed)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  },

  // ---- LOGIN ----
  async login(data: LoginInput) {
    const { email, password } = data;

    // Find user (include password for comparison)
    const user = await prisma.user.findUnique({ where: { email } });

    // Use same error message for "user not found" and "wrong password"
    // This prevents email enumeration attacks
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError("Invalid email or password", 401);
    }

    if (user.status !== CommonStatus.ACTIVE) {
      throw new AppError(
        "Your account has been deactivated. Please contact support.",
        403,
      );
    }

    // Generate tokens
    const tokenPayload = { userId: user.id, role: user.role };
    const accessToken = createAccessToken(tokenPayload);
    const refreshToken = createRefreshToken(tokenPayload);

    // Save refresh token in DB (allows us to revoke it later)
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getExpiryDate(env.JWT_REFRESH_EXPIRES_IN),
      },
    });

    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return { user: userWithoutPassword, accessToken, refreshToken };
  },

  // ---- REFRESH TOKENS ----
  async refreshTokens(refreshToken: string) {
    // Verify the refresh token signature
    const decoded = verifyRefreshToken(refreshToken);

    // Check if refresh token exists in DB and hasn't expired
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AppError("Invalid refresh token. Please log in again.", 401);
    }

    if (storedToken.expiresAt < new Date()) {
      // Token expired — delete it from DB
      await prisma.refreshToken.delete({ where: { token: refreshToken } });
      throw new AppError("Refresh token expired. Please log in again.", 401);
    }

    if (storedToken.user.status !== CommonStatus.ACTIVE) {
      throw new AppError("Your account has been deactivated.", 403);
    }

    // Rotate refresh token — delete old, create new (better security)
    await prisma.refreshToken.delete({ where: { token: refreshToken } });

    const tokenPayload = { userId: decoded.userId, role: decoded.role };
    const newAccessToken = createAccessToken(tokenPayload);
    const newRefreshToken = createRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: decoded.userId,
        expiresAt: getExpiryDate(env.JWT_REFRESH_EXPIRES_IN),
      },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  // ---- LOGOUT ----
  async logout(refreshToken: string | undefined) {
    if (refreshToken) {
      // Delete refresh token from DB — invalidates this session
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
  },

  // ---- LOGOUT ALL DEVICES ----
  async logoutAll(userId: string) {
    // Delete ALL refresh tokens for this user — logs out all devices
    await prisma.refreshToken.deleteMany({ where: { userId } });
  },

  // ---- CHANGE PASSWORD ----
  async changePassword(userId: string, data: ChangePasswordInput) {
    const { currentPassword, newPassword } = data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordCorrect) {
      throw new AppError("Current password is incorrect", 400);
    }

    // Prevent using the same password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new AppError(
        "New password must be different from current password",
        400,
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Logout from all devices after password change (security best practice)
    await prisma.refreshToken.deleteMany({ where: { userId } });
  },

  // ---- UPDATE PROFILE ----
  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  },

  // ---- GET CURRENT USER ----
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  },

  async getUsers(userId: string) {
    return await prisma.user.findMany({
      where: { NOT: { id: userId } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },
};
