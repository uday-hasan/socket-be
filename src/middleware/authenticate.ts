// import type { Request, Response, NextFunction } from "express";
// import { verifyAccessToken } from "../utils/jwt";
// import { AppError } from "../utils/AppError";
// import { prisma } from "../config/database";
// // import { Role } from "@prisma/client";
// import { catchAsync } from "../utils/catchAsync";
// // import { CommonStatus, type Role } from "../generated/prisma/enums";

// // ================================
// // AUTHENTICATE MIDDLEWARE
// // Reads the access token from the HttpOnly cookie,
// // verifies it, and attaches the user info to req.user.
// //
// // Usage:
// //   router.get('/profile', authenticate, getProfile);
// // ================================

// export const authenticate = catchAsync(
//   async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
//     // Get token from cookie
//     const token = req.cookies?.accessToken as string | undefined;

//     if (!token) {
//       throw new AppError(
//         "You are not logged in. Please log in to continue.",
//         401,
//       );
//     }

//     // Verify the token — throws AppError if invalid/expired
//     const decoded = verifyAccessToken(token);

//     // Check if user still exists in DB
//     // (handles the case where user was deleted after token was issued)
//     const user = await prisma.user.findUnique({
//       where: { id: decoded.userId },
//       select: { id: true, role: true, status: true },
//     });

//     if (!user) {
//       throw new AppError(
//         "The user belonging to this token no longer exists.",
//         401,
//       );
//     }

//     if (user.status !== CommonStatus.ACTIVE) {
//       throw new AppError(
//         "Your account has been deactivated. Please contact support.",
//         403,
//       );
//     }

//     // Attach user to request — available in all subsequent handlers
//     req.user = { userId: user.id, role: user.role };

//     next();
//   },
// );

// // ================================
// // AUTHORIZE MIDDLEWARE
// // Restricts access to specific roles.
// // Must be used AFTER authenticate.
// //
// // Usage:
// //   router.delete('/users/:id', authenticate, authorize('ADMIN'), deleteUser);
// // ================================

// export const authorize = (...roles: Role[]) => {
//   return (req: Request, _res: Response, next: NextFunction): void => {
//     if (!req.user) {
//       throw new AppError("You are not authenticated.", 401);
//     }

//     if (!roles.includes(req.user.role as Role)) {
//       throw new AppError(
//         "You do not have permission to perform this action.",
//         403,
//       );
//     }

//     next();
//   };
// };

// export const optionalAuthenticate = catchAsync(
//   async (req: Request, _res: Response, next: NextFunction) => {
//     const token = req.cookies?.accessToken;

//     if (!token) {
//       return next(); // Guest user
//     }

//     try {
//       const decoded = verifyAccessToken(token);

//       const user = await prisma.user.findUnique({
//         where: { id: decoded.userId },
//         select: {
//           id: true,
//           role: true,
//           status: true,
//         },
//       });

//       if (user && user.status === CommonStatus.ACTIVE) {
//         req.user = {
//           userId: user.id,
//           role: user.role,
//         };
//       }
//     } catch {
//       // Invalid or expired token.
//       // Ignore it and continue as guest.
//     }

//     next();
//   },
// );
