import { z } from "zod";

// ================================
// AUTH VALIDATION SCHEMAS
// Zod schemas for validating auth request bodies.
// These run BEFORE the controller via validateRequest middleware.
// ================================

export const registerSchema = {
  body: z
    .object({
      name: z
        .string({ message: "Name is required" })
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be less than 100 characters")
        .trim(),

      email: z
        .string({ message: "Email is required" })
        .email("Please provide a valid email address")
        .toLowerCase()
        .trim(),

      password: z
        .string({ message: "Password is required" })
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password must be less than 100 characters")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        ),

      confirmPassword: z.string({
        message: "Please confirm your password",
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
};

export const loginSchema = {
  body: z.object({
    email: z
      .string({ message: "Email is required" })
      .email("Please provide a valid email address")
      .toLowerCase()
      .trim(),

    password: z.string({ message: "Password is required" }),
  }),
};

export const changePasswordSchema = {
  body: z
    .object({
      currentPassword: z.string({
        message: "Current password is required",
      }),

      newPassword: z
        .string({ message: "New password is required" })
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password must be less than 100 characters")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        ),

      confirmPassword: z.string({
        message: "Please confirm your new password",
      }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
};

export const updateProfileSchema = {
  body: z.object({
    name: z
      .string({ message: "Name is required" })
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters")
      .trim(),
  }),
};

// Infer TypeScript types from Zod schemas
export type RegisterInput = z.infer<typeof registerSchema.body>;
export type LoginInput = z.infer<typeof loginSchema.body>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema.body>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema.body>;
