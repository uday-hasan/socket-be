import { Router } from "express";
import { authController } from "./auth.controller";

import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "./auth.validation";
import { validateRequest } from "../../middleware/validateRequest";
import { authLimiter } from "../../middleware/rateLimiter";
import { authenticate } from "../../middleware/authenticate";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, confirmPassword]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *               confirmPassword:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       409:
 *         description: Email already exists
 *       422:
 *         description: Validation error
 */
router.post(
  "/register",
  validateRequest(registerSchema),
  authController.register,
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Login successful. Sets accessToken and refreshToken cookies.
 *       401:
 *         description: Invalid credentials
 */
router.post(
  "/login",
  authLimiter,
  validateRequest(loginSchema),
  authController.login,
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Tokens refreshed. New cookies set.
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current session
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices
 */
router.post("/logout-all", authenticate, authController.logoutAll);

/**
 * @swagger
 * /auth/change-password:
 *   patch:
 *     summary: Change password
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.patch(
  "/change-password",
  authenticate,
  validateRequest(changePasswordSchema),
  authController.changePassword,
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User data returned
 *       401:
 *         description: Not authenticated
 */
router.get("/me", authenticate, authController.getMe);
router.get("/users", authenticate, authController.getUsers);

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: Get all users
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User data returned
 *       401:
 *         description: Not authenticated
 */
router.get("/users", authenticate, authController.getUsers);

/**
 * @swagger
 * /auth/profile:
 *   patch:
 *     summary: Update user profile (name)
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Not authenticated
 */
router.patch(
  "/profile",
  authenticate,
  validateRequest(updateProfileSchema),
  authController.updateProfile,
);

export default router;
