import type { Request, Response } from "express";
import { authService } from "./auth.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
} from "../../utils/cookie";
import type {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from "./auth.validation";

export const authController = {
  // POST /auth/register
  register: catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = await authService.register(req.body as RegisterInput);

    sendResponse(res, {
      statusCode: 201,
      message: "Account created successfully",
      data: user,
    });
  }),

  // POST /auth/login
  login: catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { user, accessToken, refreshToken } = await authService.login(
      req.body as LoginInput,
    );

    // Set tokens as HttpOnly cookies
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    sendResponse(res, {
      statusCode: 200,
      message: "Logged in successfully",
      data: user,
    });
  }),

  // POST /auth/refresh
  refresh: catchAsync(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies?.refreshToken as string | undefined;

    if (!refreshToken) {
      res
        .status(401)
        .json({ success: false, message: "No refresh token provided" });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshTokens(refreshToken);

    // Set new tokens as cookies
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, newRefreshToken);

    sendResponse(res, {
      statusCode: 200,
      message: "Tokens refreshed successfully",
    });
  }),

  // POST /auth/logout
  logout: catchAsync(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies?.refreshToken as string | undefined;

    await authService.logout(refreshToken);

    // Clear cookies from the browser
    clearAuthCookies(res);

    sendResponse(res, {
      statusCode: 200,
      message: "Logged out successfully",
    });
  }),

  // POST /auth/logout-all
  logoutAll: catchAsync(async (req: Request, res: Response): Promise<void> => {
    await authService.logoutAll(req.user!.userId);

    clearAuthCookies(res);

    sendResponse(res, {
      statusCode: 200,
      message: "Logged out from all devices successfully",
    });
  }),

  // PATCH /auth/change-password
  changePassword: catchAsync(
    async (req: Request, res: Response): Promise<void> => {
      await authService.changePassword(
        req.user!.userId,
        req.body as ChangePasswordInput,
      );

      clearAuthCookies(res);

      sendResponse(res, {
        statusCode: 200,
        message: "Password changed successfully. Please log in again.",
      });
    },
  ),

  // GET /auth/me
  getMe: catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = await authService.getMe(req.user!.userId);

    sendResponse(res, {
      statusCode: 200,
      message: "User fetched successfully",
      data: user,
    });
  }),

  // GET /auth/me
  getUsers: catchAsync(async (req: Request, res: Response): Promise<void> => {
    const users = await authService.getUsers(req.user!.userId);

    sendResponse(res, {
      statusCode: 200,
      message: "Users fetched successfully",
      data: users,
    });
  }),

  // PATCH /auth/profile
  updateProfile: catchAsync(
    async (req: Request, res: Response): Promise<void> => {
      const user = await authService.updateProfile(
        req.user!.userId,
        req.body as UpdateProfileInput,
      );

      sendResponse(res, {
        statusCode: 200,
        message: "Profile updated successfully",
        data: user,
      });
    },
  ),
};
